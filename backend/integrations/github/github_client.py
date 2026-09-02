"""Real GitHub REST API client for pull requests."""

import logging

import httpx

from integrations.credentials_resolver import get_service_credentials
from models.agent_run import utc_now

logger = logging.getLogger(__name__)


class GitHubClient:
    def __init__(self, token: str, repo: str):
        self.token = token
        self.repo = repo  # org/repo

    def _request(self, method: str, path: str, **kwargs) -> dict:
        with httpx.Client(timeout=30.0) as client:
            response = client.request(
                method,
                f"https://api.github.com{path}",
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                **kwargs,
            )
            response.raise_for_status()
            return response.json()

    def create_pull_request(
        self,
        ticket_id: str,
        title: str,
        branch: str,
        files_changed: list[str],
    ) -> dict:
        base_branch = self._default_branch()
        pr = self._request(
            "POST",
            f"/repos/{self.repo}/pulls",
            json={
                "title": title,
                "head": branch,
                "base": base_branch,
                "body": f"Automated fix for {ticket_id}\n\nFiles:\n" + "\n".join(f"- {f}" for f in files_changed),
            },
        )
        return {
            "number": pr["number"],
            "url": pr["html_url"],
            "title": pr["title"],
            "branch": branch,
            "status": pr["state"],
            "createdAt": utc_now(),
            "filesChanged": files_changed,
        }

    def _default_branch(self) -> str:
        repo = self._request("GET", f"/repos/{self.repo}")
        return repo.get("default_branch", "main")


def build_github_client() -> GitHubClient:
    creds = get_service_credentials("github")
    token = creds.get("token") or creds.get("githubToken", "")
    repo = creds.get("repo", "")
    if not token or not repo:
        raise ValueError("GitHub credentials incomplete. Configure token and repo in Settings.")
    return GitHubClient(token, repo)
