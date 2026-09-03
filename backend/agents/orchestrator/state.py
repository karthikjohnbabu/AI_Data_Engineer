"""Pipeline state machine for Newton ticket runs."""

from enum import Enum
from typing import Any


class PipelineStage(str, Enum):
    INTAKE = "intake"
    TRIAGE = "triage"
    INVESTIGATION = "investigation"
    PLANNER = "planner"
    CODING = "coding"
    FEATURE_BRANCH = "feature_branch"
    TESTS = "tests"
    DEV_DEPLOY = "dev_deploy"
    DEV_VALIDATION = "dev_validation"
    CREATE_PR = "create_pr"
    PR_REVIEW = "pr_review"
    HUMAN_APPROVAL = "human_approval"
    MERGE = "merge"
    PROD_DEPLOY = "prod_deploy"
    PROD_VALIDATION = "prod_validation"
    LEARN_CLOSE = "learn_close"


STAGE_ORDER = list(PipelineStage)


def next_stage(current: PipelineStage) -> PipelineStage | None:
    idx = STAGE_ORDER.index(current)
    if idx + 1 >= len(STAGE_ORDER):
        return None
    return STAGE_ORDER[idx + 1]


def initial_state(ticket_id: str) -> dict[str, Any]:
    return {
        "ticket_id": ticket_id,
        "stage": PipelineStage.INTAKE.value,
        "requires_human_approval": False,
        "context": {},
    }
