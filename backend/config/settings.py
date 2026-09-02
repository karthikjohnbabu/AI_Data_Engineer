"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # API
    api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    credentials_secret_key: str = ""

    # Integrations (mock | jira, mock | github | bitbucket)
    jira_mode: str = "mock"
    git_provider: str = "mock"

    # LLM (local | bedrock | openai)
    llm_provider: str = "local"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    bedrock_model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"

    # Jira (used when jira_mode=jira)
    jira_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_key: str = "UKDATA"

    # GitHub (used when git_provider=github)
    github_token: str = ""
    github_repo: str = ""

    # Bitbucket
    bitbucket_workspace: str = ""
    bitbucket_repo: str = ""
    bitbucket_app_password: str = ""

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "eu-west-2"

    # Notifications
    slack_webhook_url: str = ""
    slack_bot_token: str = ""
    teams_webhook_url: str = ""
    teams_power_automate_url: str = ""

    @property
    def auth_enabled(self) -> bool:
        return bool(self.api_key)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
