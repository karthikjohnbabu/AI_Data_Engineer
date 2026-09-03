"""Ticket Triage workflow."""

WORKFLOW_ID = "ticket_triage"


def run(ticket_id: str, context: dict | None = None) -> dict:
    """Execute the ticket_triage workflow (stub wired for Newton pipeline)."""
    context = context or {}
    return {"workflowId": WORKFLOW_ID, "ticketId": ticket_id, "status": "completed", "context": context}
