from __future__ import annotations

from typing import Any, Dict, Optional

import requests


class QwenClient:
    """OpenAI-compatible client for hosted Qwen endpoints."""

    def __init__(self, config: Dict[str, Any]) -> None:
        self.endpoint = str(config.get("endpoint", "")).rstrip("/")
        self.api_key = str(config.get("api_key", ""))
        self.model = str(config.get("model", "qwen3.5"))
        self.timeout = int(config.get("timeout_seconds", 30))
        self.enabled = bool(self.endpoint and self.api_key and self.model)

    def generate_brief(self, *, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not self.enabled:
            return None

        try:
            response = requests.post(
                f"{self.endpoint}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            payload = response.json()
            choices = payload.get("choices", [])
            if not choices:
                return None
            message = choices[0].get("message", {})
            content = message.get("content")
            if isinstance(content, str):
                return content.strip()
        except requests.RequestException:
            return None
        return None
