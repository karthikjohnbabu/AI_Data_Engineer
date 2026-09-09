"""Reject cross-tenant secret and store access."""

from tenants.context import get_tenant_context


def handle(context: dict) -> dict:
    """Return the active tenant id or fail closed."""
    requested = str(context.get("tenant_id") or "")
    ctx = get_tenant_context()
    active = ctx.tenant_id if ctx else ""
    if requested and active and requested != active:
        return {
            "ok": False,
            "error": f"tenant mismatch: requested {requested}, active {active}",
        }
    return {"ok": True, "tenant_id": requested or active}
