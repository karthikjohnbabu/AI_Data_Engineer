"""Approval domain model."""

from pydantic import BaseModel


class Approval(BaseModel):
    id: str
    ticket_id: str | None = None
    action: str
    status: str = "pending"
