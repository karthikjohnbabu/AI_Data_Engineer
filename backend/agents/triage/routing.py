"""Triage routing helpers."""

from agents.orchestrator.routing import route_after_triage


def route_ticket(severity: str, classification: str) -> str:
    return route_after_triage(severity, classification)
