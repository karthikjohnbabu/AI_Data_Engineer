"""Agent run models."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TimelineStep(BaseModel):
    id: str
    label: str
    status: str
    timestamp: str | None = None
    description: str | None = None


class AgentRunResult(BaseModel):
    ticket_id: str
    status: RunStatus
    classification: str
    severity: str
    root_cause: str
    confidence: int
    impacted_files: list[dict[str, Any]] = Field(default_factory=list)
    timeline: list[TimelineStep] = Field(default_factory=list)
    summary: str = ""
    completed_at: str | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
