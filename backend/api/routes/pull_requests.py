"""Pull request API routes."""

from fastapi import APIRouter
from services.run_store import list_runs

router = APIRouter(tags=["pull_requests"])


@router.get("/pull-requests")
async def list_pull_requests():
    runs = list_runs()
    prs = []
    for run in runs:
        prs.append({
            "id": f"pr-{run.ticket_id}",
            "ticketId": run.ticket_id,
            "title": f"fix: {run.classification}",
            "status": "open" if run.status.value != "failed" else "draft",
            "confidence": run.confidence,
            "severity": run.severity,
            "createdAt": run.completed_at,
        })
    return prs
