"""Dashboard API routes."""

from fastapi import APIRouter

from data.loader import load_json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def get_metrics():
    data = load_json("dashboard.json")
    return data["metrics"]


@router.get("/activity")
async def get_activity():
    data = load_json("dashboard.json")
    return data["activity"]


@router.get("/resolution")
async def get_resolution():
    data = load_json("dashboard.json")
    return data["resolution"]
