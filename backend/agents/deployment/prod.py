"""PROD deployment — always human-gated."""

from models.agent_run import utc_now


def deploy_prod(ticket_id: str, approved: bool) -> dict:
    if not approved:
        return {"ticketId": ticket_id, "environment": "Prod", "status": "blocked", "reason": "human_approval_required"}
    return {"ticketId": ticket_id, "environment": "Prod", "status": "completed", "timestamp": utc_now()}
