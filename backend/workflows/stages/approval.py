"""approval stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class ApprovalStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "approval completed"
        result.output = {"stage": "approval", "tenant_id": tenant.tenant_id}
        return result
