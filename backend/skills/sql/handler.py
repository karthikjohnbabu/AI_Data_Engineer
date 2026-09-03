"""Handler for sql skill."""

def handle(context: dict) -> dict:
    return {"skill": "sql", "status": "ok", "context": context}
