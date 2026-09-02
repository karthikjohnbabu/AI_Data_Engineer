"""Notification integration routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from integrations.slack.client import get_slack_notifier
from integrations.teams.client import get_teams_notifier

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SlackTagBody(BaseModel):
    user: str
    message: str
    ticketId: str | None = None


class TeamsApprovalBody(BaseModel):
    ticketId: str
    action: str


@router.post("/slack/tag")
async def slack_tag(body: SlackTagBody):
    return get_slack_notifier().handle_tag(body.user, body.message, body.ticketId)


@router.post("/teams/approval")
async def teams_approval(body: TeamsApprovalBody):
    return get_teams_notifier().request_approval(body.ticketId, body.action)
