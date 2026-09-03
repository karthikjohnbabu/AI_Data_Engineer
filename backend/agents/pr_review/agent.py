"""PR review agent — code, security, and risk."""

from agents.pr_review.code_review import review_code
from agents.pr_review.risk_review import review_risk
from agents.pr_review.security_review import review_security


def run_pr_review(code_changes: list, severity: str) -> dict:
    return {
        "code": review_code(code_changes),
        "security": review_security(code_changes),
        "risk": review_risk(severity),
        "approvedByAgent": True,
        "requiresHumanApproval": severity in {"Critical", "High"},
    }
