"""Registered tenants cache."""

from __future__ import annotations

from tenants.loader import FileSystemTenantConfigRepository, TenantConfigRepository
from tenants.models import TenantConfig


class TenantRegistry:
    def __init__(self, repo: TenantConfigRepository):
        self._repo = repo
        self._cache: dict[str, TenantConfig] = {}

    def refresh(self) -> None:
        self._cache = {}
        for tid in self._repo.list_tenant_ids():
            cfg = self._repo.get(tid)
            if cfg:
                self._cache[tid] = cfg

    def get(self, tenant_id: str) -> TenantConfig | None:
        if tenant_id not in self._cache:
            cfg = self._repo.get(tenant_id)
            if cfg:
                self._cache[tenant_id] = cfg
        return self._cache.get(tenant_id)

    def all(self) -> dict[str, TenantConfig]:
        if not self._cache:
            self.refresh()
        return dict(self._cache)


_registry: TenantRegistry | None = None


def get_tenant_registry(root: str | None = None) -> TenantRegistry:
    global _registry
    if _registry is None:
        from config.settings import get_settings

        settings = get_settings()
        path = root or settings.tenant_data_dir
        _registry = TenantRegistry(FileSystemTenantConfigRepository(path))
        _registry.refresh()
    return _registry


def reset_tenant_registry() -> None:
    global _registry
    _registry = None
