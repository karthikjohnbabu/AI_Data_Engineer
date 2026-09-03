"""UAT deployment — requires human approval."""

from models.agent_run import utc_now


def deploy_uat(ticket_id: str, approved: bool) -> dict:
    if not approved:
        return {"ticketId": ticket_id, "environment": "UAT", "status": "blocked", "reason": "human_approval_required"}
    return {"ticketId": ticket_id, "environment": "UAT", "status": "completed", "timestamp": utc_now()}
