"""Real Jira REST API client."""

import logging

import httpx

from integrations.credentials_resolver import get_service_credentials
from models.agent_run import utc_now

logger = logging.getLogger(__name__)

PRIORITY_MAP = {
    "Highest": "Critical",
    "High": "High",
    "Medium": "Medium",
    "Low": "Low",
    "Lowest": "Low",
}


class JiraClient:
    def __init__(self, url: str, email: str, api_token: str, project_key: str):
        self.base_url = url.rstrip("/")
        self.project_key = project_key
        self.auth = (email, api_token)

    def _request(self, method: str, path: str, **kwargs) -> dict | list:
        with httpx.Client(timeout=30.0) as client:
            response = client.request(
                method,
                f"{self.base_url}{path}",
                auth=self.auth,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                **kwargs,
            )
            response.raise_for_status()
            if response.content:
                return response.json()
            return {}

    def list_tickets(self) -> list[dict]:
        jql = f"project = {self.project_key} ORDER BY created DESC"
        data = self._request("GET", "/rest/api/3/search", params={"jql": jql, "maxResults": 50})
        issues = data.get("issues", [])
        return [self._map_issue(issue) for issue in issues]

    def get_ticket(self, ticket_id: str) -> dict | None:
        try:
            issue = self._request("GET", f"/rest/api/3/issue/{ticket_id}")
            return self._map_issue(issue)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            raise

    def create_ticket(self, summary: str, priority: str = "Medium") -> dict:
        jira_priority = priority if priority in PRIORITY_MAP.values() else "Medium"
        body = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": summary,
                "issuetype": {"name": "Task"},
                "priority": {"name": jira_priority},
            }
        }
        issue = self._request("POST", "/rest/api/3/issue", json=body)
        return self.get_ticket(issue["key"]) or {
            "id": issue["key"],
            "summary": summary,
            "status": "Open",
            "agentStatus": "Investigating",
            "confidence": 0,
            "pr": None,
            "environment": "Dev",
            "priority": jira_priority,
            "assignee": "AI Agent",
            "createdAt": utc_now(),
        }

    def add_comment(self, ticket_id: str, body: str) -> None:
        payload = {
            "body": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": body}]}],
            }
        }
        self._request("POST", f"/rest/api/3/issue/{ticket_id}/comment", json=payload)

    def _map_issue(self, issue: dict) -> dict:
        fields = issue.get("fields", {})
        status = fields.get("status", {}).get("name", "Open")
        priority = fields.get("priority", {}).get("name", "Medium")
        assignee = fields.get("assignee") or {}
        return {
            "id": issue.get("key", ""),
            "summary": fields.get("summary", ""),
            "status": status,
            "agentStatus": "Investigating",
            "confidence": 0,
            "pr": None,
            "environment": "Dev",
            "priority": PRIORITY_MAP.get(priority, priority),
            "assignee": assignee.get("displayName", "Unassigned"),
            "createdAt": fields.get("created", utc_now()),
        }


def build_jira_client() -> JiraClient:
    creds = get_service_credentials("jira")
    url = creds.get("url", "")
    email = creds.get("email", "")
    token = creds.get("apiToken", "")
    project_key = creds.get("projectKey", "UKDATA")
    if not all([url, email, token]):
        raise ValueError("Jira credentials incomplete. Configure in Settings or .env")
    return JiraClient(url, email, token, project_key)
