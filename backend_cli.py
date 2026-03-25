from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Optional

from agent.clawfounder_agent import ClawFounderAgent
from agent.tools_registry import call_registered_tool, list_registered_tools
from config.runtime_config import DEFAULT_CONFIG_PATH, load_config


def _parse_payload(payload_text: Optional[str]) -> Dict[str, Any]:
    if not payload_text:
        return {}
    return json.loads(payload_text)


def _load_runtime_config(config_path: str) -> Dict[str, Any]:
    return load_config(Path(config_path))


def _run_tool(config_path: str, tool_name: str, payload_text: Optional[str]) -> Dict[str, Any]:
    payload = _parse_payload(payload_text)
    payload["config"] = _load_runtime_config(config_path)
    return call_registered_tool(tool_name, payload)


def _run_agent(config_path: str, send: bool) -> Dict[str, Any]:
    config = _load_runtime_config(config_path)
    agent = ClawFounderAgent(config)
    result = agent.run()
    delivery = agent.send_brief(result.brief) if send else None
    return {
        "brief": result.brief,
        "structured_data": result.structured_data,
        "delivery": delivery,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="ClawFounder Python backend bridge")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG_PATH), help="Path to config.json")
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list-tools", help="List registered tools")
    list_parser.set_defaults(handler=lambda args: list_registered_tools())

    tool_parser = subparsers.add_parser("tool", help="Call a registered tool")
    tool_parser.add_argument("name", help="Registered tool name")
    tool_parser.add_argument("--payload", help="JSON payload string for the tool")
    tool_parser.set_defaults(handler=lambda args: _run_tool(args.config, args.name, args.payload))

    agent_parser = subparsers.add_parser("run-agent", help="Run the ClawFounder agent")
    agent_parser.add_argument("--send", action="store_true", help="Send the generated brief to Telegram")
    agent_parser.set_defaults(handler=lambda args: _run_agent(args.config, args.send))

    args = parser.parse_args()
    result = args.handler(args)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
