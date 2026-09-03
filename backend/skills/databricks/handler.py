"""Handler for databricks skill."""

def handle(context: dict) -> dict:
    return {"skill": "databricks", "status": "ok", "context": context}
