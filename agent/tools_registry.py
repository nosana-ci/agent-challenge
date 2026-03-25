from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from config.runtime_config import DEFAULT_CONFIG_PATH, load_config
from tools.github_tool import GitHubTool
from tools.price_tool import PriceTool
from tools.telegram_tool import TelegramTool
from tools.wallet_tool import WalletTool


JSONDict = Dict[str, Any]
ToolCallable = Callable[[Optional[JSONDict]], JSONDict]


@dataclass(frozen=True)
class ToolDefinition:
    """Lightweight ElizaOS-friendly tool definition."""

    name: str
    description: str
    input_schema: JSONDict
    output_schema: JSONDict
    function: ToolCallable

    def to_dict(self) -> JSONDict:
        payload = asdict(self)
        payload["function"] = self.function
        return payload


def _deep_merge(base: JSONDict, overrides: Optional[JSONDict]) -> JSONDict:
    merged = deepcopy(base)
    if not overrides:
        return merged

    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _load_runtime_config(config_overrides: Optional[JSONDict] = None) -> JSONDict:
    base_config = load_config(Path(DEFAULT_CONFIG_PATH))
    return _deep_merge(base_config, config_overrides)


def _tool_response(
    *,
    tool_name: str,
    status: str,
    data: Optional[JSONDict] = None,
    error: Optional[str] = None,
) -> JSONDict:
    return {
        "tool": tool_name,
        "status": status,
        "data": data or {},
        "error": error,
    }


def get_github_activity_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    payload = payload or {}
    runtime_config = _load_runtime_config(payload.get("config"))
    github_config = runtime_config.get("github", {})

    repo_override = payload.get("repo")
    if repo_override:
        github_config = {**github_config, "repo": repo_override}

    result = GitHubTool(github_config).fetch_activity()
    status = "ok" if result.get("status") == "ok" else "error"
    error = None if status == "ok" else str(result.get("status"))
    return _tool_response(
        tool_name="get_github_activity",
        status=status,
        data=result,
        error=error,
    )


def get_wallet_activity_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    payload = payload or {}
    runtime_config = _load_runtime_config(payload.get("config"))
    wallet_config = runtime_config.get("wallet", {})
    price_config = runtime_config.get("price", {})

    if payload.get("address"):
        wallet_config = {**wallet_config, "address": payload["address"]}
    if payload.get("network"):
        wallet_config = {**wallet_config, "network": payload["network"]}
    if payload.get("token_id"):
        price_config = {**price_config, "token_id": payload["token_id"]}

    price_data = payload.get("price_data")
    if not isinstance(price_data, dict):
        price_data = PriceTool(price_config).fetch_price()

    result = WalletTool(wallet_config).fetch_wallet_activity(price_data=price_data)
    status = "ok" if result.get("status") == "ok" else "error"
    error = None if status == "ok" else str(result.get("status"))
    return _tool_response(
        tool_name="get_wallet_activity",
        status=status,
        data=result,
        error=error,
    )


def get_wallet_data_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    response = get_wallet_activity_tool(payload)
    response["tool"] = "get_wallet_data"
    return response


def get_token_price_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    payload = payload or {}
    runtime_config = _load_runtime_config(payload.get("config"))
    price_config = runtime_config.get("price", {})

    if payload.get("token_id"):
        price_config = {**price_config, "token_id": payload["token_id"]}
    if payload.get("vs_currency"):
        price_config = {**price_config, "vs_currency": payload["vs_currency"]}

    result = PriceTool(price_config).fetch_price()
    status = "ok" if result.get("status") == "ok" else "error"
    error = None if status == "ok" else str(result.get("status"))
    return _tool_response(
        tool_name="get_token_price",
        status=status,
        data=result,
        error=error,
    )


def get_telegram_messages_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    payload = payload or {}
    runtime_config = _load_runtime_config(payload.get("config"))
    telegram_config = runtime_config.get("telegram", {})

    if payload.get("chat_id"):
        telegram_config = {**telegram_config, "chat_id": payload["chat_id"]}

    hours = int(payload.get("hours", telegram_config.get("lookback_hours", 24)))
    messages = TelegramTool(telegram_config).fetch_recent_messages(hours=hours)
    return _tool_response(
        tool_name="get_telegram_messages",
        status="ok",
        data={
            "chat_id": str(telegram_config.get("chat_id", "")).strip() or None,
            "lookback_hours": hours,
            "message_count": len(messages),
            "messages": messages,
        },
    )


def get_telegram_activity_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    response = get_telegram_messages_tool(payload)
    response["tool"] = "get_telegram_activity"
    return response


