"""validate stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class ValidateStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "validate completed"
        result.output = {"stage": "validate", "tenant_id": tenant.tenant_id}
        return result
