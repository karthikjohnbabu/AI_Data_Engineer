"""Escalation paths for stalled approvals."""


def escalate(ticket_id: str, channels: list[str] | None = None) -> dict:
    channels = channels or ["slack", "teams"]
    return {"ticketId": ticket_id, "escalatedTo": channels, "status": "notified"}
