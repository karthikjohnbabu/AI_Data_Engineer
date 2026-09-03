"""Ticket response schemas."""

from pydantic import BaseModel


class TicketResponse(BaseModel):
    id: str
    summary: str
    status: str
