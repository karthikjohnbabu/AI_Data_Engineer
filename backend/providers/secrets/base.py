from typing import Protocol


class SecretProvider(Protocol):
    def get_secret(self, name: str, tenant_id: str) -> dict: ...
