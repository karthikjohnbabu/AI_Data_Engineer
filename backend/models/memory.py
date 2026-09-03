"""Memory domain model."""

from pydantic import BaseModel


class MemoryItem(BaseModel):
    id: str
    title: str
    category: str
    content: str
