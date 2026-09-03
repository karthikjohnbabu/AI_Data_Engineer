"""Deployment risk review."""


def review_risk(severity: str) -> dict:
    return {
        "severity": severity,
        "prodGate": severity in {"Critical", "High"},
        "status": "needs_human" if severity in {"Critical", "High"} else "auto_ok",
    }
