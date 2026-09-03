"""Planner agent — impact analysis and execution plan."""

from agents.planner.execution_plan import build_execution_plan
from agents.planner.impact_analysis import analyse_impact


def run_planner(ticket_id: str, classification_id: str, summary: str, impacted_files: list) -> dict:
    impact = analyse_impact(classification_id, impacted_files)
    plan = build_execution_plan(ticket_id, classification_id, impact)
    return {"impact": impact, "plan": plan, "summary": summary}
