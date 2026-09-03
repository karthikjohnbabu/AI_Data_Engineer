"""update_ticket stage — Phase 1 stub (configurable via workflow templates)."""

from workflows.stages.base import NoopStage, StageResult


class UpdateTicketStage(NoopStage):
    def run(self, tenant, run, stage, prior_outputs) -> StageResult:
        result = super().run(tenant, run, stage, prior_outputs)
        result.message = "update_ticket completed"
        result.output = {"stage": "update_ticket", "tenant_id": tenant.tenant_id}
        return result
