"""Agent service — entry point for running agents."""

from agents.orchestrator.orchestrator import run_ticket_pipeline
from data.loader import load_json
from models.agent_run import AgentRunResult
from services.run_store import get_run, get_ticket_override


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


def merge_ticket_with_run(ticket: dict) -> dict:
    """Merge static ticket data with agent run overrides."""
    override = get_ticket_override(ticket["id"])
    if not override:
        return ticket
    return {**ticket, **override}
