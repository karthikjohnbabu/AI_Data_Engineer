"""rollback stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class RollbackStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "rollback completed"
        result.output = {"stage": "rollback", "tenant_id": tenant.tenant_id}
        return result
