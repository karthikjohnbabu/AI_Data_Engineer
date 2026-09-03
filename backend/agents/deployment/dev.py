"""DEV deployment."""

from models.agent_run import utc_now


def deploy_dev(ticket_id: str) -> dict:
    return {"ticketId": ticket_id, "environment": "Dev", "status": "completed", "timestamp": utc_now()}
