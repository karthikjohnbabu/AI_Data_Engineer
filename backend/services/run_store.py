"""In-memory store for agent runs and enriched ticket state."""

from models.agent_run import AgentRunResult

_runs: dict[str, AgentRunResult] = {}
_ticket_overrides: dict[str, dict] = {}


def save_run(result: AgentRunResult) -> None:
    _runs[result.ticket_id] = result


def get_run(ticket_id: str) -> AgentRunResult | None:
    return _runs.get(ticket_id)


def save_ticket_override(ticket_id: str, data: dict) -> None:
    _ticket_overrides[ticket_id] = data


def get_ticket_override(ticket_id: str) -> dict | None:
    return _ticket_overrides.get(ticket_id)
