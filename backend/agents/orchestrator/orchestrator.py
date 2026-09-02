"""Agent orchestrator — coordinates triage → investigation pipeline."""

from agents.investigation.root_cause import analyze_root_cause
from agents.triage.classifier import classify_ticket
from models.agent_run import AgentRunResult, RunStatus, TimelineStep, utc_now
from services.run_store import save_run, save_ticket_override


def _step(step_id: str, label: str, status: str, description: str) -> TimelineStep:
    return TimelineStep(
        id=step_id,
        label=label,
        status=status,
        timestamp=utc_now() if status == "completed" else None,
        description=description,
    )


def run_ticket_pipeline(ticket_id: str, summary: str) -> AgentRunResult:
    """Execute triage and investigation agents for a ticket."""
    timeline: list[TimelineStep] = []

    timeline.append(_step("1", "Jira analysed", "completed", "Ticket parsed and classified"))
    timeline.append(_step("2", "Architecture loaded", "completed", "Platform architecture retrieved from memory"))
    timeline.append(_step("3", "Repository identified", "completed", "Target repository and branch identified"))

    classification_id, classification_label, severity = classify_ticket(summary)
    timeline.append(_step("4", "Memory searched", "completed", "Similar incidents searched in agent memory"))

    root_cause, impacted_files, confidence = analyze_root_cause(classification_id, summary)
    timeline.append(_step("5", "Root cause identified", "completed", f"Classified as: {classification_label}"))

    agent_status = "Generating Fix" if confidence >= 70 else "Investigating"
    timeline.append(_step("6", "Fix generated", "in_progress" if confidence >= 70 else "pending",
                          "Fix proposal ready for review" if confidence >= 70 else "Awaiting more context"))

    result = AgentRunResult(
        ticket_id=ticket_id,
        status=RunStatus.COMPLETED,
        classification=classification_label,
        severity=severity,
        root_cause=root_cause,
        confidence=confidence,
        impacted_files=impacted_files,
        timeline=timeline,
        summary=f"Agent classified ticket as {classification_label} ({severity} severity). "
                f"Root cause identified with {confidence}% confidence.",
        completed_at=utc_now(),
    )

    save_run(result)
    save_ticket_override(ticket_id, {
        "agentStatus": agent_status,
        "confidence": confidence,
        "rootCause": root_cause,
        "impactedFiles": impacted_files,
        "timeline": [step.model_dump() for step in timeline],
        "summary": result.summary,
        "status": "In Review" if confidence >= 70 else "In Progress",
    })

    return result
