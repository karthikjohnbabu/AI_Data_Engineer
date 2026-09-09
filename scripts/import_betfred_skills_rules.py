#!/usr/bin/env python3
"""Copy Betfred Cursor skills/rules into tenant_data/betfred (no warehouse data)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURSOR = ROOT.parent / "Cursor" / ".cursor"
DEST = ROOT / "tenant_data" / "betfred"

SKIP_SKILL_FILES = {
    "knowledge-base.md",
    "catalog.md",
    "business-use-cases.md",
    "bedrock-kb-pointer.md",
    ".standup_last_fired",
    "weekday_9am_loop.py",
}
SKIP_RULES = {"newton-no-betfred-creds.mdc"}


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


def _yaml_quote(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def import_skills() -> int:
    src = CURSOR / "skills"
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
        name = meta.get("name", skill_id.replace("-", " ").title())
        description = re.sub(r"\s+", " ", meta.get("description", "")).strip()
        out = dest / skill_id
        out.mkdir(parents=True, exist_ok=True)
        (out / "SKILL.md").write_text(text, encoding="utf-8")
        for extra in skill_dir.iterdir():
            if extra.name in SKIP_SKILL_FILES or extra.name == "SKILL.md":
                continue
            if extra.suffix.lower() in {".md"}:
                (out / extra.name).write_text(extra.read_text(encoding="utf-8"), encoding="utf-8")
        yaml_text = (
            f"id: {skill_id}\n"
            f"name: {_yaml_quote(name)}\n"
            f"version: 1.0.0\n"
            f"description: {_yaml_quote(description[:400])}\n"
            "triggers:\n"
            "  tenant:\n"
            "    - betfred\n"
            "capabilities:\n"
            "  - tenant_skill\n"
            "risk: medium\n"
            "handler:\n"
            "  module: SKILL.md\n"
        )
        (out / "skill.yaml").write_text(yaml_text, encoding="utf-8")
        count += 1
    return count


def import_rules() -> int:
    src = CURSOR / "rules"
    dest = DEST / "rules"
    guidance = dest / "guidance"
    dest.mkdir(parents=True, exist_ok=True)
    guidance.mkdir(parents=True, exist_ok=True)
    count = 0
    if not src.exists():
        return 0
    for rule in sorted(src.glob("*.mdc")):
        if rule.name in SKIP_RULES:
            continue
        text = rule.read_text(encoding="utf-8")
        meta, body = _frontmatter(text)
        rule_id = rule.stem
        name = meta.get("description") or rule_id.replace("-", " ")
        name = re.sub(r"\s+", " ", name).strip()[:120]
        (guidance / f"{rule_id}.md").write_text(body or text, encoding="utf-8")
        require_approval = "prod" in rule_id or "delete" in rule_id or "cleanup" in rule_id
        yaml_text = (
            f"id: {rule_id}\n"
            f"name: {_yaml_quote(name)}\n"
            "scope: {}\n"
            "conditions: {}\n"
            "action:\n"
            f"  require_human_approval: {'true' if require_approval else 'false'}\n"
            f"  message: {_yaml_quote(name)}\n"
            f"guidance_file: guidance/{rule_id}.md\n"
        )
        (dest / f"{rule_id}.yaml").write_text(yaml_text, encoding="utf-8")
        count += 1
    return count


def main() -> None:
    skills = import_skills()
    rules = import_rules()
    print(f"imported skills={skills} rules={rules} dest={DEST}")


if __name__ == "__main__":
    main()
