"""Settings API routes (alias surface)."""

from fastapi import APIRouter
from database.platform_repository import get_credentials_masked

router = APIRouter(tags=["settings"])


@router.get("/settings")
async def get_settings_summary():
    return {"credentials": get_credentials_masked()}
