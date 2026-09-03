"""Block pipeline progression until human approval."""

from approvals.policies import requires_human


def gate(action: str, severity: str, approved: bool) -> dict:
    if not requires_human(action, severity):
        return {"blocked": False, "reason": "policy_auto"}
    if approved:
        return {"blocked": False, "reason": "human_approved"}
    return {"blocked": True, "reason": "awaiting_engineer_approval"}
