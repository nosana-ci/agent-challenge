from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional


UTC = timezone.utc


class MemoryStore:
    """Persist prior runs so the agent can compare today's state against history."""

    def __init__(self, db_path: str) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS agent_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TEXT NOT NULL,
                    brief TEXT NOT NULL,
                    snapshot_json TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def save_run(self, brief: str, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        created_at = datetime.now(UTC).isoformat()
        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO agent_runs (created_at, brief, snapshot_json)
                VALUES (?, ?, ?)
                """,
                (created_at, brief, json.dumps(snapshot)),
            )
            connection.commit()
            return {
                "id": cursor.lastrowid,
                "created_at": created_at,
            }

    def get_latest_run(self) -> Optional[Dict[str, Any]]:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, created_at, brief, snapshot_json
                FROM agent_runs
                ORDER BY id DESC
                LIMIT 1
                """
            ).fetchone()

        if not row:
            return None

        return {
            "id": row[0],
            "created_at": row[1],
            "brief": row[2],
            "snapshot": json.loads(row[3]),
        }

    def get_recent_runs(self, limit: int = 5) -> List[Dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, created_at, brief, snapshot_json
                FROM agent_runs
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [
            {
                "id": row[0],
                "created_at": row[1],
                "brief": row[2],
                "snapshot": json.loads(row[3]),
            }
            for row in rows
        ]
