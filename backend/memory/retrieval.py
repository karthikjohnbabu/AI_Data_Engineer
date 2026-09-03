from memory.repository import MemoryRepository


def retrieve(repo: MemoryRepository, tenant_id: str, query: str) -> list:
    return repo.query(tenant_id, text=query)
