from pydantic import BaseModel, Field


class MemoryRecord(BaseModel):
    id: str
    tenant_id: str
    source: str = "manual"
    category: str = "general"
    repository: str = ""
    environment: str = ""
    content: str
    created_at: str = ""
    confidence: float = 1.0
    permissions: list[str] = Field(default_factory=list)
