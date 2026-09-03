"""Pull request domain model."""

from pydantic import BaseModel


class PullRequest(BaseModel):
    id: str
    ticket_id: str
    title: str
    status: str = "open"
