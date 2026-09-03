"""update_memory stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class UpdateMemoryStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "update_memory completed"
        result.output = {"stage": "update_memory", "tenant_id": tenant.tenant_id}
        return result
