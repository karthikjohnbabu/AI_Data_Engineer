"""Handler for spark skill."""

def handle(context: dict) -> dict:
    return {"skill": "spark", "status": "ok", "context": context}
