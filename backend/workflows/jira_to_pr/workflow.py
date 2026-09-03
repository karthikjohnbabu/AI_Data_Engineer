"""Jira To Pr workflow."""

WORKFLOW_ID = "jira_to_pr"


def run(ticket_id: str, context: dict | None = None) -> dict:
    """Execute the jira_to_pr workflow (stub wired for Newton pipeline)."""
    context = context or {}
    return {"workflowId": WORKFLOW_ID, "ticketId": ticket_id, "status": "completed", "context": context}
