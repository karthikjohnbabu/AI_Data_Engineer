"""Deployment domain model."""

from pydantic import BaseModel


class Deployment(BaseModel):
    id: str
    ticket_id: str
    environment: str
    status: str
