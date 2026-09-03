"""Human-in-the-loop approval engine."""

from database.platform_repository import create_pending_action, list_pending_actions, resolve_pending_action


def request_approval(ticket_id: str, action: str, message: str, source: str = "agent") -> dict:
    return create_pending_action(source=source, action=action, message=message, ticket_id=ticket_id)


def list_approvals() -> list[dict]:
    return list_pending_actions()


def decide(action_id: str, approved: bool) -> dict:
    return resolve_pending_action(action_id, approved)
