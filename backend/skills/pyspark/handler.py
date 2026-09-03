"""Handler for pyspark skill."""

def handle(context: dict) -> dict:
    return {"skill": "pyspark", "status": "ok", "context": context}
