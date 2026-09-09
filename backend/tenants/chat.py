"""Tenant chat — advise on rules/skills/modelling without rewriting menus."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from tenants.secrets import tenant_dir
from tenants.workspace import build_workspace


def _chat_path(tenant_id: str) -> Path:
    return tenant_dir(tenant_id) / "memory" / "chat_log.yaml"


def _suggestions_path(tenant_id: str) -> Path:
    return tenant_dir(tenant_id) / "memory" / "suggestions.yaml"


def _read_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return data if isinstance(data, dict) else {}


def _write_yaml(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def list_messages(tenant_id: str, limit: int = 40) -> list[dict[str, Any]]:
    data = _read_yaml(_chat_path(tenant_id))
    msgs = data.get("messages") or []
    if not isinstance(msgs, list):
        return []
    return msgs[-limit:]


def _advice(tenant_id: str, message: str) -> str:
    ws = build_workspace(tenant_id)
    skills = [s.get("id") for s in (ws.get("skills") or [])][:8]
    rules = [r.get("id") for r in (ws.get("rules") or [])][:8]
    dims = [
        d.get("label") or d.get("id")
        for d in ((ws.get("lineage") or {}).get("dimensions") or [])
    ][:6]
    lower = message.lower()

    if any(k in lower for k in ("lineage", "source", "iceberg", "raw", "model")):
        return (
            f"For **{tenant_id}**, model gold dims as target←Iceberg←raw. "
            f"Known dims: {', '.join(dims) or 'none yet'}. "
            "Prefer LEFT JOIN for enrich; treat INNER JOIN as silent row loss. "
            "I can draft a rule under memory/suggestions — I will not rewrite "
            "top-level menus."
        )
    if any(k in lower for k in ("report", "power bi", "powerbi", "pbi", "dashboard")):
        return (
            "Report development: bind Power BI to gold dims/facts only, never raw. "
            "Use BK columns for relationships; keep measures in a measures table. "
            "Open **Reports** for sample workspaces. Suggestions for DAX naming "
            "can be saved without changing nav."
        )
    if any(k in lower for k in ("rule", "skill", "checklist", "phase")):
        return (
            f"Skills available: {', '.join(skills) or 'none'}. "
            f"Rules: {', '.join(rules) or 'none'}. "
            "Use ticket **Run phase** for triage→DEV→PR→prod. "
            "Ask me to propose a new rule/skill text and I will store it under "
            "`memory/suggestions.yaml` — menus stay unchanged."
        )
    return (
        f"Newton for **{tenant_id}**. Ask about modelling, lineage, "
        "Power BI reports, or improving skills/rules. "
        "Ticket work: open a fix → checklist → Run phase (e.g. place2). "
        f"Skills: {len(skills)} · Rules: {len(rules)} · Dims: {len(dims)}."
    )


def post_message(tenant_id: str, message: str) -> dict[str, Any]:
    text = (message or "").strip()
    if not text:
        raise ValueError("message is required")

    now = datetime.now(timezone.utc).isoformat()
    path = _chat_path(tenant_id)
    data = _read_yaml(path)
    msgs = list(data.get("messages") or [])
    user_msg = {"role": "user", "content": text, "at": now}
    reply = _advice(tenant_id, text)
    assistant_msg = {"role": "assistant", "content": reply, "at": now}
    msgs.extend([user_msg, assistant_msg])
    data["messages"] = msgs[-80:]
    data["updatedAt"] = now
    _write_yaml(path, data)

    # Capture improvement intent without editing menus/skills files directly
    lower = text.lower()
    if any(k in lower for k in ("add rule", "new rule", "improve rule", "add skill", "new skill")):
        sug = _read_yaml(_suggestions_path(tenant_id))
        items = list(sug.get("items") or [])
        items.append(
            {
                "at": now,
                "request": text,
                "status": "proposed",
                "note": "Review before promoting into rules/ or skills/",
            }
        )
        sug["items"] = items[-50:]
        _write_yaml(_suggestions_path(tenant_id), sug)

    return {"tenantId": tenant_id, "messages": [user_msg, assistant_msg]}
