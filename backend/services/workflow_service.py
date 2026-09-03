"""Workflow orchestration service."""

from workflows.full_ticket_resolution.workflow import run as run_full


def start_workflow(workflow_id: str, ticket_id: str, context: dict | None = None) -> dict:
    if workflow_id == "full_ticket_resolution":
        return run_full(ticket_id, context)
    return {"workflowId": workflow_id, "ticketId": ticket_id, "status": "queued"}
