"""Integrations API routes."""

from fastapi import APIRouter

router = APIRouter(prefix="/integrations", tags=["integrations"])

INTEGRATIONS = [
    {"id": "jira", "name": "Jira", "category": "Ticketing", "status": "not_configured", "description": "Read tickets, post comments, manage transitions"},
    {"id": "github", "name": "GitHub", "category": "Version Control", "status": "not_configured", "description": "Create pull requests, review code, merge branches"},
    {"id": "bitbucket", "name": "Bitbucket", "category": "Version Control", "status": "not_configured", "description": "Enterprise Git hosting for Betfred/BBees"},
    {"id": "aws", "name": "AWS", "category": "Cloud", "status": "not_configured", "description": "Glue, Redshift, S3, CloudWatch, Step Functions"},
    {"id": "databricks", "name": "Databricks", "category": "Platform", "status": "not_configured", "description": "Jobs, clusters, Unity Catalog, SQL warehouses"},
    {"id": "slack", "name": "Slack", "category": "Notifications", "status": "not_configured", "description": "Approval notifications and agent status updates"},
    {"id": "teams", "name": "Microsoft Teams", "category": "Notifications", "status": "not_configured", "description": "Adaptive cards for approvals and alerts"},
    {"id": "snowflake", "name": "Snowflake", "category": "Warehouse", "status": "not_configured", "description": "Query execution and warehouse management"},
]


@router.get("")
async def list_integrations():
    return INTEGRATIONS
