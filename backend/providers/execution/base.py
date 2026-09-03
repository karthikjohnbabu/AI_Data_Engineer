from typing import Protocol


class ExecutionProvider(Protocol):
    def run(self, job: dict) -> dict: ...
