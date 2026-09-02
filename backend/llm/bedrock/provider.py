"""Amazon Bedrock LLM provider."""

import json
import logging

from agents.investigation.root_cause import analyze_root_cause
from agents.triage.classifier import classify_ticket

logger = logging.getLogger(__name__)


class BedrockLLMProvider:
    def __init__(self, region: str, model_id: str):
        self.region = region
        self.model_id = model_id

    def _invoke(self, prompt: str) -> str:
        try:
            import boto3

            client = boto3.client("bedrock-runtime", region_name=self.region)
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            }
            response = client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )
            payload = json.loads(response["body"].read())
            return payload.get("content", [{}])[0].get("text", "")
        except Exception as exc:
            logger.warning("Bedrock invoke failed, falling back to rules: %s", exc)
            return ""

    def classify(self, summary: str) -> tuple[str, str, str]:
        text = self._invoke(
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
        text = self._invoke(
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


def build_bedrock_provider() -> BedrockLLMProvider:
    from config.settings import get_settings

    settings = get_settings()
    return BedrockLLMProvider(settings.aws_region or "eu-west-2", settings.bedrock_model_id)
