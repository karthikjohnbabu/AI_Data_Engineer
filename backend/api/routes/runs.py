"""Agent runs API routes."""

from fastapi import APIRouter, HTTPException

from models.agent_run import AgentRunResult
from services.agent_service import get_agent_run, get_all_runs

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("")
async def list_agent_runs() -> list[AgentRunResult]:
    return get_all_runs()


@router.get("/{ticket_id}")
async def get_run_detail(ticket_id: str) -> AgentRunResult:
    run = get_agent_run(ticket_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
