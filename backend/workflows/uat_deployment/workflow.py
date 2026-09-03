"""Uat Deployment workflow."""

WORKFLOW_ID = "uat_deployment"


def run(ticket_id: str, context: dict | None = None) -> dict:
    """Execute the uat_deployment workflow (stub wired for Newton pipeline)."""
    context = context or {}
    return {"workflowId": WORKFLOW_ID, "ticketId": ticket_id, "status": "completed", "context": context}
