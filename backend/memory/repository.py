"""In-memory MemoryRepository — always tenant-scoped."""

from __future__ import annotations

from memory.models import MemoryRecord


class MemoryRepository:
    def __init__(self):
        self._rows: list[MemoryRecord] = []

    def add(self, record: MemoryRecord) -> MemoryRecord:
        if not record.tenant_id:
            raise ValueError("tenant_id required on memory records")
        self._rows.append(record)
        return record

    def query(self, tenant_id: str, *, category: str | None = None, text: str | None = None) -> list[MemoryRecord]:
        """ALWAYS filter by tenant_id first — no unscoped queries."""
        if not tenant_id:
            raise ValueError("tenant_id required for memory query")
        results = [r for r in self._rows if r.tenant_id == tenant_id]
        if category:
            results = [r for r in results if r.category == category]
        if text:
            q = text.lower()
            results = [r for r in results if q in r.content.lower()]
        return results
