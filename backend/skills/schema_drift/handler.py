"""Handler for schema_drift skill."""

def handle(context: dict) -> dict:
    return {"skill": "schema_drift", "status": "ok", "context": context}
