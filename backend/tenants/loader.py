"""Load tenant configuration from filesystem YAML (dev) via repository interface."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

import yaml

from tenants.models import TenantConfig


class TenantConfigRepository(Protocol):
    def list_tenant_ids(self) -> list[str]: ...
    def get(self, tenant_id: str) -> TenantConfig | None: ...


class FileSystemTenantConfigRepository:
    """Filesystem/YAML-backed tenant config. Swap later for Postgres/S3."""

    def __init__(self, root: Path):
        self.root = Path(root)

    def list_tenant_ids(self) -> list[str]:
        if not self.root.exists():
            return []
        return sorted(
            p.name for p in self.root.iterdir() if p.is_dir() and (p / "config.yaml").exists()
        )

    def get(self, tenant_id: str) -> TenantConfig | None:
        path = self.root / tenant_id / "config.yaml"
        if not path.exists():
            return None
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        data.setdefault("tenant_id", tenant_id)
        return TenantConfig.model_validate(data)

    def tenant_dir(self, tenant_id: str) -> Path:
        return self.root / tenant_id
