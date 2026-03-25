from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional

from agent.qwen_client import QwenClient
from agent.tools_registry import call_registered_tool


UTC = timezone.utc


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _parse_iso8601(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _format_money(value: float) -> str:
    return f"${value:,.2f}"


def _format_percent(value: float) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.2f}%"


@dataclass
class AgentRunResult:
    brief: str
    structured_data: Dict[str, Any]


class InsightEngine:
    """Small summarization layer that can later be swapped for an LLM."""

    POSITIVE_KEYWORDS = {
        "gm",
        "great",
        "bullish",
        "love",
        "nice",
        "thanks",
        "strong",
        "ship",
        "shipped",
        "amazing",
        "wen",
        "moon",
        "up",
    }
    NEGATIVE_KEYWORDS = {
        "bad",
        "bearish",
        "rug",
        "scam",
        "angry",
        "issue",
        "problem",
        "down",
        "dump",
        "dead",
        "slow",
        "delay",
    }

    def analyze_community(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not messages:
            return {
                "message_count": 0,
                "sentiment": "Neutral",
                "summary": "No recent Telegram messages were available for analysis.",
            }

        positive_hits = 0
        negative_hits = 0
        themes: List[str] = []

        for message in messages:
            text = (message.get("text") or "").lower()
            if not text:
                continue

            if any(keyword in text for keyword in self.POSITIVE_KEYWORDS):
                positive_hits += 1
            if any(keyword in text for keyword in self.NEGATIVE_KEYWORDS):
                negative_hits += 1

            if "launch" in text or "release" in text:
                themes.append("product launch chatter")
            if "price" in text or "token" in text:
                themes.append("token price discussion")
            if "bug" in text or "issue" in text:
                themes.append("support requests")
            if "partnership" in text:
                themes.append("partnership interest")

        if negative_hits > positive_hits:
            sentiment = "Negative"
        elif positive_hits > negative_hits:
            sentiment = "Positive"
        else:
            sentiment = "Neutral"

        deduped_themes = list(dict.fromkeys(themes))
        if deduped_themes:
            summary = (
                f"Community discussion centered on {', '.join(deduped_themes[:3])}."
            )
        else:
            summary = "Community activity was steady without a dominant theme."

        if sentiment == "Negative":
            summary += " Tone skewed cautious and may require founder visibility."
        elif sentiment == "Positive":
            summary += " Tone remained constructive and supportive."

        return {
            "message_count": len(messages),
            "sentiment": sentiment,
            "summary": summary,
        }

    def build_alerts(
        self,
        github_data: Dict[str, Any],
        wallet_data: Dict[str, Any],
        price_data: Dict[str, Any],
        community_data: Dict[str, Any],
        config: Dict[str, Any],
    ) -> List[str]:
        alerts: List[str] = []
        alert_config = config.get("alerts", {})
        no_commit_days = alert_config.get("no_commit_days", 3)
        large_tx_threshold_usd = float(alert_config.get("large_transaction_usd", 10000))

        commit_count = github_data.get("commit_count_24h", 0)
        last_commit_at = _parse_iso8601(github_data.get("last_commit_at"))
        if commit_count == 0:
            alerts.append("No code commits landed in the last 24 hours.")
        if last_commit_at:
            hours_since_commit = (_now_utc() - last_commit_at).total_seconds() / 3600
            if hours_since_commit >= no_commit_days * 24:
                alerts.append(f"No commits detected for {no_commit_days}+ days.")

        largest_tx = wallet_data.get("largest_transaction_24h")
        if largest_tx and largest_tx.get("usd_value", 0.0) >= large_tx_threshold_usd:
            direction = largest_tx.get("direction", "unknown")
            alerts.append(
                f"Large {direction} transaction detected: {_format_money(largest_tx['usd_value'])}."
            )

        if community_data.get("sentiment") == "Negative":
            alerts.append("Telegram sentiment turned negative in the last 24 hours.")

        price_change = float(price_data.get("change_24h_pct", 0.0))
        if price_change <= -10:
            alerts.append(f"Token price is down sharply over 24h ({_format_percent(price_change)}).")

        if not alerts:
            alerts.append("No unusual activity detected.")

        return alerts


class ClawFounderAgent:
    SYSTEM_PROMPT = (
        "You are ClawFounder, an AI Chief of Staff for a crypto founder.\n"
        "You monitor code activity, treasury, and community signals.\n"
        "You report insights, not raw data.\n"
        "Highlight risks, anomalies, and important changes."
    )

    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
        self.insight_engine = InsightEngine()
        self.qwen_client = QwenClient(config.get("llm", {}))

    def run(self) -> AgentRunResult:
        price_response = self._call_tool("get_token_price")
        github_response = self._call_tool("get_github_activity")
        wallet_response = self._call_tool(
            "get_wallet_data",
            {
                "price_data": price_response.get("data", {}),
            },
        )
        telegram_response = self._call_tool(
            "get_telegram_activity",
            {"hours": self.config.get("telegram", {}).get("lookback_hours", 24)},
        )

        github_data = github_response.get("data", {})
        price_data = price_response.get("data", {})
        wallet_data = wallet_response.get("data", {})
        telegram_messages = telegram_response.get("data", {}).get("messages", [])
        community_data = self.insight_engine.analyze_community(telegram_messages)
        alerts = self.insight_engine.build_alerts(
            github_data=github_data,
            wallet_data=wallet_data,
            price_data=price_data,
            community_data=community_data,
            config=self.config,
        )

        fallback_brief = self._build_daily_brief(
            github_data=github_data,
            wallet_data=wallet_data,
            price_data=price_data,
            community_data=community_data,
            alerts=alerts,
        )
        brief = self._build_llm_brief(
            github_data=github_data,
            wallet_data=wallet_data,
            price_data=price_data,
            community_data=community_data,
            alerts=alerts,
            fallback_brief=fallback_brief,
        )

        return AgentRunResult(
            brief=brief,
            structured_data={
                "system_prompt": self.SYSTEM_PROMPT,
                "tool_responses": {
                    "github": github_response,
                    "price": price_response,
                    "wallet": wallet_response,
                    "telegram": telegram_response,
                },
                "github": github_data,
                "wallet": wallet_data,
                "price": price_data,
                "community": community_data,
                "alerts": alerts,
            },
        )

    def send_brief(self, brief: str) -> Dict[str, Any]:
        return self._call_tool("send_telegram_message", {"text": brief})

    def _call_tool(self, tool_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        tool_payload = {"config": self.config}
        if payload:
            tool_payload.update(payload)
        return call_registered_tool(tool_name, tool_payload)

    def _build_llm_brief(
        self,
        github_data: Dict[str, Any],
        wallet_data: Dict[str, Any],
        price_data: Dict[str, Any],
        community_data: Dict[str, Any],
        alerts: List[str],
        fallback_brief: str,
    ) -> str:
        prompt = "\n".join(
            [
                "Create the final founder brief using the required structure.",
                "Report insights and risks, not raw payload dumps.",
                "Return only the formatted brief.",
                "",
                f"GitHub summary: {json.dumps(github_data)}",
                f"Wallet summary: {json.dumps(wallet_data)}",
                f"Price summary: {json.dumps(price_data)}",
                f"Community summary: {json.dumps(community_data)}",
                f"Alerts: {json.dumps(alerts)}",
            ]
        )
        generated = self.qwen_client.generate_brief(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=prompt,
        )
        return generated or fallback_brief

    def _build_daily_brief(
        self,
        github_data: Dict[str, Any],
        wallet_data: Dict[str, Any],
        price_data: Dict[str, Any],
        community_data: Dict[str, Any],
        alerts: List[str],
    ) -> str:
        now = _now_utc().strftime("%Y-%m-%d")
        last_commit_at = _parse_iso8601(github_data.get("last_commit_at"))
        if last_commit_at:
            last_commit_hours = int((_now_utc() - last_commit_at).total_seconds() // 3600)
            last_commit_text = f"{last_commit_hours} hours ago"
        else:
            last_commit_text = "No recent commits"

        wallet_balance_usd = float(wallet_data.get("balance_usd", 0.0))
        treasury_change_pct = float(wallet_data.get("balance_change_pct_24h", 0.0))
        largest_tx_usd = 0.0
        if wallet_data.get("largest_transaction_24h"):
            largest_tx_usd = float(wallet_data["largest_transaction_24h"].get("usd_value", 0.0))

        alert_lines = "\n".join(f"- {item}" for item in alerts)

        return (
            f"ClawFounder Daily Brief — {now}\n\n"
            f"Code Activity:\n"
            f"- Commits: {github_data.get('commit_count_24h', 0)}\n"
            f"- New PRs: {github_data.get('pull_request_count_24h', 0)}\n"
            f"- New Issues: {github_data.get('issue_count_24h', 0)}\n"
            f"- Last commit: {last_commit_text}\n\n"
            f"Treasury:\n"
            f"- Wallet Balance: {_format_money(wallet_balance_usd)}\n"
            f"- Change (24h): {_format_percent(treasury_change_pct)}\n"
            f"- Largest Transaction: {_format_money(largest_tx_usd)}\n\n"
            f"Community:\n"
            f"- Messages (24h): {community_data.get('message_count', 0)}\n"
            f"- Sentiment: {community_data.get('sentiment', 'Neutral')}\n"
            f"- Summary: {community_data.get('summary', 'No summary available.')}\n\n"
            f"Alerts:\n"
            f"{alert_lines}"
        )
