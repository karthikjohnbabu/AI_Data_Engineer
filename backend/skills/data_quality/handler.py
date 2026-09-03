"""Handler for data_quality skill."""

def handle(context: dict) -> dict:
    return {"skill": "data_quality", "status": "ok", "context": context}
