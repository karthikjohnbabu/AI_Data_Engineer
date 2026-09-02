"""OpenAI LLM provider."""

import json
import logging

import httpx

from agents.investigation.root_cause import analyze_root_cause
from agents.triage.classifier import classify_ticket

logger = logging.getLogger(__name__)


class OpenAILLMProvider:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def _chat(self, prompt: str) -> str:
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2,
                    },
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as exc:
            logger.warning("OpenAI invoke failed, falling back to rules: %s", exc)
            return ""

    def classify(self, summary: str) -> tuple[str, str, str]:
        text = self._chat(
            f"Classify this data engineering ticket. Return JSON with keys: id, label, severity.\n\n{summary}"
        )
        if text:
            try:
                data = json.loads(text)
                return data["id"], data["label"], data["severity"]
            except (json.JSONDecodeError, KeyError):
                pass
        return classify_ticket(summary)

    def analyze_root_cause(self, classification_id: str, summary: str) -> tuple[str, int]:
        text = self._chat(
            f"Root cause analysis for classification={classification_id}. Ticket: {summary}. "
            "Return JSON with keys: root_cause, confidence (0-100)."
        )
        if text:
            try:
                data = json.loads(text)
                return data["root_cause"], int(data["confidence"])
            except (json.JSONDecodeError, KeyError, ValueError):
                pass
        root_cause, _, confidence = analyze_root_cause(classification_id, summary)
        return root_cause, confidence


def build_openai_provider() -> OpenAILLMProvider:
    from config.settings import get_settings

    settings = get_settings()
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAILLMProvider(settings.openai_api_key, settings.openai_model)
