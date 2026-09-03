"""Severity mapping for Newton triage."""


def map_severity(base: str, summary: str) -> str:
    text = summary.lower()
    if any(k in text for k in ("outage", "prod down", "data loss", "pii leak")):
        return "Critical"
    if any(k in text for k in ("timeout", "failed", "broken", "sla")):
        return "High" if base != "Critical" else base
    return base or "Medium"
