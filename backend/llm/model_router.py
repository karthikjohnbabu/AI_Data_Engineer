"""LLM provider abstraction — swap engines without changing agents."""

from typing import Protocol


class LLMProvider(Protocol):
  def classify(self, summary: str) -> tuple[str, str, str]:
    """Return (classification_id, label, severity)."""
    ...

  def analyze_root_cause(self, classification_id: str, summary: str) -> tuple[str, int]:
    """Return (root_cause, confidence)."""
    ...


def get_llm_provider() -> LLMProvider:
  from config.settings import get_settings
  from llm.local.provider import LocalLLMProvider

  settings = get_settings()
  if settings.llm_provider == "local":
    return LocalLLMProvider()
  # Future: bedrock, openai, anthropic
  return LocalLLMProvider()
