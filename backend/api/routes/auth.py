"""Authentication routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from config.settings import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


class VerifyRequest(BaseModel):
  apiKey: str


@router.post("/verify")
async def verify_api_key(body: VerifyRequest):
  settings = get_settings()
  if not settings.auth_enabled:
    return {"valid": True, "authRequired": False}
  return {
    "valid": body.apiKey == settings.api_key,
    "authRequired": True,
  }


@router.get("/status")
async def auth_status():
  settings = get_settings()
  return {"authRequired": settings.auth_enabled}
