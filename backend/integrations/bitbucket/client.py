"""Real Bitbucket REST API client for pull requests."""

import logging

import httpx

from integrations.credentials_resolver import get_service_credentials
from models.agent_run import utc_now

logger = logging.getLogger(__name__)


class BitbucketClient:
    def __init__(self, workspace: str, repo: str, app_password: str, username: str = ""):
        self.workspace = workspace
        self.repo = repo
        self.auth = (username or workspace, app_password)

    def _request(self, method: str, path: str, **kwargs) -> dict:
        with httpx.Client(timeout=30.0) as client:
            response = client.request(
                method,
                f"https://api.bitbucket.org/2.0{path}",
                auth=self.auth,
                headers={"Accept": "application/json"},
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
        pr = self._request(
            "POST",
            f"/repositories/{self.workspace}/{self.repo}/pullrequests",
            json={
                "title": title,
                "source": {"branch": {"name": branch}},
                "destination": {"branch": {"name": "main"}},
                "description": f"Automated fix for {ticket_id}",
            },
        )
        return {
            "number": pr.get("id", 0),
            "url": pr.get("links", {}).get("html", {}).get("href", ""),
            "title": pr.get("title", title),
            "branch": branch,
            "status": pr.get("state", "OPEN").lower(),
            "createdAt": utc_now(),
            "filesChanged": files_changed,
        }


def build_bitbucket_client() -> BitbucketClient:
    creds = get_service_credentials("bitbucket")
    workspace = creds.get("workspace", "")
    repo = creds.get("repo", "")
    password = creds.get("appPassword", "")
    if not all([workspace, repo, password]):
        raise ValueError("Bitbucket credentials incomplete. Configure in Settings.")
    return BitbucketClient(workspace, repo, password, creds.get("username", ""))
