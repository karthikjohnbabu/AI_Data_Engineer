"""Rollback helpers."""

from models.agent_run import utc_now


def rollback(ticket_id: str, environment: str) -> dict:
    return {"ticketId": ticket_id, "environment": environment, "status": "rolled_back", "timestamp": utc_now()}
