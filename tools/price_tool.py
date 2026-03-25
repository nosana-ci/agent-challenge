from __future__ import annotations

from typing import Any, Dict

import requests


class PriceTool:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.token_id = config.get("token_id", "")
        self.vs_currency = config.get("vs_currency", "usd")
        self.timeout = int(config.get("timeout_seconds", 20))

    def fetch_price(self) -> Dict[str, Any]:
        if not self.token_id:
            return self._empty_result("CoinGecko token_id is not configured.")

        try:
            response = requests.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": self.token_id,
                    "vs_currencies": self.vs_currency,
                    "include_24hr_change": "true",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            return self._empty_result(f"CoinGecko request failed: {exc}")

        payload = response.json().get(self.token_id, {})

        price_key = self.vs_currency.lower()
        change_key = f"{price_key}_24h_change"
        return {
            "token_id": self.token_id,
            "vs_currency": self.vs_currency,
            "price_usd": float(payload.get(price_key, 0.0)),
            "change_24h_pct": float(payload.get(change_key, 0.0)),
            "status": "ok",
        }

    @staticmethod
    def _empty_result(reason: str) -> Dict[str, Any]:
        return {
            "token_id": None,
            "vs_currency": "usd",
            "price_usd": 0.0,
            "change_24h_pct": 0.0,
            "status": reason,
        }
