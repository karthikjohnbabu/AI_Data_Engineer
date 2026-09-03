"""Configuration-driven workflow executor."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable
from uuid import uuid4

import yaml

from models.agent_run_context import AgentRunContext
from observability.events.emitter import emit_event
from tenants.context import TenantContext
from workflows.engine.context import WorkflowRunContext
from workflows.engine.state_machine import WorkflowStateMachine
from workflows.stages.base import StageHandler, StageResult
from workflows.stages.registry import get_stage_handler


class WorkflowExecutor:
    def __init__(self, templates_dir: Path | None = None):
        self.templates_dir = templates_dir or (
            Path(__file__).resolve().parent.parent / "templates"
        )

    def load_template(self, name: str) -> dict:
        path = self.templates_dir / f"{name}.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Workflow template not found: {name}")
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}

    def ordered_stages(self, template: dict) -> list[dict]:
        stages = template.get("stages", [])
        # support list of strings or list of dicts
        normalized = []
        for s in stages:
            if isinstance(s, str):
                normalized.append({"id": s, "type": s, "enabled": True})
            else:
                item = dict(s)
                item.setdefault("id", item.get("type", "stage"))
                item.setdefault("type", item["id"])
                item.setdefault("enabled", True)
                normalized.append(item)
        return normalized

    def execute(
        self,
        tenant: TenantContext,
        template_name: str,
        *,
        ticket_id: str | None = None,
        user: str | None = None,
        risk_level: str = "MEDIUM",
        handlers: dict[str, StageHandler] | None = None,
    ) -> WorkflowRunContext:
        template = self.load_template(template_name)
        stages = self.ordered_stages(template)
        run_id = str(uuid4())[:12]
        agent_run = AgentRunContext(
            run_id=run_id,
            tenant_id=tenant.tenant_id,
            ticket_id=ticket_id,
            repository=tenant.config.git.repository,
            workflow_id=template.get("name", template_name),
            risk_level=risk_level,
            user=user,
        )
        ctx = WorkflowRunContext(
            workflow_id=agent_run.workflow_id,
            template_name=template_name,
            tenant_id=tenant.tenant_id,
            run=agent_run,
        )
        emit_event("workflow.started", tenant.tenant_id, run_id, workflow_stage="start")

        sm = WorkflowStateMachine(stages)
        stage = sm.start()
        while stage is not None:
            stage_type = stage["type"]
            agent_run.workflow_stage = stage_type
            emit_event(
                f"{stage_type}.started",
                tenant.tenant_id,
                run_id,
                workflow_stage=stage_type,
            )
            handler = (handlers or {}).get(stage_type) or get_stage_handler(stage_type)
            result: StageResult = handler.run(tenant, agent_run, stage, ctx.stage_outputs)
            ctx.stage_outputs[stage_type] = result.output
            emit_event(
                f"{stage_type}.completed" if result.success else f"{stage_type}.failed",
                tenant.tenant_id,
                run_id,
                workflow_stage=stage_type,
                data={"success": result.success, "message": result.message},
            )
            if not result.success:
                on_failure = stage.get("on_failure", "stop")
                ctx.status = "failed"
                if on_failure == "stop":
                    break
            stage = sm.advance()
        else:
            ctx.status = "completed"

        if ctx.status == "running":
            ctx.status = "completed"
        emit_event("workflow.completed", tenant.tenant_id, run_id, workflow_stage="end", data={"status": ctx.status})
        return ctx
