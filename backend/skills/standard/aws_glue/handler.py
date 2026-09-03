def handle(context: dict) -> dict:
    return {"skill": "aws-glue-debugging", "tenant_id": context.get("tenant_id"), "status": "ok"}
