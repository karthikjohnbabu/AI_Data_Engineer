"""Handler for redshift skill."""

def handle(context: dict) -> dict:
    return {"skill": "redshift", "status": "ok", "context": context}
