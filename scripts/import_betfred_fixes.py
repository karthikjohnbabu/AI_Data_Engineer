#!/usr/bin/env python3
"""Copy Betfred dimension fix packs into tenant_data/betfred/fixes (artefacts only)."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / "Cursor" / "fixes" / "dimensions"
DEST = ROOT / "tenant_data" / "betfred" / "fixes"

KEEP_NAMES = {
    "README.md",
    "notes.md",
    "pr.md",
    "delivery_checklist.md",
    "triage_validation.md",
    "triage_validation.html",
    "proposed_solution.html",
    "proposed_solution_1.html",
    "proposed_solution_2.html",
    "what_fixed_line_nos.md",
    "devils_advocate_unit_test.md",
    "final_prod_results.md",
    "ai_code_review.md",
    "glue_patch.md",
    "sql_patch.md",
    "dev_redshift_and_watermark_reset.md",
    "prod_redshift_and_watermark_reset.md",
    "place1_athena_template_code.md",
    "sql_vs_gold_keys.md",
    "task_da_l5_2026-09-08.md",
}


def _status_from_path(path: Path) -> str:
    parts = path.parts
    if "done" in parts:
        return "done"
    if "in_progress" in parts:
        return "in_progress"
    return "unknown"


def _parse_folder(name: str) -> tuple[str, str]:
    # de_9556_deposit_limit_history
    m = re.match(r"^de_(\d+)_(.+)$", name, re.I)
    if not m:
        return "", name
    return f"DE-{m.group(1)}", m.group(2)


def _pipeline_stage(status: str, artefacts: list[str]) -> str:
    if status == "done":
        return "closed"
    if "proposed_solution.html" in artefacts or any(
        a.startswith("proposed_solution") for a in artefacts
    ):
        return "solution"
    if "triage_validation.html" in artefacts or "triage_validation.md" in artefacts:
        return "triage"
    return "pipeline"


def import_status(status_dir: Path) -> list[dict]:
    items: list[dict] = []
    if not status_dir.exists():
        return items
    for folder in sorted(p for p in status_dir.iterdir() if p.is_dir()):
        jira, dim = _parse_folder(folder.name)
        out = DEST / folder.name
        out.mkdir(parents=True, exist_ok=True)
        copied: list[str] = []
        for f in folder.iterdir():
            if not f.is_file():
                continue
            if f.name not in KEEP_NAMES and not (
                f.name.startswith("proposed_solution") and f.suffix in {".html", ".md"}
            ):
                continue
            shutil.copy2(f, out / f.name)
            copied.append(f.name)
        status = _status_from_path(folder)
        items.append(
            {
                "id": folder.name,
                "jira": jira or folder.name.upper(),
                "dimension": dim.replace("_", " "),
                "dimension_key": dim,
                "status": status,
                "pipeline_stage": _pipeline_stage(status, copied),
                "artefacts": sorted(copied),
                "has_proposed_solution": any(
                    a.startswith("proposed_solution") and a.endswith(".html")
                    for a in copied
                ),
                "has_triage": any(a.startswith("triage_validation") for a in copied),
                "path": f"fixes/{folder.name}",
            }
        )
    return items


def write_catalog(items: list[dict]) -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    lines = [
        "tenant_id: betfred",
        "note: Dimension fix packs imported for UI — no warehouse dumps.",
        "fixes:",
    ]
    for item in items:
        lines.append(f"  - id: {item['id']}")
        lines.append(f"    jira: {item['jira']}")
        lines.append(f"    dimension: \"{item['dimension']}\"")
        lines.append(f"    dimension_key: {item['dimension_key']}")
        lines.append(f"    status: {item['status']}")
        lines.append(f"    pipeline_stage: {item['pipeline_stage']}")
        lines.append(
            f"    has_proposed_solution: {'true' if item['has_proposed_solution'] else 'false'}"
        )
        lines.append(f"    has_triage: {'true' if item['has_triage'] else 'false'}")
        lines.append(f"    path: {item['path']}")
        arts = item["artefacts"]
        lines.append("    artefacts:")
        for a in arts:
            lines.append(f"      - {a}")
    (DEST / "catalog.yaml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    if not SRC.exists():
        print(f"source missing: {SRC}")
        return
    if DEST.exists():
        # keep catalog rebuild clean for known folders
        for child in DEST.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
    items = import_status(SRC / "done") + import_status(SRC / "in_progress")
    write_catalog(items)
    print(f"imported fixes={len(items)} dest={DEST}")


if __name__ == "__main__":
    main()
