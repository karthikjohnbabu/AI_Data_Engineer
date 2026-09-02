"""Ticket service — single entry point for ticket data (Jira or mock)."""

from integrations.jira.client import get_jira_client
from services.run_store import get_ticket_override


def merge_ticket_with_run(ticket: dict) -> dict:
    override = get_ticket_override(ticket["id"])
    if not override:
        return ticket
    return {**ticket, **override}


def list_tickets() -> list[dict]:
    jira = get_jira_client()
    return [merge_ticket_with_run(t) for t in jira.list_tickets()]


def get_ticket(ticket_id: str) -> dict | None:
    jira = get_jira_client()
    ticket = jira.get_ticket(ticket_id)
    if not ticket:
        return None
    return merge_ticket_with_run(ticket)


def get_ticket_summary(ticket_id: str) -> str | None:
    ticket = get_ticket(ticket_id)
    return ticket["summary"] if ticket else None


def submit_ticket(summary: str, priority: str = "Medium") -> dict:
    jira = get_jira_client()
    return jira.create_ticket(summary, priority)
