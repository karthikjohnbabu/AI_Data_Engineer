"""Skills API routes."""

from fastapi import APIRouter

from data.loader import load_json
from database.platform_repository import list_learned_skills

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("")
async def list_skills():
    base = load_json("skills.json")
    learned = list_learned_skills()
    existing_ids = {s["id"] for s in base}
    for skill in learned:
        if skill["id"] not in existing_ids:
            base.append(skill)
    return base
