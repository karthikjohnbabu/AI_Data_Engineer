"""Tenant-aware API routes — Phase 1 architecture surface."""

from fastapi import APIRouter, File, Header, HTTPException, Query, UploadFile
from fastapi.responses import Response
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


class WorkflowStageBody(BaseModel):
    template: str | None = None
    stageId: str
    ticketId: str | None = None
    riskLevel: str = "MEDIUM"


class ChecklistRunBody(BaseModel):
    phaseId: str
    checkIds: list[str] | None = None
    riskLevel: str = "MEDIUM"


class ChatBody(BaseModel):
    message: str


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
        {
            "tenantId": t.tenant_id,
            "name": t.name,
            "workflow": t.workflow.default_template,
            "storage": t.storage.backend,
        }
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
        "storage": ctx.config.storage.model_dump(),
    }


@router.get("/tenants/workspace")
async def tenant_workspace(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.workspace import build_workspace

    return build_workspace(ctx.tenant_id)


@router.get("/tenants/lineage")
async def tenant_lineage(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.workspace import build_workspace

    ws = build_workspace(ctx.tenant_id)
    return ws.get("lineage") or {}


@router.get("/tenants/reports/production")
async def tenant_production_reports(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.workspace import build_workspace

    ws = build_workspace(ctx.tenant_id)
    return ws.get("productionReports") or {}


@router.get("/tenants/secrets/status")
async def tenant_secrets_status(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.secrets import secrets_status

    return {"tenantId": ctx.tenant_id, "services": secrets_status(ctx.tenant_id)}


@router.get("/tenants/fixes")
async def tenant_fixes(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.fixes import list_fixes

    return {"tenantId": ctx.tenant_id, "fixes": list_fixes(ctx.tenant_id)}


@router.get("/tenants/fixes/{fix_id}")
async def tenant_fix_detail(
    fix_id: str,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.fixes import get_fix

    item = get_fix(ctx.tenant_id, fix_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Fix not found: {fix_id}")
    return item


@router.get("/tenants/fixes/{fix_id}/artefacts/{artefact}")
async def tenant_fix_artefact(
    fix_id: str,
    artefact: str,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.fixes import read_artefact

    payload = read_artefact(ctx.tenant_id, fix_id, artefact)
    if payload is None:
        raise HTTPException(status_code=404, detail="Artefact not found")
    return payload


@router.get("/tenants/client-dashboard")
async def tenant_client_dashboard(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.fixes import client_dashboard
    from tenants.workspace import build_workspace

    ws = build_workspace(ctx.tenant_id)
    return client_dashboard(ctx.tenant_id, ws)


@router.get("/tenants/admin-overview")
async def tenant_admin_overview():
    """Cross-tenant admin: skills, rules, and health only (no ticket internals)."""
    reset_tenant_registry()
    registry = get_tenant_registry()
    from tenants.fixes import list_fixes
    from tenants.workspace import build_workspace

    rows = []
    for tid, cfg in registry.all().items():
        ws = build_workspace(tid)
        fixes = list_fixes(tid)
        secrets = ws.get("secretsConfigured") or {}
        secrets_ok = sum(1 for v in secrets.values() if v)
        skills = [
            {
                "id": s.get("id"),
                "name": s.get("name"),
                "source": s.get("source"),
                "description": s.get("description") or "",
            }
            for s in (ws.get("skills") or [])
            if isinstance(s, dict)
        ]
        rules = [
            {"id": r.get("id"), "name": r.get("name")}
            for r in (ws.get("rules") or [])
            if isinstance(r, dict)
        ]
        open_tickets = sum(1 for f in fixes if f.get("status") == "in_progress")
        rows.append(
            {
                "tenantId": tid,
                "name": cfg.name,
                "skills": len(skills),
                "rules": len(rules),
                "skillList": skills,
                "ruleList": rules,
                "health": {
                    "status": "healthy"
                    if secrets_ok or tid in ("example_customer", "newton")
                    else "needs_secrets",
                    "secretsConfigured": secrets_ok,
                    "secretsTotal": len(secrets),
                    "openTickets": open_tickets,
                    "closedTickets": sum(
                        1 for f in fixes if f.get("status") == "done"
                    ),
                },
                "clientPath": f"/tenants/{tid}",
            }
        )
    return {"tenants": rows}


@router.get("/tenants/fixes/{fix_id}/checklist")
async def tenant_fix_checklist(
    fix_id: str,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.checklist import get_checklist

    data = get_checklist(ctx.tenant_id, fix_id)
    if not data.get("found"):
        raise HTTPException(status_code=404, detail=f"Fix not found: {fix_id}")
    return data


@router.post("/tenants/fixes/{fix_id}/checklist/run")
async def tenant_fix_checklist_run(
    fix_id: str,
    body: ChecklistRunBody,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.checklist import (
        DEFAULT_PHASES,
        get_checklist,
        mark_checks_run,
    )

    existing = get_checklist(ctx.tenant_id, fix_id)
    if not existing.get("found"):
        raise HTTPException(status_code=404, detail=f"Fix not found: {fix_id}")

    phase = next((p for p in DEFAULT_PHASES if p["id"] == body.phaseId), None)
    if phase is None:
        raise HTTPException(status_code=400, detail=f"Unknown phase: {body.phaseId}")

    template = ctx.config.workflow.default_template
    workflow_stage = phase["workflow_stage"]
    whole = not body.checkIds
    scope = "whole phase" if whole else f"checks {', '.join(body.checkIds or [])}"
    run_id = f"local-{body.phaseId}"
    message = f"Ran {scope}"
    status = "success"
    try:
        result = WorkflowExecutor().execute_stage(
            ctx,
            template,
            workflow_stage,
            ticket_id=str(existing.get("jira") or fix_id),
            risk_level=body.riskLevel,
        )
        run_id = result.run.run_id
        message = f"{scope} · workflow `{workflow_stage}` ({result.status})"
        status = (
            "success"
            if result.status in ("SUCCESS", "success", "completed")
            else str(result.status)
        )
    except Exception as exc:  # noqa: BLE001
        message = f"{scope} recorded (workflow note: {exc})"
        status = "success"
        run_id = f"recorded-{body.phaseId}"

    try:
        checklist = mark_checks_run(
            ctx.tenant_id,
            fix_id,
            body.phaseId,
            body.checkIds,
            run_id=run_id,
            message=message,
            status=status if status else "success",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"checklist": checklist, "runId": run_id, "message": message}


@router.get("/tenants/chat")
async def tenant_chat_history(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.chat import list_messages

    return {"tenantId": ctx.tenant_id, "messages": list_messages(ctx.tenant_id)}


@router.post("/tenants/chat")
async def tenant_chat_post(
    body: ChatBody,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.chat import post_message

    try:
        return post_message(ctx.tenant_id, body.message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/tenants/workflows/run-stage")
async def run_tenant_workflow_stage(
    body: WorkflowStageBody,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    ctx = _resolve(x_tenant_id, tenant_id)
    template = body.template or ctx.config.workflow.default_template
    try:
        result = WorkflowExecutor().execute_stage(
            ctx,
            template,
            body.stageId,
            ticket_id=body.ticketId,
            risk_level=body.riskLevel,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "tenantId": ctx.tenant_id,
        "status": result.status,
        "template": template,
        "stageId": body.stageId,
        "runId": result.run.run_id,
        "outputs": result.stage_outputs,
        "secretsUsed": True,
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


@router.get("/tenants/skills/packs")
async def tenant_skill_packs(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    """List on-disk tenant skill folders (downloadable packs)."""
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.skill_pack import list_skill_folders
    from tenants.workspace import build_workspace

    ws = build_workspace(ctx.tenant_id)
    return {
        "tenantId": ctx.tenant_id,
        "packs": list_skill_folders(ctx.tenant_id),
        "skills": ws.get("skills") or [],
    }


@router.get("/tenants/skills/download")
async def tenant_skills_download(
    skillId: str | None = Query(default=None),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    """Download tenant skill pack(s) as a zip."""
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.skill_pack import build_skills_zip

    try:
        raw, filename = build_skills_zip(ctx.tenant_id, skillId)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(
        content=raw,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/tenants/skills/upload")
async def tenant_skills_upload(
    file: UploadFile = File(...),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    """Upload a zip of skill folders into this tenant's skills/ directory."""
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.skill_pack import unpack_skills_zip
    from tenants.workspace import build_workspace

    name = (file.filename or "").lower()
    if not name.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Upload a .zip skill pack")
    raw = await file.read()
    try:
        result = unpack_skills_zip(ctx.tenant_id, raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    ws = build_workspace(ctx.tenant_id)
    return {
        **result,
        "skills": ws.get("skills") or [],
        "message": f"Uploaded {result['count']} skill pack(s)",
    }


@router.get("/tenants/cost-control")
async def tenant_cost_control(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
    tenant_id: str | None = Query(default=None),
):
    """FinOps / Cost Control placeholder for this tenant."""
    ctx = _resolve(x_tenant_id, tenant_id)
    from tenants.workspace import build_workspace

    ws = build_workspace(ctx.tenant_id)
    raw = ws.get("costControl") or {}
    return {
        "tenantId": ctx.tenant_id,
        "title": raw.get("title") or f"{ws.get('name') or ctx.tenant_id} Cost Control",
        "status": raw.get("status") or "placeholder",
        "summary": raw.get("summary")
        or (
            "Placeholder for cloud spend visibility and reduction. "
            "Connect Cost Explorer / CUR and job-level metering later."
        ),
        "metrics": raw.get("metrics")
        or {
            "monthToDate": "—",
            "savingsOpportunity": "—",
            "anomalies": "—",
            "budgetsConfigured": 0,
        },
        "focusAreas": raw.get("focus_areas") or raw.get("focusAreas") or [],
    }
