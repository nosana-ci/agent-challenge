from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict

from agent.clawfounder_agent import ClawFounderAgent
from agent.tools_registry import call_registered_tool
from config.runtime_config import DEFAULT_CONFIG_PATH, load_config
from scheduler.daily_job import run_daily_job, run_scheduler


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def run_connection_tests(config: Dict[str, Any]) -> int:
    logger = logging.getLogger(__name__)
    tool_config = {"config": config}

    github_response = call_registered_tool("get_github_activity", tool_config)
    price_response = call_registered_tool("get_token_price", tool_config)
    wallet_response = call_registered_tool(
        "get_wallet_data",
        {
            **tool_config,
            "price_data": price_response.get("data", {}),
        },
    )
    telegram_read_response = call_registered_tool(
        "get_telegram_activity",
        {
            **tool_config,
            "hours": config.get("telegram", {}).get("lookback_hours", 24),
        },
    )
    telegram_send_probe = call_registered_tool(
        "send_telegram_message",
        {
            **tool_config,
            "text": "ClawFounder Agent test ping.",
        },
    )

    github_data = github_response.get("data", {})
    price_data = price_response.get("data", {})
    wallet_data = wallet_response.get("data", {})
    telegram_data = telegram_read_response.get("data", {})

    logger.info(
        "GitHub | status=%s repo=%s commits_24h=%s prs_24h=%s issues_24h=%s",
        github_response.get("status"),
        "configured" if github_data.get("repo") else "missing",
        github_data.get("commit_count_24h"),
        github_data.get("pull_request_count_24h"),
        github_data.get("issue_count_24h"),
    )
    logger.info(
        "Price | status=%s token=%s price=%s change_24h=%s",
        price_response.get("status"),
        price_data.get("token_id"),
        price_data.get("price_usd"),
        price_data.get("change_24h_pct"),
    )
    logger.info(
        "Wallet | status=%s balance_usd=%s tx_count_24h=%s",
        wallet_response.get("status"),
        wallet_data.get("balance_usd"),
        wallet_data.get("transaction_count_24h"),
    )
    logger.info(
        "Telegram Read | status=%s messages_24h=%s",
        telegram_read_response.get("status"),
        telegram_data.get("message_count", 0),
    )
    logger.info(
        "Telegram Send | ok=%s status=%s",
        telegram_send_probe.get("status") == "ok",
        telegram_send_probe.get("status", "ok"),
    )

    failures = []
    if github_response.get("status") != "ok":
        failures.append("github")
    if price_response.get("status") != "ok":
        failures.append("price")
    if wallet_response.get("status") != "ok":
        failures.append("wallet")
    if telegram_read_response.get("status") != "ok":
        failures.append("telegram_read")
    if telegram_send_probe.get("status") != "ok":
        failures.append("telegram_send")

    if failures:
        logger.error("Connection test failed for: %s", ", ".join(failures))
        return 1

    logger.info("All live connection tests passed.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="ClawFounder Agent MVP")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG_PATH), help="Path to config.json")
    parser.add_argument(
        "--mode",
        choices=("run-once", "schedule", "test-connections"),
        default="run-once",
        help="Run once for testing or stay up as a daily scheduler.",
    )
    parser.add_argument(
        "--send",
        action="store_true",
        help="Send the generated brief to Telegram after generating it.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print structured JSON instead of plain text for one-off runs.",
    )
    args = parser.parse_args()

    configure_logging()
    config = load_config(Path(args.config))

    if args.mode == "schedule":
        run_scheduler(config)
        return
    if args.mode == "test-connections":
        raise SystemExit(run_connection_tests(config))

    agent = ClawFounderAgent(config)
    result = agent.run()
    delivery = None
    if args.send:
        delivery = agent.send_brief(result.brief)
        logging.getLogger(__name__).info("Telegram delivery response: %s", delivery.get("status", delivery))

    if args.json:
        print(
            json.dumps(
                {
                    "brief": result.brief,
                    "structured_data": result.structured_data,
                    "delivery": delivery,
                },
                indent=2,
            )
        )
        return

    print(result.brief)


if __name__ == "__main__":
    main()
