"""Resolve GitProvider from tenant config."""

from providers.git.mock import MockGitProvider
from tenants.context import TenantContext


def get_git_provider(tenant: TenantContext):
    provider = tenant.config.git.provider
    if provider in {"mock", "github", "bitbucket", "gitlab", "codecommit"}:
        # Phase 1: mock for all; real adapters wire later behind same interface
        return MockGitProvider(tenant.tenant_id, tenant.config.git.repository)
    return MockGitProvider(tenant.tenant_id, tenant.config.git.repository)
