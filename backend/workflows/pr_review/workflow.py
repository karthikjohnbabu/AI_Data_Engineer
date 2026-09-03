"""Pr Review workflow."""

WORKFLOW_ID = "pr_review"


def run(ticket_id: str, context: dict | None = None) -> dict:
    """Execute the pr_review workflow (stub wired for Newton pipeline)."""
    context = context or {}
    return {"workflowId": WORKFLOW_ID, "ticketId": ticket_id, "status": "completed", "context": context}
