from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests


UTC = timezone.utc


def _parse_iso8601(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class WalletTool:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.address = config.get("address", "")
        self.network = config.get("network", "eth-mainnet")
        self.alchemy_api_key = config.get("alchemy_api_key", "")
        self.native_symbol = config.get("native_symbol", "ETH")
        self.native_decimals = int(config.get("native_decimals", 18))
        self.timeout = int(config.get("timeout_seconds", 20))

    def _base_url(self) -> str:
        return f"https://{self.network}.g.alchemy.com/v2/{self.alchemy_api_key}"

    def _post(self, method: str, params: List[Any]) -> Any:
        response = requests.post(
            self._base_url(),
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params,
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        if "error" in payload:
            raise requests.HTTPError(str(payload["error"]))
        return payload.get("result")

    def fetch_wallet_activity(self, price_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.address or not self.alchemy_api_key:
            return self._empty_result("Wallet address or Alchemy API key is not configured.")

        try:
            balance_wei = self._post("eth_getBalance", [self.address, "latest"])
            transfers = self._fetch_recent_transfers()
        except requests.RequestException as exc:
            return self._empty_result(f"Wallet API request failed: {exc}")

        native_balance = int(balance_wei, 16) / (10 ** self.native_decimals)
        current_price = float((price_data or {}).get("price_usd", 0.0))
        balance_usd = native_balance * current_price

        normalized_transfers = self._normalize_transfers(transfers, current_price=current_price)
        incoming_total = sum(item["usd_value"] for item in normalized_transfers if item["direction"] == "incoming")
        outgoing_total = sum(item["usd_value"] for item in normalized_transfers if item["direction"] == "outgoing")
        estimated_previous_balance_usd = max(balance_usd - incoming_total + outgoing_total, 0.0)
        if estimated_previous_balance_usd > 0:
            change_pct = ((balance_usd - estimated_previous_balance_usd) / estimated_previous_balance_usd) * 100
        else:
            change_pct = 0.0

        largest_tx = max(normalized_transfers, key=lambda item: item["usd_value"], default=None)

        return {
            "address": self.address,
            "network": self.network,
            "native_symbol": self.native_symbol,
            "native_balance": native_balance,
            "balance_usd": balance_usd,
            "balance_change_pct_24h": change_pct,
            "transaction_count_24h": len(normalized_transfers),
            "largest_transaction_24h": largest_tx,
            "transactions": normalized_transfers,
            "status": "ok",
        }

    def _fetch_recent_transfers(self) -> List[Dict[str, Any]]:
        since = (datetime.now(UTC) - timedelta(hours=24)).isoformat()
        categories = ["external", "internal", "erc20", "erc721", "erc1155"]
        combined: List[Dict[str, Any]] = []

        for direction in ("fromAddress", "toAddress"):
            result = self._post(
                "alchemy_getAssetTransfers",
                [
                    {
                        direction: self.address,
                        "fromBlock": "0x0",
                        "toBlock": "latest",
                        "withMetadata": True,
                        "excludeZeroValue": True,
                        "category": categories,
                        "order": "desc",
                        "maxCount": "0x64",
                    }
                ],
            )
            transfers = result.get("transfers", [])
            combined.extend(
                item for item in transfers if self._is_recent(item.get("metadata", {}).get("blockTimestamp"), since)
            )

        return combined

    def _normalize_transfers(self, transfers: List[Dict[str, Any]], current_price: float) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        address_lower = self.address.lower()

        for item in transfers:
            raw_value = item.get("value")
            value = float(raw_value) if raw_value is not None else 0.0
            symbol = item.get("asset") or self.native_symbol
            from_address = (item.get("from") or "").lower()
            to_address = (item.get("to") or "").lower()
            direction = "incoming" if to_address == address_lower else "outgoing"

            usd_value = value * current_price if symbol.upper() == self.native_symbol.upper() else 0.0
            normalized.append(
                {
                    "hash": item.get("hash"),
                    "asset": symbol,
                    "amount": value,
                    "usd_value": usd_value,
                    "from": item.get("from"),
                    "to": item.get("to"),
                    "timestamp": item.get("metadata", {}).get("blockTimestamp"),
                    "direction": direction,
                }
            )

        return normalized

    @staticmethod
    def _is_recent(timestamp: Optional[str], since_iso: str) -> bool:
        if not timestamp:
            return False
        return _parse_iso8601(timestamp) >= _parse_iso8601(since_iso)

    @staticmethod
    def _empty_result(reason: str) -> Dict[str, Any]:
        return {
            "address": None,
            "network": None,
            "native_symbol": None,
            "native_balance": 0.0,
            "balance_usd": 0.0,
            "balance_change_pct_24h": 0.0,
            "transaction_count_24h": 0,
            "largest_transaction_24h": None,
            "transactions": [],
            "status": reason,
        }
