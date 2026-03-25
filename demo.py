from __future__ import annotations

import logging

from config.runtime_config import load_config
from scheduler.daily_job import run_daily_job


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    config = load_config()
    result = run_daily_job(config)
    print(result["brief"])


if __name__ == "__main__":
    main()
