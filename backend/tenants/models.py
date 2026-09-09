"""Tenant configuration models."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class BranchStrategy(BaseModel):
    feature_prefix: str = "feature/"
    development_branch: str = "dev"
    production_branch: str = "main"
    deploy_from_feature: bool = True
    require_pr_for_prod: bool = True
    merge_target: str = "main"


class GitConfig(BaseModel):
    provider: str = "mock"
    repository: str = ""
    branch_strategy: BranchStrategy = Field(default_factory=BranchStrategy)


class CloudConfig(BaseModel):
    provider: str = "aws"
    region: str = "eu-west-2"
    environments: list[str] = Field(default_factory=lambda: ["dev", "uat", "prod"])
    credentials_secret: str = ""


class WorkflowConfig(BaseModel):
    default_template: str = "dev_to_prod"
    templates_dir: str = "workflows"


class SkillConfig(BaseModel):
    include_standard: bool = True
    allow_overrides: bool = True


class RuleConfig(BaseModel):
    enforce_prod_destructive_guard: bool = True


class MemoryConfig(BaseModel):
    backend: str = "sqlite"
    index_name: str = ""


class StorageConfig(BaseModel):
    backend: str = "filesystem"  # filesystem now; mysql later
    mysql_database: str = ""
    mysql_table_prefix: str = ""


class SecurityConfig(BaseModel):
    require_human_approval_for: list[str] = Field(
        default_factory=lambda: ["prod_deploy", "destructive_sql", "iam_change"]
    )


class NotificationConfig(BaseModel):
    channels: list[str] = Field(default_factory=lambda: ["in_app"])
    slack_enabled: bool = False
    teams_enabled: bool = False


class TenantConfig(BaseModel):
    tenant_id: str
    name: str
    deployment_mode: Literal["multi_tenant", "single_tenant"] = "multi_tenant"
    git: GitConfig = Field(default_factory=GitConfig)
    cloud: CloudConfig = Field(default_factory=CloudConfig)
    workflow: WorkflowConfig = Field(default_factory=WorkflowConfig)
    skills: SkillConfig = Field(default_factory=SkillConfig)
    rules: RuleConfig = Field(default_factory=RuleConfig)
    memory: MemoryConfig = Field(default_factory=MemoryConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    notifications: NotificationConfig = Field(default_factory=NotificationConfig)
    extras: dict[str, Any] = Field(default_factory=dict)
