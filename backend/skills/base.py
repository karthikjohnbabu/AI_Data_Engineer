"""Skill contract."""

from typing import Any, Protocol

from pydantic import BaseModel, Field


class SkillManifest(BaseModel):
    id: str
    name: str
    version: str = "0.1.0"
    triggers: dict[str, Any] = Field(default_factory=dict)
    capabilities: list[str] = Field(default_factory=list)
    risk: str = "low"
    handler: dict[str, str] = Field(default_factory=dict)
    source: str = "standard"  # standard | tenant | override


class SkillHandler(Protocol):
    def handle(self, context: dict) -> dict: ...
