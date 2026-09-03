"""Handler for aws_glue skill."""

def handle(context: dict) -> dict:
    return {"skill": "aws_glue", "status": "ok", "context": context}
