"""Tickets API routes."""

from fastapi import APIRouter, HTTPException

from data.loader import load_json
from models.agent_run import AgentRunResult
from services.agent_service import get_agent_run, merge_ticket_with_run, run_agent

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _get_ticket_details() -> dict:
    return load_json("ticket_details.json")


def _build_detail(ticket: dict) -> dict:
    details = _get_ticket_details()
    if ticket["id"] in details:
        base = details[ticket["id"]]
    else:
        base = {
            **ticket,
            "description": ticket["summary"],
            "rootCause": "Analysis in progress...",
            "impact": {"level": "Medium", "filesAffected": 0, "tablesAffected": 0, "blastRadius": "Low"},
            "timeline": [],
            "impactedFiles": [],
            "codeChanges": [],
            "testResults": [],
            "dataValidation": [],
            "deployments": [],
        }
    return merge_ticket_with_run(base)


@router.get("")
async def list_tickets():
    tickets = load_json("tickets.json")
    return [merge_ticket_with_run(t) for t in tickets]


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str):
    tickets = load_json("tickets.json")
    for ticket in tickets:
        if ticket["id"] == ticket_id:
            return _build_detail(ticket)
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.get("/{ticket_id}/run")
async def get_ticket_run(ticket_id: str) -> AgentRunResult:
    run = get_agent_run(ticket_id)
    if not run:
        raise HTTPException(status_code=404, detail="No agent run found for this ticket")
    return run


@router.post("/{ticket_id}/approve")
async def approve_ticket(ticket_id: str):
    return {"ticketId": ticket_id, "action": "approved", "status": "ok"}


@router.post("/{ticket_id}/reject")
async def reject_ticket(ticket_id: str):
    return {"ticketId": ticket_id, "action": "rejected", "status": "ok"}


@router.post("/{ticket_id}/run-again")
async def run_again(ticket_id: str):
    try:
        result = run_agent(ticket_id)
        return {"ticketId": ticket_id, "action": "run_again", "status": "completed", "run": result}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{ticket_id}/create-pr")
async def create_pr(ticket_id: str):
    return {"ticketId": ticket_id, "action": "create_pr", "status": "queued"}
