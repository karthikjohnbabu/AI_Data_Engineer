"""Jira integration — mock or real client based on configuration."""

from data.loader import load_json
from models.agent_run import utc_now

_submitted_tickets: list[dict] = []


class MockJiraClient:
    """Simulates Jira using local JSON."""

    def list_tickets(self) -> list[dict]:
        return load_json("tickets.json") + _submitted_tickets

    def get_ticket(self, ticket_id: str) -> dict | None:
        for ticket in self.list_tickets():
            if ticket["id"] == ticket_id:
                return ticket
        return None

    def create_ticket(self, summary: str, priority: str = "Medium") -> dict:
        tickets = self.list_tickets()
        next_num = 4800 + len(tickets) + 1
        ticket = {
            "id": f"UKDATA-{next_num}",
            "summary": summary,
            "status": "Open",
            "agentStatus": "Investigating",
            "confidence": 0,
            "pr": None,
            "environment": "Dev",
            "priority": priority,
            "assignee": "AI Agent",
            "createdAt": utc_now(),
        }
        _submitted_tickets.append(ticket)
        return ticket

    def add_comment(self, ticket_id: str, body: str) -> None:
        pass


def get_jira_client():
    from config.settings import get_settings
    from integrations.credentials_resolver import credentials_configured
    from integrations.jira.jira_client import build_jira_client

    settings = get_settings()
    use_real = settings.jira_mode == "jira" or credentials_configured("jira")
    if use_real:
        try:
            return build_jira_client()
        except ValueError:
            if settings.jira_mode == "jira":
                raise
    return MockJiraClient()
