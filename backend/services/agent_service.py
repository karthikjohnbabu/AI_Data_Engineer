"""Agent service — entry point for running agents."""

from agents.orchestrator.orchestrator import run_ticket_pipeline
from integrations.github.client import get_git_client
from models.agent_run import AgentRunResult, utc_now
from services.run_store import get_run, get_ticket_override, list_runs, save_ticket_override
from services.ticket_service import get_ticket, get_ticket_summary


def run_agent(ticket_id: str) -> AgentRunResult:
    summary = get_ticket_summary(ticket_id)
    if not summary:
        raise ValueError(f"Ticket {ticket_id} not found")
    return run_ticket_pipeline(ticket_id, summary)


def get_agent_run(ticket_id: str) -> AgentRunResult | None:
    return get_run(ticket_id)


def get_all_runs() -> list[AgentRunResult]:
    return list_runs()


def approve_ticket(ticket_id: str) -> dict:
    override = get_ticket_override(ticket_id) or {}
    override.update({
        "status": "Done",
        "agentStatus": "Completed",
        "deployments": _advance_deployment(override.get("deployments", []), "UAT"),
    })
    save_ticket_override(ticket_id, override)
    return {"ticketId": ticket_id, "action": "approved", "status": "ok"}


def reject_ticket(ticket_id: str) -> dict:
    override = get_ticket_override(ticket_id) or {}
    override.update({"status": "Failed", "agentStatus": "Failed"})
    save_ticket_override(ticket_id, override)
    return {"ticketId": ticket_id, "action": "rejected", "status": "ok"}


def create_pr(ticket_id: str) -> dict:
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise ValueError(f"Ticket {ticket_id} not found")

    git = get_git_client()
    files = [f.get("path", f.get("file", "")) for f in ticket.get("impactedFiles", ticket.get("codeChanges", []))]
    pr = git.create_pull_request(
        ticket_id=ticket_id,
        title=f"[{ticket_id}] {ticket.get('summary', 'Agent fix')}",
        branch=f"fix/{ticket_id.lower()}",
        files_changed=files,
    )

    override = get_ticket_override(ticket_id) or {}
    pr_ref = f"#{pr['number']}"
    override.update({
        "pr": pr_ref,
        "prUrl": pr["url"],
        "agentStatus": "Awaiting Review",
        "status": "In Review",
    })
    save_ticket_override(ticket_id, override)
    return {"ticketId": ticket_id, "action": "create_pr", "status": "ok", "pr": pr_ref, "url": pr["url"]}


def _advance_deployment(deployments: list, stage: str) -> list:
    updated = []
    for dep in deployments:
        d = dict(dep)
        if d.get("stage") == stage:
            d["status"] = "completed"
            d["approvedBy"] = "Human Reviewer"
            d["timestamp"] = utc_now()
        updated.append(d)
    return updated
