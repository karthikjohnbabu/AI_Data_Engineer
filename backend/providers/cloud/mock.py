class MockCloudProvider:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    def describe_environment(self, name: str) -> dict:
        return {"tenant_id": self.tenant_id, "environment": name, "status": "ready"}
