"""Load per-tenant secrets from gitignored secrets.local.yaml."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from config.settings import get_settings
from tenants.context import get_tenant_context


def tenant_data_root() -> Path:
    return Path(get_settings().tenant_data_dir)


def tenant_dir(tenant_id: str) -> Path:
    return tenant_data_root() / tenant_id


def load_tenant_secrets(tenant_id: str | None = None) -> dict[str, Any]:
    """Return decrypted-at-rest local secrets for one tenant (never another)."""
    tid = tenant_id or _active_tenant_id()
    if not tid:
        return {}
    path = tenant_dir(tid) / "secrets.local.yaml"
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return data if isinstance(data, dict) else {}


def secrets_status(tenant_id: str | None = None) -> dict[str, bool]:
    """Which services have at least one non-empty value (no secret values)."""
    secrets = load_tenant_secrets(tenant_id)
    status: dict[str, bool] = {}
    for service, payload in secrets.items():
        if not isinstance(payload, dict):
            status[str(service)] = bool(payload)
            continue
        status[str(service)] = any(str(v).strip() for v in payload.values() if v is not None)
    return status


def _active_tenant_id() -> str:
    ctx = get_tenant_context()
    if ctx:
        return ctx.tenant_id
    return get_settings().newton_default_tenant_id or "newton"
