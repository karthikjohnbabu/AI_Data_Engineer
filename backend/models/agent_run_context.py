"""AgentRunContext — common object for every agent execution."""

from typing import Any

from pydantic import BaseModel, Field


class AgentRunContext(BaseModel):
    run_id: str
    tenant_id: str
    ticket_id: str | None = None
    repository: str = ""
    branch: str = ""
    environment: str = "dev"
    workflow_id: str = ""
    workflow_stage: str = ""
    risk_level: str = "MEDIUM"
    user: str | None = None
    permissions: list[str] = Field(default_factory=list)
    memory_context: dict[str, Any] = Field(default_factory=dict)
    skill_context: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
