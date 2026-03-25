from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict


DEFAULT_CONFIG_PATH = Path("config/config.json")
DEFAULT_DOTENV_PATH = Path(".env")


ENV_VAR_MAP = {
    "github": {
        "repo": "CLAWFOUNDER_GITHUB_REPO",
        "token": "CLAWFOUNDER_GITHUB_TOKEN",
    },
    "wallet": {
        "address": "CLAWFOUNDER_WALLET_ADDRESS",
        "network": "CLAWFOUNDER_WALLET_NETWORK",
        "alchemy_api_key": "CLAWFOUNDER_ALCHEMY_API_KEY",
        "native_symbol": "CLAWFOUNDER_WALLET_NATIVE_SYMBOL",
        "native_decimals": "CLAWFOUNDER_WALLET_NATIVE_DECIMALS",
    },
    "telegram": {
        "bot_token": "CLAWFOUNDER_TELEGRAM_BOT_TOKEN",
        "chat_id": "CLAWFOUNDER_TELEGRAM_CHAT_ID",
        "lookback_hours": "CLAWFOUNDER_TELEGRAM_LOOKBACK_HOURS",
    },
    "price": {
        "token_id": "CLAWFOUNDER_PRICE_TOKEN_ID",
        "vs_currency": "CLAWFOUNDER_PRICE_VS_CURRENCY",
    },
    "llm": {
        "endpoint": "OPENAI_API_URL",
        "api_key": "OPENAI_API_KEY",
        "model": "MODEL_NAME",
    },
    "alerts": {
        "no_commit_days": "CLAWFOUNDER_ALERT_NO_COMMIT_DAYS",
        "large_transaction_usd": "CLAWFOUNDER_ALERT_LARGE_TRANSACTION_USD",
    },
}


def load_dotenv(dotenv_path: Path = DEFAULT_DOTENV_PATH) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _coerce_value(example: Any, new_value: str) -> Any:
    if isinstance(example, bool):
        return new_value.lower() in {"1", "true", "yes", "on"}
    if isinstance(example, int):
        return int(new_value)
    if isinstance(example, float):
        return float(new_value)
    return new_value


def apply_env_overrides(config: Dict[str, Any]) -> Dict[str, Any]:
    merged = json.loads(json.dumps(config))
    for section, keys in ENV_VAR_MAP.items():
        merged.setdefault(section, {})
        for key, env_var in keys.items():
            env_value = os.getenv(env_var)
            if env_value is None or env_value == "":
                continue
            current_value = merged[section].get(key)
            merged[section][key] = env_value if current_value is None else _coerce_value(current_value, env_value)
    return merged


def load_config(config_path: Path = DEFAULT_CONFIG_PATH) -> Dict[str, Any]:
    load_dotenv()
    with config_path.open("r", encoding="utf-8") as handle:
        file_config = json.load(handle)
    return apply_env_overrides(file_config)
