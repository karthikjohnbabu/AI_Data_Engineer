from typing import Protocol


class MessagingProvider(Protocol):
    def send(self, channel: str, message: str, payload: dict | None = None) -> dict: ...
