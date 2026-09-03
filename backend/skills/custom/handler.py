"""Handler for custom skill."""

def handle(context: dict) -> dict:
    return {"skill": "custom", "status": "ok", "context": context}
