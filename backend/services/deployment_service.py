"""Deployment service."""

from agents.deployment.agent import run_dev_deployment, run_prod_deployment, run_uat_deployment


def deploy(ticket_id: str, environment: str, approved: bool = False) -> dict:
    env = environment.lower()
    if env == "dev":
        return run_dev_deployment(ticket_id)
    if env == "uat":
        return run_uat_deployment(ticket_id, approved)
    if env == "prod":
        return run_prod_deployment(ticket_id, approved)
    return {"status": "unknown_environment", "environment": environment}
