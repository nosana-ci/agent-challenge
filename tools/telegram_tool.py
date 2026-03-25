from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests


UTC = timezone.utc


class TelegramTool:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.bot_token = config.get("bot_token", "")
        self.chat_id = str(config.get("chat_id", "")).strip()
        self.timeout = int(config.get("timeout_seconds", 20))

    def _base_url(self) -> str:
        return f"https://api.telegram.org/bot{self.bot_token}"

    def send_message(self, text: str) -> Dict[str, Any]:
        if not self.bot_token or not self.chat_id:
            return {"ok": False, "status": "Telegram bot token or chat ID is not configured."}

        try:
            response = requests.post(
                f"{self._base_url()}/sendMessage",
                json={
                    "chat_id": self.chat_id,
                    "text": text,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            return {"ok": False, "status": f"Telegram send failed: {exc}"}

    def fetch_recent_messages(self, hours: int = 24) -> List[Dict[str, Any]]:
        if not self.bot_token or not self.chat_id:
            return []

        try:
            response = requests.get(
                f"{self._base_url()}/getUpdates",
                params={"timeout": 5, "limit": 100},
                timeout=self.timeout,
            )
            response.raise_for_status()
        except requests.RequestException:
            return []

        payload = response.json()
        updates = payload.get("result", [])
        cutoff = datetime.now(UTC) - timedelta(hours=hours)
        messages: List[Dict[str, Any]] = []

        for update in updates:
            message = update.get("message") or update.get("channel_post")
            if not message:
                continue

            chat = message.get("chat", {})
            if str(chat.get("id")) != self.chat_id:
                continue

            text = message.get("text") or message.get("caption") or ""
            timestamp = datetime.fromtimestamp(message.get("date", 0), tz=UTC)
            if timestamp < cutoff:
                continue

            messages.append(
                {
                    "message_id": message.get("message_id"),
                    "user": (message.get("from") or {}).get("username"),
                    "text": text,
                    "timestamp": timestamp.isoformat(),
                }
            )

        return messages
