from __future__ import annotations

import logging
import time
from typing import Any, Dict

from agent.clawfounder_agent import ClawFounderAgent


logger = logging.getLogger(__name__)


def run_daily_job(config: Dict[str, Any]) -> Dict[str, Any]:
    """Run the agent once, send the brief to Telegram, and return structured results."""
    agent = ClawFounderAgent(config)
    result = agent.run()
    delivery = agent.send_brief(result.brief)
    logger.info(
        "Daily run completed | telegram_delivery=%s",
        "ok" if delivery.get("status") == "ok" else delivery.get("status"),
    )
    return {
        "brief": result.brief,
        "structured_data": result.structured_data,
        "delivery": delivery,
    }


def run_scheduler(config: Dict[str, Any], interval_seconds: int = 86400) -> None:
    """Simple long-running scheduler that executes once every 24 hours."""
    logger.info("Starting daily scheduler with %s second interval.", interval_seconds)
    while True:
        try:
            run_daily_job(config)
        except Exception as exc:  # pragma: no cover - defensive runtime loop
            logger.exception("Daily job failed: %s", exc)
        time.sleep(interval_seconds)


def run_forever(config: Dict[str, Any], interval_seconds: int = 86400) -> None:
    """Backward-compatible alias for the scheduler loop."""
    run_scheduler(config, interval_seconds=interval_seconds)


if __name__ == "__main__":
    raise SystemExit("Run scheduler through main.py or import run_forever().")
