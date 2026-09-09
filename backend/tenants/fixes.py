"""Load tenant fix packs from tenant_data/<tenant>/fixes."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml

from tenants.secrets import tenant_dir

SAFE_ARTEFACT = re.compile(r"^[A-Za-z0-9._-]+$")


def _catalog_path(tenant_id: str) -> Path:
    return tenant_dir(tenant_id) / "fixes" / "catalog.yaml"


def load_fixes_catalog(tenant_id: str) -> dict[str, Any]:
    path = _catalog_path(tenant_id)
    if not path.exists():
        return {"tenant_id": tenant_id, "fixes": [], "note": "No fixes catalog yet."}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        return {"tenant_id": tenant_id, "fixes": []}
    data.setdefault("tenant_id", tenant_id)
    data.setdefault("fixes", [])
    return data


def list_fixes(tenant_id: str) -> list[dict[str, Any]]:
    catalog = load_fixes_catalog(tenant_id)
    fixes = catalog.get("fixes") or []
    return [f for f in fixes if isinstance(f, dict)]


def get_fix(tenant_id: str, fix_id: str) -> dict[str, Any] | None:
    for item in list_fixes(tenant_id):
        if item.get("id") == fix_id:
            folder = tenant_dir(tenant_id) / "fixes" / fix_id
            artefacts = []
            if folder.exists():
                artefacts = sorted(p.name for p in folder.iterdir() if p.is_file())
            return {
                **item,
                "artefacts": artefacts or item.get("artefacts") or [],
            }
    return None


def read_artefact(tenant_id: str, fix_id: str, artefact: str) -> dict[str, Any] | None:
    if not SAFE_ARTEFACT.match(artefact):
        return None
    if ".." in artefact or "/" in artefact or "\\" in artefact:
        return None
    path = tenant_dir(tenant_id) / "fixes" / fix_id / artefact
    if not path.exists() or not path.is_file():
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    kind = "html" if artefact.endswith(".html") else "markdown"
    return {
        "tenantId": tenant_id,
        "fixId": fix_id,
        "artefact": artefact,
        "kind": kind,
        "content": text,
    }


def client_dashboard(tenant_id: str, workspace: dict[str, Any]) -> dict[str, Any]:
    fixes = list_fixes(tenant_id)
    done = [f for f in fixes if f.get("status") == "done"]
    in_progress = [f for f in fixes if f.get("status") == "in_progress"]
    lineage = workspace.get("lineage") or {}
    reports = workspace.get("productionReports") or {}
    return {
        "tenantId": tenant_id,
        "name": workspace.get("name") or tenant_id,
        "metrics": {
            "ticketsTotal": len(fixes),
            "ticketsDone": len(done),
            "ticketsInPipeline": len(in_progress),
            "skills": len(workspace.get("skills") or []),
            "rules": len(workspace.get("rules") or []),
            "lineageNodes": len(lineage.get("nodes") or []),
            "lineageEdges": len(lineage.get("edges") or []),
            "reportChecks": len(reports.get("checks") or []),
            "proposedSolutions": sum(
                1 for f in fixes if f.get("has_proposed_solution")
            ),
        },
        "pipeline": [
            {
                "stage": "done",
                "label": "Fixed / closed",
                "count": len(done),
                "items": done[:8],
            },
            {
                "stage": "in_progress",
                "label": "In pipeline",
                "count": len(in_progress),
                "items": in_progress[:8],
            },
        ],
        "fixes": fixes,
        "skills": workspace.get("skills") or [],
        "rules": workspace.get("rules") or [],
        "lineage": lineage,
        "productionReports": reports,
        "secretsConfigured": workspace.get("secretsConfigured") or {},
    }
