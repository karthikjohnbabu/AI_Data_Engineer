"""Agent service — entry point for running agents."""

from agents.orchestrator.orchestrator import run_ticket_pipeline
from data.loader import load_json
from models.agent_run import AgentRunResult, utc_now
from services.run_store import get_run, get_ticket_override, list_runs, save_ticket_override


def _find_ticket_summary(ticket_id: str) -> str | None:
    tickets = load_json("tickets.json")
    for ticket in tickets:
        if ticket["id"] == ticket_id:
            return ticket["summary"]
    return None


def run_agent(ticket_id: str) -> AgentRunResult:
    summary = _find_ticket_summary(ticket_id)
    if not summary:
        raise ValueError(f"Ticket {ticket_id} not found")
    return run_ticket_pipeline(ticket_id, summary)


def get_agent_run(ticket_id: str) -> AgentRunResult | None:
    return get_run(ticket_id)


def get_all_runs() -> list[AgentRunResult]:
    return list_runs()


def merge_ticket_with_run(ticket: dict) -> dict:
    override = get_ticket_override(ticket["id"])
    if not override:
        return ticket
    return {**ticket, **override}


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
    override = get_ticket_override(ticket_id) or {}
    pr_number = override.get("pr") or f"#{hash(ticket_id) % 900 + 100}"
    override.update({"pr": pr_number, "agentStatus": "Awaiting Review", "status": "In Review"})
    save_ticket_override(ticket_id, override)
    return {"ticketId": ticket_id, "action": "create_pr", "status": "ok", "pr": pr_number}


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
