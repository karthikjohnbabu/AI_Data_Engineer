"""notify stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class NotifyStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "notify completed"
        result.output = {"stage": "notify", "tenant_id": tenant.tenant_id}
        return result
