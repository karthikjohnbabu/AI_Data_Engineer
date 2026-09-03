"""Stage handler contract."""

from typing import Any, Protocol

from pydantic import BaseModel, Field

from models.agent_run_context import AgentRunContext
from tenants.context import TenantContext


class StageResult(BaseModel):
    success: bool = True
    message: str = ""
    output: dict[str, Any] = Field(default_factory=dict)


class StageHandler(Protocol):
    def run(
        self,
        tenant: TenantContext,
        run: AgentRunContext,
        stage: dict,
        prior_outputs: dict[str, Any],
    ) -> StageResult: ...


class NoopStage:
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        return StageResult(success=True, message=f"noop:{stage.get('type')}", output={"skipped": False})
