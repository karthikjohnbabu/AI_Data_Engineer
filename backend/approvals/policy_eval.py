"""Evaluate risk-based approval policies."""

from pathlib import Path

import yaml


def load_approval_policy(path: Path | None = None) -> dict:
    path = path or Path(__file__).resolve().parent.parent / "workflows" / "policies" / "approvals.yaml"
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def evaluate_approval(risk_level: str, policy: dict | None = None) -> dict:
    policy = policy or load_approval_policy()
    level = risk_level.upper()
    return dict(policy.get(level, policy.get("MEDIUM", {"require_human_approval": True})))
