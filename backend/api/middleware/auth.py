"""Optional API key authentication middleware."""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config.settings import get_settings

PUBLIC_PATHS = {"/api/health", "/api/auth/verify", "/docs", "/openapi.json", "/redoc"}


class APIKeyMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    settings = get_settings()
    if not settings.auth_enabled:
      return await call_next(request)

    path = request.url.path
    if path in PUBLIC_PATHS or not path.startswith("/api"):
      return await call_next(request)

    api_key = request.headers.get("X-API-Key", "")
    if api_key != settings.api_key:
      return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})

    return await call_next(request)
