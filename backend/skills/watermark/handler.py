"""Handler for watermark skill."""

def handle(context: dict) -> dict:
    return {"skill": "watermark", "status": "ok", "context": context}
