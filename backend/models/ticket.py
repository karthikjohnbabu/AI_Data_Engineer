"""Ticket domain model."""

from pydantic import BaseModel


class Ticket(BaseModel):
    id: str
    summary: str
    status: str = "Open"
    priority: str = "Medium"
