"""FastAPI application entry point."""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import dashboard, deployments, integrations, memory, reports, runs, skills, tickets
from database.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AI Data Engineer — Agent API",
    description="REST API for the AI Data Engineering Agent platform",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(tickets.router, prefix="/api")
app.include_router(runs.router, prefix="/api")
app.include_router(deployments.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(integrations.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(memory.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.2.0"}
