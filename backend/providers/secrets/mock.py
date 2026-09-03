class MockSecretProvider:
    def get_secret(self, name: str, tenant_id: str) -> dict:
        return {"tenant_id": tenant_id, "name": name, "value": "***"}
