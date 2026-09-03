from typing import Any

from pydantic import BaseModel, Field


class RuleAction(BaseModel):
    require_human_approval: bool = False
    block: bool = False
    message: str = ""


class Rule(BaseModel):
    id: str
    name: str
    scope: dict[str, Any] = Field(default_factory=dict)
    conditions: dict[str, Any] = Field(default_factory=dict)
    action: RuleAction = Field(default_factory=RuleAction)
