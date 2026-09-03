"""Handler for incident_analysis skill."""

def handle(context: dict) -> dict:
    return {"skill": "incident_analysis", "status": "ok", "context": context}
