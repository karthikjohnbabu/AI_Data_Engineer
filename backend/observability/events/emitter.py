"""Structured event emitter for Newton dashboard / audit trail."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

_EVENTS: list[dict[str, Any]] = []


def emit_event(
    name: str,
    tenant_id: str,
    run_id: str,
    *,
    workflow_stage: str = "",
    data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = {
        "name": name,
        "tenant_id": tenant_id,
        "run_id": run_id,
        "workflow_stage": workflow_stage,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "data": data or {},
    }
    _EVENTS.append(event)
    return event


def get_events(*, tenant_id: str | None = None) -> list[dict[str, Any]]:
    if tenant_id is None:
        return list(_EVENTS)
    return [e for e in _EVENTS if e["tenant_id"] == tenant_id]


def clear_events() -> None:
    _EVENTS.clear()
