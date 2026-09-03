"""FastAPI auth dependencies."""

from fastapi import Header, HTTPException
from config.settings import get_settings


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if settings.auth_enabled and x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
