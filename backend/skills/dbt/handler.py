"""Handler for dbt skill."""

def handle(context: dict) -> dict:
    return {"skill": "dbt", "status": "ok", "context": context}
