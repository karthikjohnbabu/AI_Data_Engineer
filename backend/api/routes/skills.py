"""Skills API routes."""

from fastapi import APIRouter

from data.loader import load_json

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("")
async def list_skills():
    return load_json("skills.json")
