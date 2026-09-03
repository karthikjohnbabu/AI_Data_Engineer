from typing import Protocol


class CloudProvider(Protocol):
    def describe_environment(self, name: str) -> dict: ...
