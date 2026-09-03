from uuid import uuid4

from memory.models import MemoryRecord
from memory.repository import MemoryRepository
from models.agent_run import utc_now


class MemoryService:
    def __init__(self, repo: MemoryRepository | None = None):
        self.repo = repo or MemoryRepository()

    def remember(self, tenant_id: str, content: str, category: str = "general", **kwargs) -> MemoryRecord:
        return self.repo.add(
            MemoryRecord(
                id=str(uuid4())[:8],
                tenant_id=tenant_id,
                content=content,
                category=category,
                created_at=utc_now(),
                **kwargs,
            )
        )

    def search(self, tenant_id: str, query: str) -> list[MemoryRecord]:
        return self.repo.query(tenant_id, text=query)
