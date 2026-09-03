"""create_pr stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class CreatePrStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "create_pr completed"
        result.output = {"stage": "create_pr", "tenant_id": tenant.tenant_id}
        return result
