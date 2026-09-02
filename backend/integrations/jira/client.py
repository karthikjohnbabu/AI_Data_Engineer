"""Jira integration — mock client (swap for real when credentials available)."""

from data.loader import load_json
from models.agent_run import utc_now

_submitted_tickets: list[dict] = []


class MockJiraClient:
  """Simulates Jira using local JSON. Replace with JiraClient when credentials are set."""

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


def get_jira_client():
  from config.settings import get_settings

  settings = get_settings()
  if settings.jira_mode == "jira":
    raise NotImplementedError("Real Jira client not configured. Set JIRA_MODE=mock or provide credentials.")
  return MockJiraClient()
