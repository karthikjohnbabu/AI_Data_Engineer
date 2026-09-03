"""Risk scoring for triage decisions."""


def score_risk(severity: str, classification_id: str) -> dict:
    base = {"Critical": 90, "High": 70, "Medium": 45, "Low": 20}.get(severity, 40)
    bump = 10 if classification_id in {"glue-perf", "schema-drift", "recon"} else 0
    score = min(100, base + bump)
    return {
        "score": score,
        "level": "high" if score >= 70 else "medium" if score >= 40 else "low",
        "humanApprovalRequired": score >= 70,
    }
