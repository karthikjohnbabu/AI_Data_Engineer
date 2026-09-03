"""Tenant-aware API routes — Phase 1 architecture surface."""

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel

from config.settings import get_settings
from providers.git.factory import get_git_provider
from tenants.context import set_tenant_context
from tenants.registry import get_tenant_registry, reset_tenant_registry
from tenants.resolver import resolve_tenant
from tenants.validation import TenantValidationError
from workflows.engine.executor import WorkflowExecutor

router = APIRouter(tags=["tenants"])


class WorkflowRunBody(BaseModel):
    template: str | None = None
    ticketId: str | None = None
    riskLevel: str = "MEDIUM"


def _resolve(x_tenant_id: str | None, tenant_id: str | None):
    try:
        ctx = resolve_tenant(tenant_id, header_tenant_id=x_tenant_id)
    except TenantValidationError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    set_tenant_context(ctx)
    return ctx


@router.get("/tenants")
async def list_tenants():
    settings = get_settings()
    reset_tenant_registry()
    registry = get_tenant_registry()
    tenants = [
        {"tenantId": t.tenant_id, "name": t.name, "workflow": t.workflow.default_template}
        for t in registry.all().values()
    ]
    return {
        "deploymentMode": settings.newton_deployment_mode,
        "configuredTenantId": settings.newton_tenant_id or None,
        "tenants": tenants,
    }


@router.get("/tenants/context")
async def tenant_context(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    return {
        "tenantId": ctx.tenant_id,
        "name": ctx.name,
        "deploymentMode": ctx.deployment_mode,
        "git": ctx.config.git.model_dump(),
        "cloud": ctx.config.cloud.model_dump(),
        "workflow": ctx.config.workflow.model_dump(),
    }


@router.post("/tenants/workflows/run")
async def run_tenant_workflow(
    body: WorkflowRunBody,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    template = body.template or ctx.config.workflow.default_template
    result = WorkflowExecutor().execute(
        ctx,
        template,
        ticket_id=body.ticketId,
        risk_level=body.riskLevel,
    )
    git = get_git_provider(ctx)
    branch = git.create_branch(
        f"{ctx.config.git.branch_strategy.feature_prefix}{body.ticketId or result.run.run_id}"
    )
    return {
        "tenantId": ctx.tenant_id,
        "status": result.status,
        "template": template,
        "runId": result.run.run_id,
        "stages": list(result.stage_outputs.keys()),
        "branch": branch,
    }
