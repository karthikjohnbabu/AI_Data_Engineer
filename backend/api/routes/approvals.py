"""Approvals API routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from approvals.engine import decide, list_approvals, request_approval

router = APIRouter(tags=["approvals"])


class ApprovalRequest(BaseModel):
    ticketId: str
    action: str
    message: str


class ApprovalDecision(BaseModel):
    approved: bool


@router.get("/approvals")
async def get_approvals():
    return list_approvals()


@router.post("/approvals")
async def create_approval(body: ApprovalRequest):
    return request_approval(body.ticketId, body.action, body.message)


@router.post("/approvals/{action_id}/decide")
async def decide_approval(action_id: str, body: ApprovalDecision):
    return decide(action_id, body.approved)
