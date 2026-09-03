"""Simple workflow state machine over configured stages."""

from workflows.engine.transitions import next_enabled_stages


class WorkflowStateMachine:
    def __init__(self, stages: list[dict]):
        self.stages = stages
        self.index = -1

    def start(self) -> dict | None:
        self.index = next_enabled_stages(self.stages, -1)
        if self.index is None:
            return None
        return self.stages[self.index]

    def advance(self) -> dict | None:
        nxt = next_enabled_stages(self.stages, self.index)
        if nxt is None:
            self.index = len(self.stages)
            return None
        self.index = nxt
        return self.stages[self.index]

    @property
    def current(self) -> dict | None:
        if 0 <= self.index < len(self.stages):
            return self.stages[self.index]
        return None

    @property
    def completed(self) -> bool:
        return self.index >= len(self.stages) or (
            self.index == -1 and not any(s.get("enabled", True) for s in self.stages)
        )
