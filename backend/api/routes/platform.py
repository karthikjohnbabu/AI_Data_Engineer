"""Platform API routes — credentials, onboarding, tech stack, workflows, recommendations."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.platform_repository import (
    detect_tech_stack,
    dismiss_recommendation,
    generate_daily_recommendations,
    get_credentials_masked,
    get_project_config,
    list_domains,
    list_pending_actions,
    list_recommendations,
    list_workflows,
    resolve_pending_action,
    save_credentials,
    save_project_config,
    save_workflow_from_nl,
)

router = APIRouter(tags=["platform"])


class CredentialsBody(BaseModel):
    service: str
    data: dict


class OnboardingBody(BaseModel):
    domain: str
    projectType: str
    context: str = ""
    clientName: str = ""


class WorkflowNLBody(BaseModel):
    name: str
    description: str = ""
    phasesText: str


class ActionResolveBody(BaseModel):
    approved: bool


@router.get("/tech-stack")
async def tech_stack():
    return detect_tech_stack()


@router.get("/settings/credentials")
async def get_all_credentials():
    return get_credentials_masked()


@router.post("/settings/credentials")
async def save_service_credentials(body: CredentialsBody):
    return save_credentials(body.service, body.data)


@router.get("/onboarding")
async def get_onboarding():
    return get_project_config()


@router.post("/onboarding")
async def post_onboarding(body: OnboardingBody):
    return save_project_config({
        "domain": body.domain,
        "projectType": body.projectType,
        "context": body.context,
        "clientName": body.clientName,
        "onboarded": True,
    })


@router.get("/domains")
async def get_domains():
    return list_domains()


@router.get("/workflows")
async def get_workflows():
    return list_workflows()


@router.post("/workflows")
async def create_workflow(body: WorkflowNLBody):
    return save_workflow_from_nl(body.name, body.description, body.phasesText)


@router.get("/recommendations")
async def get_recommendations():
    return list_recommendations()


@router.post("/recommendations/generate")
async def generate_recommendations():
    return generate_daily_recommendations()


@router.post("/recommendations/{rec_id}/dismiss")
async def dismiss_rec(rec_id: str):
    dismiss_recommendation(rec_id)
    return {"id": rec_id, "dismissed": True}


@router.get("/notifications/pending")
async def get_pending():
    return list_pending_actions()


@router.post("/notifications/{action_id}/resolve")
async def resolve_action(action_id: str, body: ActionResolveBody):
    return resolve_pending_action(action_id, body.approved)
