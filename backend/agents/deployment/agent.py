"""Deployment agent facade across DEV / UAT / PROD."""

from agents.deployment.dev import deploy_dev
from agents.deployment.prod import deploy_prod
from agents.deployment.rollback import rollback
from agents.deployment.uat import deploy_uat


def run_dev_deployment(ticket_id: str) -> dict:
    return deploy_dev(ticket_id)


def run_uat_deployment(ticket_id: str, approved: bool) -> dict:
    return deploy_uat(ticket_id, approved)


def run_prod_deployment(ticket_id: str, approved: bool) -> dict:
    return deploy_prod(ticket_id, approved)


def run_rollback(ticket_id: str, environment: str) -> dict:
    return rollback(ticket_id, environment)
