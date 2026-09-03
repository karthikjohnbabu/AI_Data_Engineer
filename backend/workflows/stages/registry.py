"""Map stage types to handlers (Phase 1 stubs + aliases)."""

from workflows.stages.approval import ApprovalStage
from workflows.stages.base import NoopStage, StageHandler
from workflows.stages.code import CodeStage
from workflows.stages.create_branch import CreateBranchStage
from workflows.stages.create_pr import CreatePrStage
from workflows.stages.deploy import DeployStage
from workflows.stages.investigate import InvestigateStage
from workflows.stages.merge import MergeStage
from workflows.stages.notify import NotifyStage
from workflows.stages.plan import PlanStage
from workflows.stages.review_pr import ReviewPrStage
from workflows.stages.rollback import RollbackStage
from workflows.stages.test import TestStage
from workflows.stages.triage import TriageStage
from workflows.stages.update_memory import UpdateMemoryStage
from workflows.stages.update_ticket import UpdateTicketStage
from workflows.stages.validate import ValidateStage

_DEFAULT = NoopStage()
_REGISTRY: dict[str, StageHandler] = {
    "triage": TriageStage(),
    "investigate": InvestigateStage(),
    "plan": PlanStage(),
    "code": CodeStage(),
    "test": TestStage(),
    "validate": ValidateStage(),
    "create_branch": CreateBranchStage(),
    "create_pr": CreatePrStage(),
    "review_pr": ReviewPrStage(),
    "approval": ApprovalStage(),
    "human_approval": ApprovalStage(),
    "merge": MergeStage(),
    "deploy": DeployStage(),
    "rollback": RollbackStage(),
    "notify": NotifyStage(),
    "update_ticket": UpdateTicketStage(),
    "update_memory": UpdateMemoryStage(),
}


def register_stage(stage_type: str, handler: StageHandler) -> None:
    _REGISTRY[stage_type] = handler


def get_stage_handler(stage_type: str) -> StageHandler:
    return _REGISTRY.get(stage_type, _DEFAULT)
