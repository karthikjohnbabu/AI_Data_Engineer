"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # API
    api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    # Integrations (mock | jira, mock | github | bitbucket)
    jira_mode: str = "mock"
    git_provider: str = "mock"

    # LLM (local | bedrock | openai | anthropic)
    llm_provider: str = "local"

    # Jira (used when jira_mode=jira)
    jira_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_key: str = "UKDATA"

    # GitHub (used when git_provider=github)
    github_token: str = ""
    github_repo: str = ""

    @property
    def auth_enabled(self) -> bool:
        return bool(self.api_key)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
