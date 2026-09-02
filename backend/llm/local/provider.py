"""Local/rule-based LLM provider (no API key required)."""

from agents.investigation.root_cause import analyze_root_cause
from agents.triage.classifier import classify_ticket


class LocalLLMProvider:
  def classify(self, summary: str) -> tuple[str, str, str]:
    return classify_ticket(summary)

  def analyze_root_cause(self, classification_id: str, summary: str) -> tuple[str, int]:
    root_cause, _, confidence = analyze_root_cause(classification_id, summary)
    return root_cause, confidence
