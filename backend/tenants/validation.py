"""Tenant validation and single-tenant foreign-id rejection."""

from tenants.models import TenantConfig


class TenantValidationError(ValueError):
    pass


def validate_tenant_exists(tenant_id: str, known: dict[str, TenantConfig]) -> TenantConfig:
    if tenant_id not in known:
        raise TenantValidationError(f"Unknown tenant: {tenant_id}")
    return known[tenant_id]


def validate_single_tenant_request(
    requested_tenant_id: str | None,
    configured_tenant_id: str,
) -> str:
    """In single_tenant mode, reject any foreign tenant_id."""
    if requested_tenant_id and requested_tenant_id != configured_tenant_id:
        raise TenantValidationError(
            f"Foreign tenant '{requested_tenant_id}' rejected in single_tenant mode "
            f"(configured={configured_tenant_id})"
        )
    return configured_tenant_id
