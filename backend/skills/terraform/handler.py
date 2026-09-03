"""Handler for terraform skill."""

def handle(context: dict) -> dict:
    return {"skill": "terraform", "status": "ok", "context": context}
