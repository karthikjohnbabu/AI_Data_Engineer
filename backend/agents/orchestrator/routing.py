"""Route tickets to agent workflows based on triage output."""

from agents.orchestrator.state import PipelineStage


def route_after_triage(severity: str, classification: str) -> str:
    """Return workflow id for the next execution path."""
    if severity.lower() in {"critical", "high"} and "incident" in classification.lower():
        return "incident_resolution"
    if "deploy" in classification.lower():
        return "dev_deployment"
    return "full_ticket_resolution"


def stage_requires_human_gate(stage: PipelineStage) -> bool:
    return stage in {
        PipelineStage.HUMAN_APPROVAL,
        PipelineStage.PROD_DEPLOY,
        PipelineStage.MERGE,
    }