def send_telegram_message_tool(payload: Optional[JSONDict] = None) -> JSONDict:
    payload = payload or {}
    runtime_config = _load_runtime_config(payload.get("config"))
    telegram_config = runtime_config.get("telegram", {})

    if payload.get("chat_id"):
        telegram_config = {**telegram_config, "chat_id": payload["chat_id"]}

    text = str(payload.get("text", "")).strip()
    if not text:
        return _tool_response(
            tool_name="send_telegram_message",
            status="error",
            error="A non-empty 'text' field is required.",
        )

    result = TelegramTool(telegram_config).send_message(text)
    status = "ok" if result.get("ok") else "error"
    error = None if status == "ok" else str(result.get("status", "Telegram send failed."))
    return _tool_response(
        tool_name="send_telegram_message",
        status=status,
        data=result,
        error=error,
    )


TOOLS_REGISTRY: List[ToolDefinition] = [
    ToolDefinition(
        name="get_github_activity",
        description="Fetch GitHub repository activity from the last 24 hours.",
        input_schema={
            "type": "object",
            "properties": {
                "repo": {
                    "type": "string",
                    "description": "Optional GitHub repo override in owner/repo format.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=get_github_activity_tool,
    ),
    ToolDefinition(
        name="get_wallet_activity",
        description="Fetch wallet balance and recent on-chain activity using Alchemy.",
        input_schema={
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "Optional wallet address override.",
                },
                "network": {
                    "type": "string",
                    "description": "Optional Alchemy network override, for example eth-mainnet.",
                },
                "token_id": {
                    "type": "string",
                    "description": "Optional CoinGecko token ID used to price the native asset.",
                },
                "price_data": {
                    "type": "object",
                    "description": "Optional pre-fetched price payload to avoid duplicate price calls.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=get_wallet_activity_tool,
    ),
    ToolDefinition(
        name="get_wallet_data",
        description="Fetch wallet balance and recent on-chain activity using Alchemy.",
        input_schema={
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "Optional wallet address override.",
                },
                "network": {
                    "type": "string",
                    "description": "Optional Alchemy network override, for example eth-mainnet.",
                },
                "token_id": {
                    "type": "string",
                    "description": "Optional CoinGecko token ID used to price the native asset.",
                },
                "price_data": {
                    "type": "object",
                    "description": "Optional pre-fetched price payload to avoid duplicate price calls.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=get_wallet_data_tool,
    ),
    ToolDefinition(
        name="get_token_price",
        description="Fetch token price and 24-hour change from CoinGecko.",
        input_schema={
            "type": "object",
            "properties": {
                "token_id": {
                    "type": "string",
                    "description": "Optional CoinGecko token ID override.",
                },
                "vs_currency": {
                    "type": "string",
                    "description": "Optional quote currency override.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=get_token_price_tool,
    ),
    ToolDefinition(
        name="get_telegram_messages",
        description="Fetch recent Telegram messages available to the configured bot.",
        input_schema={
            "type": "object",
            "properties": {
                "hours": {
                    "type": "integer",
                    "description": "Lookback window in hours.",
                },
                "chat_id": {
                    "type": "string",
                    "description": "Optional Telegram chat ID override.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=get_telegram_messages_tool,
    ),
    ToolDefinition(
        name="get_telegram_activity",
        description="Fetch recent Telegram messages available to the configured bot.",
        input_schema={
            "type": "object",
            "properties": {
                "hours": {
                    "type": "integer",
                    "description": "Lookback window in hours.",
                },
                "chat_id": {
                    "type": "string",
                    "description": "Optional Telegram chat ID override.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=get_telegram_activity_tool,
    ),
    ToolDefinition(
        name="send_telegram_message",
        description="Send a message to the configured Telegram destination.",
        input_schema={
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Message text to send.",
                },
                "chat_id": {
                    "type": "string",
                    "description": "Optional Telegram chat ID override.",
                },
                "config": {
                    "type": "object",
                    "description": "Optional config override payload merged with the runtime config.",
                },
            },
            "required": ["text"],
            "additionalProperties": False,
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "status": {"type": "string", "enum": ["ok", "error"]},
                "data": {"type": "object"},
                "error": {"type": ["string", "null"]},
            },
            "required": ["tool", "status", "data", "error"],
        },
        function=send_telegram_message_tool,
    ),
]


TOOLS_BY_NAME: Dict[str, ToolDefinition] = {tool.name: tool for tool in TOOLS_REGISTRY}


def list_registered_tools() -> List[JSONDict]:
    return [tool.to_dict() for tool in TOOLS_REGISTRY]


def get_registered_tool(name: str) -> JSONDict:
    tool = TOOLS_BY_NAME[name]
    return tool.to_dict()


def call_registered_tool(name: str, payload: Optional[JSONDict] = None) -> JSONDict:
    tool = TOOLS_BY_NAME[name]
    return tool.function(payload)
