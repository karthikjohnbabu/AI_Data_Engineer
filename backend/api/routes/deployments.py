"""Deployments API routes."""

from fastapi import APIRouter

from data.loader import load_json
from services.agent_service import merge_ticket_with_run
from services.run_store import list_deployments

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.get("")
async def list_all_deployments():
    db_deployments = list_deployments()

    if db_deployments:
        return db_deployments

    # Fallback: derive from ticket mock data
    tickets = load_json("tickets.json")
    deployments = []
    for ticket in tickets:
        merged = merge_ticket_with_run(ticket)
        for stage in merged.get("deployments", []):
            deployments.append({
                "id": f"dep-{merged['id']}-{stage['stage']}",
                "ticketId": merged["id"],
                "environment": stage["stage"],
                "status": stage["status"],
                "approvedBy": stage.get("approvedBy"),
                "timestamp": stage.get("timestamp"),
                "createdAt": merged.get("createdAt"),
            })
    return deployments
