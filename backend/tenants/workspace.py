"""Assemble tenant workspace: skills, rules, lineage, production reports."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from rules.registry import load_rules
from skills.registry import SkillRegistry
from tenants.loader import FileSystemTenantConfigRepository
from tenants.secrets import secrets_status, tenant_data_root, tenant_dir


def _read_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return data if isinstance(data, dict) else {}


def build_workspace(tenant_id: str) -> dict[str, Any]:
    root = tenant_data_root()
    tdir = tenant_dir(tenant_id)
    repo = FileSystemTenantConfigRepository(root)
    config = repo.get(tenant_id)
    if config is None:
        return {"tenantId": tenant_id, "found": False}

    standard = Path(__file__).resolve().parent.parent / "skills" / "standard"
    registry = SkillRegistry(standard, tdir / "skills")
    skills = [
        {
            "id": sid,
            "name": (registry.resolve(sid).name if registry.resolve(sid) else sid),
            "source": (registry.resolve(sid).source if registry.resolve(sid) else "unknown"),
            "description": (registry.resolve(sid).description if registry.resolve(sid) else ""),
        }
        for sid in registry.list_ids()
    ]
    rules = [
        {
            "id": r.id,
            "name": r.name,
            "requireHumanApproval": r.action.require_human_approval,
            "guidanceFile": r.guidance_file,
        }
        for r in load_rules(tdir / "rules")
    ]
    lineage = _read_yaml(tdir / "lineage" / "catalog.yaml")
    reports = _read_yaml(tdir / "reports" / "production.yaml")
    cost_control = _read_yaml(tdir / "cost-control" / "overview.yaml")
    return {
        "tenantId": tenant_id,
        "found": True,
        "name": config.name,
        "storage": config.storage.model_dump(),
        "workflow": config.workflow.model_dump(),
        "git": config.git.model_dump(),
        "cloud": {
            "provider": config.cloud.provider,
            "region": config.cloud.region,
            "environments": config.cloud.environments,
        },
        "skills": skills,
        "rules": rules,
        "lineage": lineage,
        "productionReports": reports,
        "costControl": cost_control,
        "secretsConfigured": secrets_status(tenant_id),
    }
