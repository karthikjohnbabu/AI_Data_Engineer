"""TenantContext — propagated through the full Newton execution chain."""

from __future__ import annotations

from contextvars import ContextVar
from typing import Any

from pydantic import BaseModel, Field

from tenants.models import TenantConfig

_tenant_ctx: ContextVar["TenantContext | None"] = ContextVar("newton_tenant_ctx", default=None)


class TenantContext(BaseModel):
    tenant_id: str
    name: str
    deployment_mode: str
    config: TenantConfig
    metadata: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_config(cls, config: TenantConfig) -> "TenantContext":
        return cls(
            tenant_id=config.tenant_id,
            name=config.name,
            deployment_mode=config.deployment_mode,
            config=config,
        )


def set_tenant_context(ctx: TenantContext | None) -> None:
    _tenant_ctx.set(ctx)


def get_tenant_context() -> TenantContext | None:
    return _tenant_ctx.get()


def require_tenant_context() -> TenantContext:
    ctx = get_tenant_context()
    if ctx is None:
        raise RuntimeError("TenantContext is required but not set")
    return ctx
