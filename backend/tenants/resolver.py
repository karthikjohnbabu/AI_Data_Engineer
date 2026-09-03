"""Resolve tenant_id from request / deployment mode."""

from __future__ import annotations

from tenants.context import TenantContext
from tenants.registry import get_tenant_registry
from tenants.validation import TenantValidationError, validate_single_tenant_request, validate_tenant_exists


def resolve_tenant(
    requested_tenant_id: str | None = None,
    *,
    header_tenant_id: str | None = None,
    auth_tenant_id: str | None = None,
) -> TenantContext:
    """Resolve TenantContext for the current request.

    Priority in multi_tenant: auth > header > explicit request param.
    In single_tenant: always configured NEWTON_TENANT_ID; foreign IDs rejected.
    """
    from config.settings import get_settings

    settings = get_settings()
    registry = get_tenant_registry()
    known = registry.all()

    if settings.newton_deployment_mode == "single_tenant":
        configured = settings.newton_tenant_id
        if not configured:
            raise TenantValidationError("NEWTON_TENANT_ID required in single_tenant mode")
        for candidate in (requested_tenant_id, header_tenant_id, auth_tenant_id):
            validate_single_tenant_request(candidate, configured)
        cfg = validate_tenant_exists(configured, known)
        return TenantContext.from_config(cfg)

    tenant_id = auth_tenant_id or header_tenant_id or requested_tenant_id
    if not tenant_id:
        # Dev fallback: default tenant when none supplied
        tenant_id = settings.newton_default_tenant_id
    cfg = validate_tenant_exists(tenant_id, known)
    return TenantContext.from_config(cfg)
