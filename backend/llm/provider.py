"""Base LLM provider interface for Newton."""

from typing import Protocol


class LLMProvider(Protocol):
    def complete(self, prompt: str, **kwargs) -> str: ...
