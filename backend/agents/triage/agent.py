"""Triage agent — classify, score severity/risk, and route."""

from agents.triage.classifier import classify_ticket
from agents.triage.risk import score_risk
from agents.triage.routing import route_ticket
from agents.triage.severity import map_severity


def run_triage(summary: str) -> dict:
    classification_id, classification_label, severity = classify_ticket(summary)
    severity = map_severity(severity, summary)
    risk = score_risk(severity, classification_id)
    workflow = route_ticket(severity, classification_label)
    return {
        "classificationId": classification_id,
        "classification": classification_label,
        "severity": severity,
        "risk": risk,
        "workflow": workflow,
    }
