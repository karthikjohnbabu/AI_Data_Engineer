#!/usr/bin/env python3
"""Copy Busy Bees Famly-pipeline Cursor skills/rules into tenant_data/busybees.

Canonical source is bb-famly-migration-pipeline/.cursor (not machine-local copies).
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "tenant_data" / "busybees"
DEFAULT_CURSOR = (
    ROOT.parent / "BusyBees" / "bb-famly-migration-pipeline" / ".cursor"
)

SKIP_NAME_MARKERS = ("karthik-babu", "macbook")
SKILL_DISPLAY_NAMES = {
    "aws-data-engineer-bb": "AWS Data Engineer — Busy Bees × Famly",
}
PIPELINE_RULES = (
    {
        "id": "always-dev-before-uat",
        "name": "Always test DEV fully before pushing to UAT",
        "require_human_approval": False,
        "guidance": (
            "# Always test DEV fully before pushing to UAT\n\n"
            "Busy Bees Midlothian rule: finish the change on DEV (`dev_midln`) and "
            "verify Athena / SCD2 there before any UAT script, trigger, or data change.\n\n"
            "Never jump straight to UAT. PROD is out of scope unless Prasath explicitly directs it.\n"
        ),
    },
    {
        "id": "never-touch-prod",
        "name": "Never touch PROD unless Prasath explicitly directs it",
        "require_human_approval": True,
        "scope": {"environment": "prod"},
        "guidance": (
            "# Never touch PROD\n\n"
            "Busy Bees Midlothian work is DEV then UAT only. Do not run Glue jobs, "
            "edit Delta tables, change triggers, or deploy scripts in PROD.\n\n"
            "Existing guard: `prod-delete-approval` still requires human approval for "
            "drop / truncate / delete. This rule covers any other PROD mutation.\n"
        ),
    },
    {
        "id": "curated-before-famly",
        "name": "Always run the curated job before the famly reverse job",
        "require_human_approval": False,
        "guidance": (
            "# Curated before famly\n\n"
            "Famly reverse merges on top of curated. Run `{env}_midln_{domain}` "
            "(curated → analytics) before `{env}_midln_famly_{domain}`.\n\n"
            "Rebuild from curated alone drops `new_famly_*` ids — restore reverse "
            "from `midlothian/famly/{domain}/` and re-run the famly Step Function.\n"
        ),
    },
    {
        "id": "archive-before-inplace-fix",
        "name": "Archive the Delta table before any in-place fix",
        "require_human_approval": False,
        "guidance": (
            "# Archive before in-place fix\n\n"
            "Before changing existing Delta table data, copy it to the archive bucket first: "
            "`{env}-bb-famly-migration-archive/midlothian/Analytics/[domain]/`.\n\n"
            "This is the rollback safety net. No exceptions.\n"
        ),
    },
    {
        "id": "scd2-two-row-signoff",
        "name": "SCD2 sign-off requires expired plus current rows",
        "require_human_approval": False,
        "guidance": (
            "# SCD2 two-row sign-off\n\n"
            "Do not sign off an SCD2 change until the same business key has two rows: "
            "one expired (`current_flag=N`) and one current (`current_flag=Y`).\n\n"
            "Parent and bill_payer business keys are composite with `old_famly_child_id`.\n"
        ),
    },
    {
        "id": "midlothian-domain-signoff",
        "name": "New Midlothian domain is not done after Athena rows",
        "require_human_approval": False,
        "guidance": (
            "# New Midlothian domain sign-off\n\n"
            "Copy the child/parent pattern fully before calling a domain complete:\n\n"
            "1. Run `{env}-midln-{domain}-workflow` (full Step Function), not the Glue job alone.\n"
            "2. Confirm `midlothian/curated/{domain}/` is empty and CSVs are in archive.\n"
            "3. DEV: EventBridge S3 Object Created trigger `dev-midln-{domain}-curated-s3-trigger`.\n"
            "4. UAT: matching S3 triggers; CDK daily crons stay DISABLED.\n"
            "5. DEV Glue JobMode = NOTEBOOK, role `dev-midln-data-lake-role`.\n"
        ),
    },
)


def _cursor_dir() -> Path:
    override = os.environ.get("BUSYBEES_CURSOR_DIR")
    return Path(override) if override else DEFAULT_CURSOR


def _is_machine_copy(name: str) -> bool:
    lower = name.lower()
    return any(marker in lower for marker in SKIP_NAME_MARKERS)


def _frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    meta: dict[str, str] = {}
    key = None
    buf: list[str] = []
    for line in parts[1].splitlines():
        if re.match(r"^[a-zA-Z0-9_]+:", line):
            if key:
                meta[key] = "\n".join(buf).strip().strip("\"'")
            key, _, rest = line.partition(":")
            key = key.strip()
            buf = [rest.strip().strip("\"'")]
        elif key and (line.startswith("  ") or line.startswith("\t") or line.startswith("    ")):
            buf.append(line.strip().strip("\"'"))
    if key:
        meta[key] = "\n".join(buf).strip().strip("\"'")
    return meta, parts[2].lstrip("\n")


def _dump(path: Path, data: dict) -> None:
    path.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def import_skills(cursor: Path) -> int:
    src = cursor / "skills"
    dest = DEST / "skills"
    dest.mkdir(parents=True, exist_ok=True)
    count = 0
    if not src.exists():
        return 0
    for skill_dir in sorted(p for p in src.iterdir() if p.is_dir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        text = skill_md.read_text(encoding="utf-8")
        meta, _body = _frontmatter(text)
        skill_id = skill_dir.name
        name = SKILL_DISPLAY_NAMES.get(
            skill_id, meta.get("name", skill_id.replace("-", " ").title())
        )
        description = re.sub(r"\s+", " ", meta.get("description", "")).strip()
        if description.startswith(">"):
            description = description.lstrip(">").strip()
        out = dest / skill_id
        out.mkdir(parents=True, exist_ok=True)
        (out / "SKILL.md").write_text(text, encoding="utf-8")
        for extra in skill_dir.iterdir():
            if extra.name == "SKILL.md" or not extra.is_file():
                continue
            if extra.suffix.lower() != ".md" or _is_machine_copy(extra.name):
                continue
            (out / extra.name).write_text(extra.read_text(encoding="utf-8"), encoding="utf-8")
        _dump(
            out / "skill.yaml",
            {
                "id": skill_id,
                "name": name,
                "version": "1.0.0",
                "description": description,
                "triggers": {"tenant": ["busybees"]},
                "capabilities": ["tenant_skill", "famly_migration"],
                "risk": "high",
                "handler": {"module": "SKILL.md"},
            },
        )
        count += 1
    return count


def import_rules(cursor: Path) -> int:
    src = cursor / "rules"
    dest = DEST / "rules"
    guidance = dest / "guidance"
    dest.mkdir(parents=True, exist_ok=True)
    guidance.mkdir(parents=True, exist_ok=True)
    count = 0
    if not src.exists():
        return 0
    for rule in sorted(src.glob("*.mdc")):
        if _is_machine_copy(rule.name):
            continue
        text = rule.read_text(encoding="utf-8")
        meta, body = _frontmatter(text)
        rule_id = rule.stem
        name = meta.get("description") or rule_id.replace("-", " ")
        name = re.sub(r"\s+", " ", name).strip()[:120]
        (guidance / f"{rule_id}.md").write_text(body or text, encoding="utf-8")
        require_approval = any(token in rule_id for token in ("prod", "delete", "cleanup"))
        _dump(
            dest / f"{rule_id}.yaml",
            {
                "id": rule_id,
                "name": name,
                "scope": {},
                "conditions": {},
                "action": {
                    "require_human_approval": require_approval,
                    "message": name,
                },
                "guidance_file": f"guidance/{rule_id}.md",
            },
        )
        count += 1
    return count


def import_pipeline_rules() -> int:
    dest = DEST / "rules"
    guidance = dest / "guidance"
    dest.mkdir(parents=True, exist_ok=True)
    guidance.mkdir(parents=True, exist_ok=True)
    for spec in PIPELINE_RULES:
        rule_id = spec["id"]
        (guidance / f"{rule_id}.md").write_text(spec["guidance"], encoding="utf-8")
        _dump(
            dest / f"{rule_id}.yaml",
            {
                "id": rule_id,
                "name": spec["name"],
                "scope": spec.get("scope", {}),
                "conditions": spec.get("conditions", {}),
                "action": {
                    "require_human_approval": spec["require_human_approval"],
                    "message": spec["name"],
                },
                "guidance_file": f"guidance/{rule_id}.md",
            },
        )
    return len(PIPELINE_RULES)


def main() -> None:
    cursor = _cursor_dir()
    if not cursor.exists():
        raise SystemExit(f"BusyBees .cursor not found: {cursor}")
    skills = import_skills(cursor)
    rules = import_rules(cursor)
    pipeline_rules = import_pipeline_rules()
    print(
        f"imported skills={skills} cursor_rules={rules} "
        f"pipeline_rules={pipeline_rules} src={cursor} dest={DEST}"
    )


if __name__ == "__main__":
    main()
