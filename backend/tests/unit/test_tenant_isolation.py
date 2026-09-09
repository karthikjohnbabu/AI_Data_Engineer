"""Tenant isolation: secrets, workspace, one-stage runs."""

import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent))

os.environ["NEWTON_DEPLOYMENT_MODE"] = "multi_tenant"
os.environ["NEWTON_TENANT_ID"] = ""
os.environ["NEWTON_DEFAULT_TENANT_ID"] = "newton"
os.environ["TENANT_DATA_DIR"] = str(ROOT.parent / "tenant_data")

from config.settings import get_settings

get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _reset():
    get_settings.cache_clear()
    from tenants.registry import reset_tenant_registry

    reset_tenant_registry()
    yield
    get_settings.cache_clear()
    reset_tenant_registry()


def test_betfred_tenant_is_registered():
    from tenants.loader import FileSystemTenantConfigRepository

    repo = FileSystemTenantConfigRepository(ROOT.parent / "tenant_data")
    assert "betfred" in repo.list_tenant_ids()
    cfg = repo.get("betfred")
    assert cfg is not None
    assert cfg.storage.backend == "filesystem"
    assert cfg.git.repository.endswith("transactional-data-jobs")


def test_workspace_lists_tenant_skills_not_warehouse_dumps():
    from tenants.workspace import build_workspace

    ws = build_workspace("betfred")
    assert ws["found"] is True
    skill_ids = {s["id"] for s in ws["skills"]}
    assert "dimension-triage" in skill_ids
    assert "lineage" in ws
    assert len(ws["lineage"].get("nodes") or []) >= 1


def test_betfred_fixes_catalog_and_artefacts():
    from tenants.fixes import client_dashboard, list_fixes, read_artefact
    from tenants.workspace import build_workspace

    fixes = list_fixes("betfred")
    assert len(fixes) >= 5
    assert any(f.get("jira") == "DE-9556" for f in fixes)
    dash = client_dashboard("betfred", build_workspace("betfred"))
    assert dash["metrics"]["ticketsTotal"] == len(fixes)
    artefact = read_artefact(
        "betfred", "de_9654_cash_balance_historic", "proposed_solution_2.html"
    )
    assert artefact is not None
    assert artefact["kind"] == "html"
    assert len(artefact["content"]) > 100


def test_admin_overview_includes_client_paths():
    from tenants.fixes import list_fixes
    from tenants.registry import get_tenant_registry, reset_tenant_registry
    from tenants.workspace import build_workspace

    reset_tenant_registry()
    registry = get_tenant_registry()
    rows = []
    for tid, cfg in registry.all().items():
        ws = build_workspace(tid)
        fixes = list_fixes(tid)
        rows.append(
            {
                "tenantId": tid,
                "name": cfg.name,
                "fixes": len(fixes),
                "clientPath": f"/tenants/{tid}",
                "skills": len(ws.get("skills") or []),
            }
        )
    ids = {t["tenantId"] for t in rows}
    assert "betfred" in ids
    assert "busybees" in ids
    betfred = next(t for t in rows if t["tenantId"] == "betfred")
    assert betfred["clientPath"] == "/tenants/betfred"
    assert betfred["fixes"] >= 1
    assert betfred["skills"] >= 1


def test_newton_workspace_has_platform_lineage():
    from tenants.workspace import build_workspace

    ws = build_workspace("newton")
    nodes = {n["id"] for n in ws["lineage"].get("nodes") or []}
    assert "api" in nodes


def test_execute_one_stage_is_tenant_scoped():
    from tenants.resolver import resolve_tenant
    from workflows.engine.executor import WorkflowExecutor

    tenant = resolve_tenant(header_tenant_id="betfred")
    result = WorkflowExecutor().execute_stage(
        tenant, "dev_to_prod", "triage", ticket_id="DE-0000"
    )
    assert result.tenant_id == "betfred"
    assert result.status == "completed"
    assert "triage" in result.stage_outputs


def test_secrets_do_not_cross_tenants(tmp_path, monkeypatch):
    from tenants.secrets import load_tenant_secrets, tenant_data_root

    monkeypatch.setenv("TENANT_DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    (tmp_path / "newton").mkdir()
    (tmp_path / "betfred").mkdir()
    (tmp_path / "newton" / "secrets.local.yaml").write_text(
        "aws:\n  accessKeyId: NEWTONKEY\n  secretAccessKey: n\n",
        encoding="utf-8",
    )
    (tmp_path / "betfred" / "secrets.local.yaml").write_text(
        "aws:\n  profile: prod\n",
        encoding="utf-8",
    )
    newton = load_tenant_secrets("newton")
    betfred = load_tenant_secrets("betfred")
    assert newton["aws"]["accessKeyId"] == "NEWTONKEY"
    assert "accessKeyId" not in betfred["aws"]
    assert betfred["aws"]["profile"] == "prod"
    assert tenant_data_root() == tmp_path
