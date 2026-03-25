from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests


UTC = timezone.utc


def _parse_iso8601(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class GitHubTool:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.repo = config.get("repo", "")
        self.base_url = config.get("base_url", "https://api.github.com")
        self.token = config.get("token")
        self.timeout = int(config.get("timeout_seconds", 20))

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        response = requests.get(
            f"{self.base_url}{path}",
            headers=self._headers(),
            params=params or {},
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def fetch_activity(self) -> Dict[str, Any]:
        if not self.repo or "/" not in self.repo:
            return self._empty_result("GitHub repo is not configured.")

        since = (datetime.now(UTC) - timedelta(hours=24)).isoformat()
        commits = self._safe_fetch_commits(since)
        pulls = self._safe_fetch_pull_requests(since)
        issues = self._safe_fetch_issues(since)

        last_commit_at = None
        if commits:
            commit_dates = [
                item["commit"]["committer"]["date"]
                for item in commits
                if item.get("commit", {}).get("committer", {}).get("date")
            ]
            if commit_dates:
                last_commit_at = max(commit_dates, key=_parse_iso8601)

        return {
            "repo": self.repo,
            "commit_count_24h": len(commits),
            "pull_request_count_24h": len(pulls),
            "issue_count_24h": len(issues),
            "last_commit_at": last_commit_at,
            "commits": [
                {
                    "sha": item.get("sha"),
                    "message": item.get("commit", {}).get("message", "").splitlines()[0],
                    "author": item.get("commit", {}).get("author", {}).get("name"),
                    "date": item.get("commit", {}).get("author", {}).get("date"),
                    "url": item.get("html_url"),
                }
                for item in commits
            ],
            "pull_requests": [
                {
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "author": item.get("user", {}).get("login"),
                    "state": item.get("state"),
                    "created_at": item.get("created_at"),
                    "url": item.get("html_url"),
                }
                for item in pulls
            ],
            "issues": [
                {
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "author": item.get("user", {}).get("login"),
                    "state": item.get("state"),
                    "created_at": item.get("created_at"),
                    "url": item.get("html_url"),
                }
                for item in issues
            ],
            "status": "ok",
        }

    def _safe_fetch_commits(self, since: str) -> List[Dict[str, Any]]:
        try:
            return self._get(f"/repos/{self.repo}/commits", params={"since": since, "per_page": 100})
        except requests.RequestException as exc:
            return []

    def _safe_fetch_pull_requests(self, since: str) -> List[Dict[str, Any]]:
        try:
            items = self._get(
                "/search/issues",
                params={
                    "q": f"repo:{self.repo} is:pr created:>={since}",
                    "per_page": 100,
                },
            )
            return items.get("items", [])
        except requests.RequestException:
            return []

    def _safe_fetch_issues(self, since: str) -> List[Dict[str, Any]]:
        try:
            items = self._get(
                "/search/issues",
                params={
                    "q": f"repo:{self.repo} is:issue created:>={since}",
                    "per_page": 100,
                },
            )
            return items.get("items", [])
        except requests.RequestException:
            return []

    @staticmethod
    def _empty_result(reason: str) -> Dict[str, Any]:
        return {
            "repo": None,
            "commit_count_24h": 0,
            "pull_request_count_24h": 0,
            "issue_count_24h": 0,
            "last_commit_at": None,
            "commits": [],
            "pull_requests": [],
            "issues": [],
            "status": reason,
        }
