"""Approval service facade."""

from approvals.engine import decide, list_approvals, request_approval


def list_open_approvals() -> list[dict]:
    return list_approvals()


def request(ticket_id: str, action: str, message: str) -> dict:
    return request_approval(ticket_id, action, message)


def resolve(action_id: str, approved: bool) -> dict:
    return decide(action_id, approved)
