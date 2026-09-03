"""create_branch stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class CreateBranchStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "create_branch completed"
        result.output = {"stage": "create_branch", "tenant_id": tenant.tenant_id}
        return result
