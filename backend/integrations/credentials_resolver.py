"""Resolve integration credentials from DB storage and environment variables."""

from database.platform_repository import get_credentials
from security.crypto import decrypt_credential_data


def get_service_credentials(service: str) -> dict:
    """Return decrypted credentials for a service (DB first, then env fallback)."""
    stored = get_credentials(service)
    if stored:
        return decrypt_credential_data(stored)
    return _env_fallback(service)


def _env_fallback(service: str) -> dict:
    from config.settings import get_settings

    settings = get_settings()
    if service == "jira":
        return {
            "url": settings.jira_url,
            "email": settings.jira_email,
            "apiToken": settings.jira_api_token,
            "projectKey": settings.jira_project_key,
        }
    if service == "bitbucket":
        return {
            "workspace": settings.bitbucket_workspace,
            "repo": settings.bitbucket_repo,
            "appPassword": settings.bitbucket_app_password,
        }
    if service == "github":
        return {
            "token": settings.github_token,
            "repo": settings.github_repo,
        }
    if service == "aws":
        return {
            "accessKeyId": settings.aws_access_key_id,
            "secretAccessKey": settings.aws_secret_access_key,
            "region": settings.aws_region,
        }
    if service == "slack":
        return {"webhookUrl": settings.slack_webhook_url, "botToken": settings.slack_bot_token}
    if service == "teams":
        return {
            "webhookUrl": settings.teams_webhook_url,
            "powerAutomateUrl": settings.teams_power_automate_url,
        }
    return {}


def credentials_configured(service: str) -> bool:
    creds = get_service_credentials(service)
    if service == "jira":
        return bool(creds.get("url") and creds.get("email") and creds.get("apiToken"))
    if service == "github":
        return bool(creds.get("token") and creds.get("repo"))
    if service == "bitbucket":
        return bool(creds.get("workspace") and creds.get("repo") and creds.get("appPassword"))
    if service == "aws":
        return bool(creds.get("accessKeyId") and creds.get("secretAccessKey"))
    if service == "slack":
        return bool(creds.get("webhookUrl") or creds.get("botToken"))
    if service == "teams":
        return bool(creds.get("webhookUrl") or creds.get("powerAutomateUrl"))
    return bool(creds)
