"""Workflow run context."""

from typing import Any

from pydantic import BaseModel, Field

from models.agent_run_context import AgentRunContext


class WorkflowRunContext(BaseModel):
    workflow_id: str
    template_name: str
    tenant_id: str
    run: AgentRunContext
    stage_outputs: dict[str, Any] = Field(default_factory=dict)
    status: str = "running"
