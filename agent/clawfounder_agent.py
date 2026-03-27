from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import statistics
from typing import Any, Dict, List, Optional

from agent.memory_store import MemoryStore
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
        memory_config = config.get("memory", {})
        self.memory_store = MemoryStore(memory_config.get("db_path", "data/clawfounder_memory.db"))

    def run(self) -> AgentRunResult:
        previous_run = self.memory_store.get_latest_run()
        recent_runs = self.memory_store.get_recent_runs(
            limit=int(self.config.get("memory", {}).get("recent_runs_limit", 5))
        )
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
        alerts.extend(
            self._build_tool_health_alerts(
                github_response=github_response,
                price_response=price_response,
                wallet_response=wallet_response,
                telegram_response=telegram_response,
            )
        )
        memory_context = self._build_memory_context(
            previous_run=previous_run,
            recent_runs=recent_runs,
            github_data=github_data,
            wallet_data=wallet_data,
            price_data=price_data,
            community_data=community_data,
            alerts=alerts,
        )

        fallback_brief = self._build_daily_brief(
            github_data=github_data,
            wallet_data=wallet_data,
            price_data=price_data,
            community_data=community_data,
            alerts=alerts,
            memory_context=memory_context,
        )
        brief = self._build_llm_brief(
            github_data=github_data,
            wallet_data=wallet_data,
            price_data=price_data,
            community_data=community_data,
            alerts=alerts,
            memory_context=memory_context,
            fallback_brief=fallback_brief,
        )

        persisted_snapshot = {
            "github": github_data,
            "wallet": wallet_data,
            "price": price_data,
            "community": community_data,
            "alerts": alerts,
            "memory_context": memory_context,
        }
        saved_run = self.memory_store.save_run(brief=brief, snapshot=persisted_snapshot)

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
                "memory": {
                    "previous_run": previous_run,
                    "comparison": memory_context,
                    "saved_run": saved_run,
                },
            },
        )

    def _build_tool_health_alerts(
        self,
        github_response: Dict[str, Any],
        price_response: Dict[str, Any],
        wallet_response: Dict[str, Any],
        telegram_response: Dict[str, Any],
    ) -> List[str]:
        source_map = {
            "GitHub": github_response,
            "Price": price_response,
            "Wallet": wallet_response,
            "Telegram": telegram_response,
        }
        health_alerts: List[str] = []
        for source_name, response in source_map.items():
            status = (response or {}).get("status")
            if status == "ok":
                continue
            error = (response or {}).get("error") or "unknown error"
            health_alerts.append(
                f"{source_name} data source failed ({error}). Metrics may be incomplete."
            )
        return health_alerts

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
        memory_context: Dict[str, Any],
        fallback_brief: str,
    ) -> str:
        prompt = "\n".join(
            [
                "Create the final founder brief using the required structure.",
                "Report insights and risks, not raw payload dumps.",
                "Use memory and change detection to explain what changed since the last run.",
                "Write like a concise Chief of Staff, not like a dashboard.",
                "Use founder baseline behavior and highlight only anomalous movements.",
                "Return only the formatted brief.",
                "",
                f"GitHub summary: {json.dumps(github_data)}",
                f"Wallet summary: {json.dumps(wallet_data)}",
                f"Price summary: {json.dumps(price_data)}",
                f"Community summary: {json.dumps(community_data)}",
                f"Alerts: {json.dumps(alerts)}",
                f"Memory context: {json.dumps(memory_context)}",
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
        memory_context: Dict[str, Any],
    ) -> str:
        now = _now_utc().strftime("%Y-%m-%d")
        alert_lines = "\n".join(f"- {item}" for item in alerts[:4])
        code_lines = "\n".join(f"- {line}" for line in memory_context["code_activity"])
        treasury_lines = "\n".join(f"- {line}" for line in memory_context["treasury"])
        community_lines = "\n".join(f"- {line}" for line in memory_context["community"])
        priority_lines = "\n".join(f"- {line}" for line in memory_context["priorities"])
        memory_lines = "\n".join(f"- {line}" for line in memory_context["memory_notes"])
        moat_lines = "\n".join(f"- {line}" for line in memory_context["moat_signals"])

        return (
            f"ClawFounder Daily Brief — {now}\n\n"
            f"Code Activity:\n"
            f"{code_lines}\n\n"
            f"Treasury:\n"
            f"{treasury_lines}\n\n"
            f"Community:\n"
            f"{community_lines}\n\n"
            f"Alerts:\n"
            f"{alert_lines}\n\n"
            f"Priorities:\n"
            f"{priority_lines}\n\n"
            f"Founder Memory Graph:\n"
            f"{moat_lines}\n\n"
            f"Memory:\n"
            f"{memory_lines}"
        )

    def _build_memory_context(
        self,
        previous_run: Optional[Dict[str, Any]],
        recent_runs: List[Dict[str, Any]],
        github_data: Dict[str, Any],
        wallet_data: Dict[str, Any],
        price_data: Dict[str, Any],
        community_data: Dict[str, Any],
        alerts: List[str],
    ) -> Dict[str, Any]:
        previous_snapshot = previous_run.get("snapshot", {}) if previous_run else {}
        previous_github = previous_snapshot.get("github", {})
        previous_wallet = previous_snapshot.get("wallet", {})
        previous_community = previous_snapshot.get("community", {})
        previous_alerts = previous_snapshot.get("alerts", [])

        code_activity = [
            self._describe_code_activity(github_data, previous_github),
            self._describe_development_risk(github_data),
        ]
        treasury = [
            self._describe_treasury(wallet_data, previous_wallet, price_data),
            self._describe_transaction_risk(wallet_data),
        ]
        community = [
            self._describe_community(community_data, previous_community),
            community_data.get("summary", "Community activity was limited today."),
        ]

        priorities = [
            line
            for line in [
                self._build_priority_from_alerts(alerts),
                self._build_priority_from_activity(github_data, community_data),
                self._build_priority_from_treasury(wallet_data),
            ]
            if line
        ]
        if not priorities:
            priorities.append("No immediate intervention needed; keep monitoring for trend changes.")

        memory_notes = []
        if previous_run:
            previous_time = previous_run.get("created_at", "previous run")
            memory_notes.append(f"Compared against the last saved run from {previous_time}.")
        else:
            memory_notes.append("This is the first saved run, so future briefs will include stronger trend context.")

        repeated_alerts = sorted(set(alerts).intersection(previous_alerts))
        if repeated_alerts:
            memory_notes.append(f"Repeated risk carried over: {repeated_alerts[0]}")
        else:
            memory_notes.append("No repeated alert pattern was carried over from the prior run.")

        moat_signals = self._build_moat_signals(
            recent_runs=recent_runs,
            github_data=github_data,
            wallet_data=wallet_data,
            community_data=community_data,
            alerts=alerts,
        )

        return {
            "code_activity": code_activity,
            "treasury": treasury,
            "community": community,
            "priorities": priorities,
            "moat_signals": moat_signals,
            "memory_notes": memory_notes,
            "previous_run_available": previous_run is not None,
        }

    def _build_moat_signals(
        self,
        recent_runs: List[Dict[str, Any]],
        github_data: Dict[str, Any],
        wallet_data: Dict[str, Any],
        community_data: Dict[str, Any],
        alerts: List[str],
    ) -> List[str]:
        historical_snapshots = [run.get("snapshot", {}) for run in recent_runs if run.get("snapshot")]
        if not historical_snapshots:
            return [
                "Baseline is initializing. After a few runs, anomaly scoring will become founder-specific.",
            ]

        commit_history = self._extract_numeric_series(historical_snapshots, "github", "commit_count_24h")
        message_history = self._extract_numeric_series(historical_snapshots, "community", "message_count")
        tx_history = self._extract_largest_tx_series(historical_snapshots)

        commit_signal = self._build_anomaly_signal(
            label="Code output",
            current=float(github_data.get("commit_count_24h", 0)),
            history=commit_history,
            higher_is_risk=False,
            low_description="below founder baseline",
            high_description="above founder baseline",
        )
        community_signal = self._build_anomaly_signal(
            label="Community volume",
            current=float(community_data.get("message_count", 0)),
            history=message_history,
            higher_is_risk=True,
            low_description="lower than normal",
            high_description="spiking above normal",
        )
        tx_signal = self._build_anomaly_signal(
            label="Largest treasury transfer",
            current=float(wallet_data.get("largest_transaction_24h", {}).get("usd_value", 0.0))
            if wallet_data.get("largest_transaction_24h")
            else 0.0,
            history=tx_history,
            higher_is_risk=True,
            low_description="within founder norm",
            high_description="spiking above normal",
            money_label=True,
        )

        recurring_risks = self._build_recurring_risk_signal(historical_snapshots, alerts)
        return [commit_signal, community_signal, tx_signal, recurring_risks]

    def _extract_numeric_series(
        self,
        snapshots: List[Dict[str, Any]],
        section: str,
        field: str,
    ) -> List[float]:
        values: List[float] = []
        for snapshot in snapshots:
            section_data = snapshot.get(section, {})
            value = section_data.get(field)
            if value is None:
                continue
            try:
                values.append(float(value))
            except (TypeError, ValueError):
                continue
        return values

    def _extract_largest_tx_series(self, snapshots: List[Dict[str, Any]]) -> List[float]:
        values: List[float] = []
        for snapshot in snapshots:
            wallet = snapshot.get("wallet", {})
            largest_tx = wallet.get("largest_transaction_24h")
            if not largest_tx:
                values.append(0.0)
                continue
            try:
                values.append(float(largest_tx.get("usd_value", 0.0)))
            except (TypeError, ValueError):
                values.append(0.0)
        return values

    def _build_anomaly_signal(
        self,
        label: str,
        current: float,
        history: List[float],
        higher_is_risk: bool,
        low_description: str,
        high_description: str,
        money_label: bool = False,
    ) -> str:
        if not history:
            return f"{label}: baseline is still warming up."
        baseline = statistics.mean(history)
        spread = statistics.pstdev(history) if len(history) > 1 else 0.0
        threshold = max(1.0, spread * 1.5)
        delta = current - baseline
        is_anomaly = abs(delta) > threshold

        current_text = _format_money(current) if money_label else f"{int(current)}"
        baseline_text = _format_money(baseline) if money_label else f"{baseline:.1f}"

        if not is_anomaly:
            return f"{label}: {current_text}, within your baseline band (avg {baseline_text})."

        if delta > 0:
            risk_text = high_description if higher_is_risk else "higher than normal"
        else:
            risk_text = low_description if not higher_is_risk else "lower than normal"
        return f"{label}: {current_text}, {risk_text} versus baseline {baseline_text}."

    def _build_recurring_risk_signal(
        self,
        historical_snapshots: List[Dict[str, Any]],
        current_alerts: List[str],
    ) -> str:
        recurring_alerts: Dict[str, int] = {}
        for snapshot in historical_snapshots:
            for alert in snapshot.get("alerts", []):
                if alert == "No unusual activity detected.":
                    continue
                recurring_alerts[alert] = recurring_alerts.get(alert, 0) + 1

        active_recurrences = []
        for alert in current_alerts:
            if alert == "No unusual activity detected.":
                continue
            if recurring_alerts.get(alert, 0) >= 2:
                active_recurrences.append((alert, recurring_alerts[alert]))

        if not active_recurrences:
            return "Recurring risk ledger: no sustained alert pattern crossed the escalation threshold."

        top_alert, count = sorted(active_recurrences, key=lambda item: item[1], reverse=True)[0]
        return f"Recurring risk ledger: '{top_alert}' has appeared in {count} recent runs."

    def _describe_code_activity(self, github_data: Dict[str, Any], previous_github: Dict[str, Any]) -> str:
        commits = int(github_data.get("commit_count_24h", 0))
        prs = int(github_data.get("pull_request_count_24h", 0))
        issues = int(github_data.get("issue_count_24h", 0))
        previous_commits = int(previous_github.get("commit_count_24h", 0))

        if commits == 0 and previous_commits == 0:
            return "Engineering remained quiet across consecutive runs, which raises execution visibility risk."
        if commits > previous_commits:
            return f"Engineering activity picked up to {commits} commits, up from {previous_commits} in the prior run."
        if commits < previous_commits:
            return f"Commit velocity slowed to {commits} from {previous_commits}, so delivery pace should be checked."
        return f"Engineering output held steady at {commits} commits, with {prs} PRs and {issues} issues opened."

    def _describe_development_risk(self, github_data: Dict[str, Any]) -> str:
        last_commit_at = _parse_iso8601(github_data.get("last_commit_at"))
        if not last_commit_at:
            return "No recent commit timestamp is available, so repo recency is unclear."
        hours_since_commit = int((_now_utc() - last_commit_at).total_seconds() // 3600)
        if hours_since_commit >= 24:
            return f"Latest commit is {hours_since_commit} hours old, which suggests momentum is cooling."
        return f"The codebase was touched {hours_since_commit} hours ago, so work is still active."

    def _describe_treasury(
        self,
        wallet_data: Dict[str, Any],
        previous_wallet: Dict[str, Any],
        price_data: Dict[str, Any],
    ) -> str:
        current_balance = float(wallet_data.get("balance_usd", 0.0))
        previous_balance = float(previous_wallet.get("balance_usd", current_balance))
        price_change = float(price_data.get("change_24h_pct", 0.0))
        balance_delta = current_balance - previous_balance

        if abs(balance_delta) < 1:
            return (
                f"Treasury balance is effectively flat at {_format_money(current_balance)} while token price moved "
                f"{_format_percent(price_change)}."
            )
        direction = "up" if balance_delta > 0 else "down"
        return (
            f"Treasury balance is {direction} by {_format_money(abs(balance_delta))} versus the last run, "
            f"now sitting at {_format_money(current_balance)}."
        )

    def _describe_transaction_risk(self, wallet_data: Dict[str, Any]) -> str:
        largest_tx = wallet_data.get("largest_transaction_24h")
        if not largest_tx:
            return "No material on-chain transfer stood out in the last 24 hours."
        usd_value = float(largest_tx.get("usd_value", 0.0))
        direction = largest_tx.get("direction", "unknown")
        if usd_value <= 0:
            return "Transfers were detected, but no USD-normalized transaction stood out."
        return f"Largest on-chain movement was a {direction} transfer worth {_format_money(usd_value)}."

    def _describe_community(
        self,
        community_data: Dict[str, Any],
        previous_community: Dict[str, Any],
    ) -> str:
        messages = int(community_data.get("message_count", 0))
        previous_messages = int(previous_community.get("message_count", 0))
        sentiment = community_data.get("sentiment", "Neutral")

        if messages == 0 and previous_messages == 0:
            return "Community has stayed quiet across runs, so sentiment confidence remains low."
        if messages > previous_messages:
            return (
                f"Community activity rose to {messages} messages from {previous_messages}, "
                f"with sentiment currently {sentiment.lower()}."
            )
        if messages < previous_messages:
            return (
                f"Community activity cooled to {messages} messages from {previous_messages}, "
                f"with sentiment currently {sentiment.lower()}."
            )
        return f"Community volume held steady at {messages} messages, with {sentiment.lower()} tone."

    def _build_priority_from_alerts(self, alerts: List[str]) -> Optional[str]:
        meaningful_alerts = [alert for alert in alerts if alert != "No unusual activity detected."]
        if not meaningful_alerts:
            return None
        return f"Prioritize founder review of the top alert: {meaningful_alerts[0]}"

    def _build_priority_from_activity(
        self,
        github_data: Dict[str, Any],
        community_data: Dict[str, Any],
    ) -> Optional[str]:
        if int(github_data.get("commit_count_24h", 0)) == 0:
            return "Check whether engineering is blocked or simply between milestones."
        if community_data.get("sentiment") == "Negative":
            return "Review Telegram pain points and decide whether a founder-facing response is needed."
        return "Use the current signal set to confirm whether execution and community momentum still align."

    def _build_priority_from_treasury(self, wallet_data: Dict[str, Any]) -> Optional[str]:
        largest_tx = wallet_data.get("largest_transaction_24h")
        if not largest_tx:
            return None
        usd_value = float(largest_tx.get("usd_value", 0.0))
        threshold = float(self.config.get("alerts", {}).get("large_transaction_usd", 10000))
        if usd_value >= threshold:
            return "Validate the intent behind the largest transfer and confirm it matches treasury plans."
        return None
