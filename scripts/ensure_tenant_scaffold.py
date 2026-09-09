"""Ensure every tenant_data/<id> has the shared portal scaffold.

Skills and rules stay tenant-specific. Fixes / lineage / reports / memory /
secrets.example are required so Overview, Checklist, Results, Lineage, and
Reports all render the same way for every tenant.
"""

from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1] / "tenant_data"

REQUIRED_DIRS = (
    "skills",
    "rules",
    "fixes",
    "lineage",
    "reports",
    "memory",
    "workflows",
)

EMPTY_FIXES = {
    "tenant_id": "",
    "note": "No fix packs yet — add entries under fixes/ and list them here.",
    "fixes": [],
}

EMPTY_LINEAGE = {
    "tenant_id": "",
    "note": "Add dimensions under lineage/catalog.yaml for this tenant.",
    "view": "target_to_source",
    "layers": [
        {"id": "gold", "label": "Gold warehouse"},
        {"id": "iceberg", "label": "Curated / silver"},
        {"id": "raw", "label": "Raw intake"},
    ],
    "dimensions": [],
}

EMPTY_REPORTS = {
    "tenant_id": "",
    "title": "Production reports",
    "checks": [],
}

SECRETS_EXAMPLE = """# Copy to secrets.local.yaml (gitignored) and fill locally.
# Never commit secrets.local.yaml.
jira: {}
git: {}
aws: {}
"""


def _write_yaml(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return
    path.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def ensure_tenant(tenant_dir: Path) -> list[str]:
    actions: list[str] = []
    tid = tenant_dir.name
    cfg = tenant_dir / "config.yaml"
    if not cfg.exists():
        return [f"skip {tid}: no config.yaml"]

    for name in REQUIRED_DIRS:
        d = tenant_dir / name
        if not d.exists():
            d.mkdir(parents=True, exist_ok=True)
            actions.append(f"{tid}: mkdir {name}/")

    fixes = tenant_dir / "fixes" / "catalog.yaml"
    if not fixes.exists():
        data = {**EMPTY_FIXES, "tenant_id": tid}
        _write_yaml(fixes, data)
        actions.append(f"{tid}: created fixes/catalog.yaml")

    lineage = tenant_dir / "lineage" / "catalog.yaml"
    if not lineage.exists():
        data = {**EMPTY_LINEAGE, "tenant_id": tid}
        _write_yaml(lineage, data)
        actions.append(f"{tid}: created lineage/catalog.yaml")

    reports = tenant_dir / "reports" / "production.yaml"
    if not reports.exists():
        data = {**EMPTY_REPORTS, "tenant_id": tid, "title": f"{tid} production reports"}
        _write_yaml(reports, data)
        actions.append(f"{tid}: created reports/production.yaml")

    mem = tenant_dir / "memory" / ".gitkeep"
    if not mem.exists():
        mem.write_text("", encoding="utf-8")
        actions.append(f"{tid}: memory/.gitkeep")

    wf = tenant_dir / "workflows" / ".gitkeep"
    if not wf.exists():
        wf.write_text("", encoding="utf-8")
        actions.append(f"{tid}: workflows/.gitkeep")

    sec = tenant_dir / "secrets.example.yaml"
    if not sec.exists():
        sec.write_text(SECRETS_EXAMPLE, encoding="utf-8")
        actions.append(f"{tid}: secrets.example.yaml")

    # Soft-normalize config defaults without wiping tenant-specific skills/rules
    raw = yaml.safe_load(cfg.read_text(encoding="utf-8")) or {}
    changed = False
    if "storage" not in raw:
        raw["storage"] = {"backend": "filesystem"}
        changed = True
    if "rules" not in raw:
        raw["rules"] = {"enforce_prod_destructive_guard": True}
        changed = True
    if "skills" not in raw:
        raw["skills"] = {"include_standard": True, "allow_overrides": True}
        changed = True
    # Shared checklist workflows expect a known template name
    wf_cfg = raw.get("workflow") or {}
    if wf_cfg.get("default_template") in (None, "", "feature_to_prod"):
        wf_cfg["default_template"] = "dev_to_prod"
        raw["workflow"] = wf_cfg
        changed = True
        actions.append(f"{tid}: workflow.default_template -> dev_to_prod")
    if changed:
        cfg.write_text(
            yaml.safe_dump(raw, sort_keys=False, allow_unicode=True),
            encoding="utf-8",
        )
        actions.append(f"{tid}: updated config.yaml defaults")

    if not actions:
        actions.append(f"{tid}: ok")
    return actions


def main() -> None:
    for path in sorted(ROOT.iterdir()):
        if not path.is_dir() or path.name.startswith("_"):
            continue
        if not (path / "config.yaml").exists():
            continue
        for line in ensure_tenant(path):
            print(line)


if __name__ == "__main__":
    main()
