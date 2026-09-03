"""Ticket request schemas."""

from pydantic import BaseModel


class CreateTicketRequest(BaseModel):
    summary: str
    description: str = ""
