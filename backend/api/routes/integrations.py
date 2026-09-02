"""Integrations API routes."""

from fastapi import APIRouter

from config.settings import get_settings

router = APIRouter(prefix="/integrations", tags=["integrations"])

INTEGRATIONS = [
    {"id": "jira", "name": "Jira", "category": "Ticketing"},
    {"id": "github", "name": "GitHub", "category": "Version Control"},
    {"id": "bitbucket", "name": "Bitbucket", "category": "Version Control"},
    {"id": "aws", "name": "AWS", "category": "Cloud"},
    {"id": "databricks", "name": "Databricks", "category": "Platform"},
    {"id": "slack", "name": "Slack", "category": "Notifications"},
    {"id": "teams", "name": "Microsoft Teams", "category": "Notifications"},
    {"id": "snowflake", "name": "Snowflake", "category": "Warehouse"},
]

DESCRIPTIONS = {
    "jira": "Read tickets, post comments, manage transitions",
    "github": "Create pull requests, review code, merge branches",
    "bitbucket": "Enterprise Git hosting for Betfred/BBees",
    "aws": "Glue, Redshift, S3, CloudWatch, Step Functions",
    "databricks": "Jobs, clusters, Unity Catalog, SQL warehouses",
    "slack": "Approval notifications and agent status updates",
    "teams": "Adaptive cards for approvals and alerts",
    "snowflake": "Query execution and warehouse management",
}


@router.get("")
async def list_integrations():
    settings = get_settings()
    result = []
    for item in INTEGRATIONS:
        status = "not_configured"
        if item["id"] == "jira" and settings.jira_mode == "mock":
            status = "mock"
        elif item["id"] in ("github", "bitbucket") and settings.git_provider == "mock":
            status = "mock"
        elif item["id"] == settings.git_provider:
            status = "connected" if settings.github_token else "not_configured"
        result.append({
            **item,
            "status": status,
            "description": DESCRIPTIONS.get(item["id"], ""),
        })
    return result
