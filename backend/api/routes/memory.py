"""Memory API routes."""

from fastapi import APIRouter, Query

from data.loader import load_json

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("")
async def list_memory(category: str | None = Query(default=None)):
    items = load_json("memory.json")
    if category:
        return [item for item in items if item["category"] == category]
    return items
