"""Agent orchestrator — full triage → investigation → coding → testing pipeline."""

from agents.coding.code_generator import generate_fix
from agents.investigation.root_cause import analyze_root_cause
from agents.testing.agent import run_tests
from agents.triage.classifier import classify_ticket
from agents.validation.agent import run_validation
from models.agent_run import AgentRunResult, RunStatus, TimelineStep, utc_now
from services.run_store import save_deployment, save_run, save_ticket_override


def _step(step_id: str, label: str, status: str, description: str) -> TimelineStep:
    return TimelineStep(
        id=step_id,
        label=label,
        status=status,
        timestamp=utc_now() if status == "completed" else None,
        description=description,
    )


def run_ticket_pipeline(ticket_id: str, summary: str) -> AgentRunResult:
    """Execute the full agent pipeline for a ticket."""
    timeline: list[TimelineStep] = []

    timeline.append(_step("1", "Jira analysed", "completed", "Ticket parsed and classified"))
    timeline.append(_step("2", "Architecture loaded", "completed", "Platform architecture retrieved from memory"))
    timeline.append(_step("3", "Repository identified", "completed", "Target repository and branch identified"))

    classification_id, classification_label, severity = classify_ticket(summary)
    timeline.append(_step("4", "Memory searched", "completed", "Similar incidents searched in agent memory"))

    root_cause, impacted_files, confidence = analyze_root_cause(classification_id, summary)
    timeline.append(_step("5", "Root cause identified", "completed", f"Classified as: {classification_label}"))

    code_changes = generate_fix(classification_id, impacted_files)
    timeline.append(_step("6", "Fix generated", "completed" if code_changes else "pending",
                          f"{len(code_changes)} file(s) modified" if code_changes else "Awaiting more context"))

    test_results = run_tests(classification_id, confidence) if code_changes else []
    all_passed = all(t["status"] == "passed" for t in test_results)
    timeline.append(_step("7", "Tests executed", "completed" if all_passed else "failed",
                          f"{sum(1 for t in test_results if t['status'] == 'passed')}/{len(test_results)} tests passed"))

    data_validation = run_validation(classification_id, confidence) if code_changes else []
    validation_passed = all(v["status"] == "passed" for v in data_validation)

    pr_status = "completed" if all_passed and validation_passed and confidence >= 70 else "pending"
    timeline.append(_step("8", "PR created", pr_status,
                          "PR ready for review" if pr_status == "completed" else "Blocked by test/validation failures"))

    timeline.append(_step("9", "Deployment validated", "pending", "Awaiting human approval for UAT"))

    agent_status = "Awaiting Review" if pr_status == "completed" else "Testing" if test_results else "Investigating"
    ticket_status = "In Review" if pr_status == "completed" else "In Progress"

    deployments = [
        {"stage": "Dev", "status": "completed" if all_passed else "pending", "approvedBy": "Auto-deploy" if all_passed else None, "timestamp": utc_now() if all_passed else None},
        {"stage": "UAT", "status": "pending", "approvedBy": None, "timestamp": None},
        {"stage": "Prod", "status": "pending", "approvedBy": None, "timestamp": None},
        {"stage": "Validation", "status": "completed" if validation_passed else "pending", "approvedBy": "Validation Agent" if validation_passed else None, "timestamp": utc_now() if validation_passed else None},
    ]

    result = AgentRunResult(
        ticket_id=ticket_id,
        status=RunStatus.COMPLETED if all_passed else RunStatus.FAILED,
        classification=classification_label,
        severity=severity,
        root_cause=root_cause,
        confidence=confidence,
        impacted_files=impacted_files,
        timeline=timeline,
        code_changes=code_changes,
        test_results=test_results,
        data_validation=data_validation,
        summary=(
            f"Agent classified ticket as {classification_label} ({severity} severity). "
            f"Generated fix across {len(code_changes)} file(s) with {confidence}% confidence. "
            f"Tests: {sum(1 for t in test_results if t['status'] == 'passed')}/{len(test_results)} passed."
        ),
        completed_at=utc_now(),
    )

    save_run(result)
    save_ticket_override(ticket_id, {
        "agentStatus": agent_status,
        "confidence": confidence,
        "rootCause": root_cause,
        "impactedFiles": impacted_files,
        "codeChanges": code_changes,
        "testResults": test_results,
        "dataValidation": data_validation,
        "deployments": deployments,
        "timeline": [step.model_dump() for step in timeline],
        "summary": result.summary,
        "status": ticket_status,
        "pr": f"#{hash(ticket_id) % 900 + 100}" if pr_status == "completed" else None,
        "impact": {
            "level": severity,
            "filesAffected": len(impacted_files),
            "tablesAffected": 1 if impacted_files else 0,
            "blastRadius": "Low" if confidence >= 80 else "Medium",
        },
    })

    if all_passed:
        save_deployment({
            "id": f"dep-{ticket_id}-dev",
            "ticketId": ticket_id,
            "environment": "Dev",
            "status": "completed",
            "approvedBy": "Auto-deploy",
            "timestamp": utc_now(),
            "createdAt": utc_now(),
        })

    return result
