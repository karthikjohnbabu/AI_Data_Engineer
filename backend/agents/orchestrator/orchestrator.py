"""Agent orchestrator — Newton Jira → production pipeline with human gates."""

from agents.coding.agent import run_coding
from agents.deployment.dev import deploy_dev
from agents.investigation.agent import run_investigation
from agents.planner.agent import run_planner
from agents.pr_review.agent import run_pr_review
from agents.testing.agent import run_tests
from agents.triage.agent import run_triage
from agents.validation.agent import run_validation
from database.platform_repository import create_pending_action
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
    """Execute the full Newton agent pipeline for a ticket."""
    timeline: list[TimelineStep] = []

    timeline.append(_step("1", "Jira / Teams / Slack intake", "completed", "Ticket received and notifications relayed"))

    triage = run_triage(summary)
    classification_id = triage["classificationId"]
    classification_label = triage["classification"]
    severity = triage["severity"]
    timeline.append(_step("2", "Triage", "completed", f"{classification_label} · {severity} · risk {triage['risk']['level']}"))

    investigation = run_investigation(classification_id, summary)
    root_cause = investigation["rootCause"]
    impacted_files = investigation["impactedFiles"]
    confidence = investigation["confidence"]
    timeline.append(_step("3", "Investigation", "completed", root_cause[:140]))

    plan = run_planner(ticket_id, classification_id, summary, impacted_files)
    timeline.append(_step("4", "Planner", "completed", f"Blast radius {plan['impact']['blastRadius']} · {len(plan['plan']['steps'])} steps"))

    coding = run_coding(classification_id, impacted_files)
    code_changes = coding["codeChanges"]
    timeline.append(_step("5", "Coding", "completed" if code_changes else "pending",
                          f"{len(code_changes)} file(s) changed" if code_changes else "Awaiting more context"))
    timeline.append(_step("6", "Feature branch", "completed" if code_changes else "pending",
                          f"feature/{ticket_id.lower()}-fix" if code_changes else "Branch not created"))

    test_results = run_tests(classification_id, confidence) if code_changes else []
    all_passed = bool(test_results) and all(t["status"] == "passed" for t in test_results)
    timeline.append(_step("7", "Tests", "completed" if all_passed else "failed",
                          f"{sum(1 for t in test_results if t['status'] == 'passed')}/{len(test_results)} passed"))

    data_validation = run_validation(classification_id, confidence) if code_changes else []
    validation_passed = bool(data_validation) and all(v["status"] == "passed" for v in data_validation)

    if all_passed:
        deploy_dev(ticket_id)
        timeline.append(_step("8", "Deploy to DEV", "completed", "Auto-deployed to DEV"))
        timeline.append(_step("9", "DEV validation", "completed" if validation_passed else "failed",
                              "Row count / schema / reconciliation / DQ"))
    else:
        timeline.append(_step("8", "Deploy to DEV", "pending", "Blocked by failing tests"))
        timeline.append(_step("9", "DEV validation", "pending", "Awaiting DEV deploy"))

    pr_ready = all_passed and validation_passed and confidence >= 70
    timeline.append(_step("10", "Create PR", "completed" if pr_ready else "pending",
                          "PR ready for review" if pr_ready else "Blocked by test/validation failures"))

    review = run_pr_review(code_changes, severity) if pr_ready else None
    timeline.append(_step("11", "PR review", "completed" if review else "pending",
                          "Code / security / risk review" if review else "Awaiting PR"))
    timeline.append(_step("12", "Human approval", "pending",
                          "Engineers approve critical actions before merge / UAT / PROD"))
    timeline.append(_step("13", "Merge to main", "pending", "Awaiting human approval"))
    timeline.append(_step("14", "Deploy PROD", "pending", "Controlled deployment gate"))
    timeline.append(_step("15", "PROD validation", "pending", "Post-deploy data validation"))
    timeline.append(_step("16", "Update Jira / Memory", "pending", "Close ticket and learn sector skill"))

    agent_status = "Awaiting Review" if pr_ready else "Testing" if test_results else "Investigating"
    ticket_status = "In Review" if pr_ready else "In Progress"

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
            f"Newton classified as {classification_label} ({severity}). "
            f"Planned and generated fix across {len(code_changes)} file(s) at {confidence}% confidence. "
            f"Tests: {sum(1 for t in test_results if t['status'] == 'passed')}/{len(test_results)} passed. "
            f"Awaiting engineer approval for controlled promotion."
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
        "pr": f"#{hash(ticket_id) % 900 + 100}" if pr_ready else None,
        "impact": {
            "level": severity,
            "filesAffected": len(impacted_files),
            "tablesAffected": plan["impact"]["tablesAffected"],
            "blastRadius": plan["impact"]["blastRadius"],
        },
        "plan": plan["plan"],
        "prReview": review,
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

    create_pending_action(
        source="agent",
        action="review_fix",
        message=(
            f"Newton completed analysis for {ticket_id}. "
            "Review the fix and approve controlled deployment (UAT → PROD)."
        ),
        ticket_id=ticket_id,
    )

    return result
