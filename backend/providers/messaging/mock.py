class MockMessagingProvider:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    def send(self, channel: str, message: str, payload: dict | None = None) -> dict:
        return {"tenant_id": self.tenant_id, "channel": channel, "message": message, "status": "queued"}
