"""FastAPI application entry point."""

import sys
from pathlib import Path

# Allow imports from backend root when running uvicorn
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import dashboard, memory, skills, tickets

app = FastAPI(
    title="AI Data Engineer — Agent API",
    description="REST API for the AI Data Engineering Agent platform",
    version="0.1.0",
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
app.include_router(skills.router, prefix="/api")
app.include_router(memory.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
