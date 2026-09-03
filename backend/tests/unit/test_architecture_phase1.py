"""Phase 1 architecture tests — tenants, workflows, isolation, providers."""

import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent))

# Ensure tenant_data path + multi-tenant defaults for tests
os.environ["NEWTON_DEPLOYMENT_MODE"] = "multi_tenant"
os.environ["NEWTON_TENANT_ID"] = ""
os.environ["NEWTON_DEFAULT_TENANT_ID"] = "newton"
os.environ["TENANT_DATA_DIR"] = str(ROOT.parent / "tenant_data")

from config.settings import get_settings

get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _reset_settings():
    get_settings.cache_clear()
    from tenants.registry import reset_tenant_registry
    from observability.events.emitter import clear_events

    reset_tenant_registry()
    clear_events()
    yield
    get_settings.cache_clear()
    reset_tenant_registry()
    clear_events()


def test_tenant_loader_lists_tenants():
    from tenants.loader import FileSystemTenantConfigRepository

    repo = FileSystemTenantConfigRepository(ROOT.parent / "tenant_data")
    ids = repo.list_tenant_ids()
    assert "newton" in ids
    assert "example_customer" in ids
    assert "busybees" in ids
    cfg = repo.get("busybees")
    assert cfg is not None
    assert cfg.git.branch_strategy.development_branch == "dev"


def test_multi_tenant_resolution_from_header():
    from tenants.resolver import resolve_tenant

    ctx = resolve_tenant(header_tenant_id="example_customer")
    assert ctx.tenant_id == "example_customer"
    assert ctx.config.workflow.default_template == "feature_to_prod"


def test_single_tenant_rejects_foreign_id(monkeypatch):
    monkeypatch.setenv("NEWTON_DEPLOYMENT_MODE", "single_tenant")
    monkeypatch.setenv("NEWTON_TENANT_ID", "busybees")
    get_settings.cache_clear()
    from tenants.registry import reset_tenant_registry
    from tenants.resolver import resolve_tenant
    from tenants.validation import TenantValidationError

    reset_tenant_registry()
    with pytest.raises(TenantValidationError):
        resolve_tenant(header_tenant_id="example_customer")
    ctx = resolve_tenant(header_tenant_id="busybees")
    assert ctx.tenant_id == "busybees"


def test_workflow_stage_ordering_and_disabled():
    from workflows.engine.executor import WorkflowExecutor
    from workflows.engine.state_machine import WorkflowStateMachine

    ex = WorkflowExecutor()
    template = {
        "name": "custom",
        "stages": [
            "triage",
            {"id": "skip_me", "type": "test", "enabled": False},
            "code",
        ],
    }
    stages = ex.ordered_stages(template)
    sm = WorkflowStateMachine(stages)
    assert sm.start()["type"] == "triage"
    assert sm.advance()["type"] == "code"
    assert sm.advance() is None


def test_workflow_execute_propagates_tenant():
    from tenants.resolver import resolve_tenant
    from workflows.engine.executor import WorkflowExecutor
    from observability.events.emitter import get_events

    tenant = resolve_tenant(header_tenant_id="newton")
    result = WorkflowExecutor().execute(tenant, "feature_to_prod", ticket_id="T-1")
    assert result.tenant_id == "newton"
    assert result.status == "completed"
    assert "triage" in result.stage_outputs
    events = get_events(tenant_id="newton")
    assert any(e["name"] == "workflow.started" for e in events)
    assert all(e["tenant_id"] == "newton" for e in events)


def test_provider_resolution_is_tenant_scoped():
    from providers.git.factory import get_git_provider
    from tenants.resolver import resolve_tenant

    a = resolve_tenant(header_tenant_id="newton")
    b = resolve_tenant(header_tenant_id="example_customer")
    ga = get_git_provider(a)
    gb = get_git_provider(b)
    assert ga.create_branch("feature/x")["tenant_id"] == "newton"
    assert gb.create_branch("feature/y")["tenant_id"] == "example_customer"


def test_skill_tenant_override():
    from pathlib import Path
    from skills.registry import SkillRegistry

    standard = ROOT / "skills" / "standard"
    tenant = ROOT.parent / "tenant_data" / "example_customer" / "skills"
    reg = SkillRegistry(standard, tenant)
    skill = reg.resolve("aws-glue-debugging")
    assert skill is not None
    assert skill.source == "override"
    assert "customer_specific_checklist" in skill.capabilities


def test_memory_tenant_isolation():
    from memory.service import MemoryService

    svc = MemoryService()
    svc.remember("tenant_a", "production database = A", category="architecture")
    svc.remember("tenant_b", "production database = B", category="architecture")

    a = svc.search("tenant_a", "production database")
    b = svc.search("tenant_b", "production database")
    assert len(a) == 1
    assert a[0].content == "production database = A"
    assert all("B" not in r.content for r in a)
    assert b[0].content == "production database = B"


def test_approval_policy_evaluation():
    from approvals.policy_eval import evaluate_approval

    low = evaluate_approval("LOW")
    high = evaluate_approval("HIGH")
    critical = evaluate_approval("CRITICAL")
    assert low.get("auto_execute") is True
    assert high.get("require_human_approval") is True
    assert critical.get("require_secondary_approval") is True


def test_branch_strategy_configuration():
    from tenants.resolver import resolve_tenant

    newton = resolve_tenant(header_tenant_id="newton")
    example = resolve_tenant(header_tenant_id="example_customer")
    assert newton.config.git.branch_strategy.development_branch == "dev"
    assert example.config.git.branch_strategy.development_branch == "develop"


def test_rule_engine_prod_destructive():
    from pathlib import Path
    from rules.engine import evaluate_rules
    from rules.registry import load_rules

    rules = load_rules(ROOT.parent / "tenant_data" / "newton" / "rules")
    action = evaluate_rules(rules, {"environment": "prod", "operations": ["drop"]})
    assert action.require_human_approval is True
    action_dev = evaluate_rules(rules, {"environment": "dev", "operations": ["drop"]})
    assert action_dev.require_human_approval is False


def test_config_validation_unknown_tenant():
    from tenants.resolver import resolve_tenant
    from tenants.validation import TenantValidationError

    with pytest.raises(TenantValidationError):
        resolve_tenant(header_tenant_id="does_not_exist")
