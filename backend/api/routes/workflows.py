"""Pipeline / agent workflow listing (distinct from NL workflow builder)."""

from fastapi import APIRouter

router = APIRouter(tags=["pipeline"])

PIPELINE_WORKFLOWS = [
    {"id": "ticket_triage", "name": "Ticket Triage", "path": "workflows/ticket_triage"},
    {"id": "jira_to_pr", "name": "Jira to PR", "path": "workflows/jira_to_pr"},
    {"id": "incident_resolution", "name": "Incident Resolution", "path": "workflows/incident_resolution"},
    {"id": "pr_review", "name": "PR Review", "path": "workflows/pr_review"},
    {"id": "dev_deployment", "name": "DEV Deployment", "path": "workflows/dev_deployment"},
    {"id": "uat_deployment", "name": "UAT Deployment", "path": "workflows/uat_deployment"},
    {"id": "prod_deployment", "name": "PROD Deployment", "path": "workflows/prod_deployment"},
    {"id": "full_ticket_resolution", "name": "Full Ticket Resolution", "path": "workflows/full_ticket_resolution"},
]


@router.get("/pipeline/workflows")
async def list_pipeline_workflows():
    return PIPELINE_WORKFLOWS
