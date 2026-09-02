"""Tickets API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data.loader import load_json
from models.agent_run import AgentRunResult
from services.agent_service import (
    approve_ticket,
    create_pr,
    get_agent_run,
    reject_ticket,
    run_agent,
)
from services.ticket_service import get_ticket, list_tickets, merge_ticket_with_run, submit_ticket

router = APIRouter(prefix="/tickets", tags=["tickets"])


class NewTicketRequest(BaseModel):
    summary: str
    priority: str = "Medium"


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
async def list_all_tickets():
    tickets = list_tickets()
    return [_build_detail(t) for t in tickets]


@router.post("")
async def create_ticket(body: NewTicketRequest):
    ticket = submit_ticket(body.summary, body.priority)
    result = run_agent(ticket["id"])
    return {"ticket": _build_detail(ticket), "run": result}


@router.get("/{ticket_id}")
async def get_ticket_detail(ticket_id: str):
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _build_detail(ticket)


@router.get("/{ticket_id}/run")
async def get_ticket_run(ticket_id: str) -> AgentRunResult:
    run = get_agent_run(ticket_id)
    if not run:
        raise HTTPException(status_code=404, detail="No agent run found for this ticket")
    return run


@router.post("/{ticket_id}/approve")
async def approve(ticket_id: str):
    return approve_ticket(ticket_id)


@router.post("/{ticket_id}/reject")
async def reject(ticket_id: str):
    return reject_ticket(ticket_id)


@router.post("/{ticket_id}/run-again")
async def run_again(ticket_id: str):
    try:
        result = run_agent(ticket_id)
        return {"ticketId": ticket_id, "action": "run_again", "status": "completed", "run": result}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{ticket_id}/create-pr")
async def create_pull_request(ticket_id: str):
    try:
        return create_pr(ticket_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
