"""Per-ticket delivery checklist — phases with selectable checks."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from tenants.fixes import get_fix, list_fixes, load_fixes_catalog
from tenants.secrets import tenant_dir

# Phase = numbered delivery gate; checks = selectable work items inside it.
DEFAULT_PHASES: list[dict[str, Any]] = [
    {
        "id": "phase1",
        "label": "Phase 1 · Triage & pre-DEV",
        "workflow_stage": "triage",
        "checks": [
            {"id": "read_jira", "label": "Read Jira + comments / links"},
            {"id": "source_pipes", "label": "Map source pipes (CDC vs API vs extract)"},
            {"id": "triage_doc", "label": "Write / refresh triage validation"},
            {"id": "place1_athena", "label": "Pre-DEV tip (Athena / logic proof)"},
        ],
    },
    {
        "id": "phase2",
        "label": "Phase 2 · Implement & DEV",
        "workflow_stage": "code",
        "checks": [
            {"id": "glue_tip", "label": "Implement Glue tip / config"},
            {"id": "pre_commit", "label": "Lint / type gate on touched files"},
            {"id": "dev_deploy", "label": "Deploy to DEV"},
            {"id": "dev_reload", "label": "DEV watermark / gold reload if needed"},
            {"id": "place2_validate", "label": "DEV validation (test SQL → DEV RS)"},
        ],
    },
    {
        "id": "phase3",
        "label": "Phase 3 · PR & prod",
        "workflow_stage": "create_pr",
        "checks": [
            {"id": "pr_draft", "label": "Draft / refresh PR"},
            {"id": "prod_deploy", "label": "Prod deploy"},
            {"id": "prod_reload", "label": "Prod cleanup / reload if needed"},
            {"id": "place3_validate", "label": "Post-deploy prod validation"},
            {"id": "close_ticket", "label": "Close ticket with evidence"},
        ],
    },
]


def _run_state_path(tenant_id: str, fix_id: str) -> Path:
    return tenant_dir(tenant_id) / "fixes" / fix_id / "run_state.yaml"


def _read_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return data if isinstance(data, dict) else {}


def _write_yaml(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def _phase_def(phase_id: str) -> dict[str, Any] | None:
    return next((p for p in DEFAULT_PHASES if p["id"] == phase_id), None)


def get_checklist(tenant_id: str, fix_id: str) -> dict[str, Any]:
    fix = get_fix(tenant_id, fix_id)
    if fix is None:
        return {"found": False, "fixId": fix_id, "phases": []}

    state = _read_yaml(_run_state_path(tenant_id, fix_id))
    phase_state = state.get("phases") or {}
    check_state = state.get("checks") or {}
    phases_out = []
    for p in DEFAULT_PHASES:
        pid = p["id"]
        st = phase_state.get(pid) or {}
        checks_out = []
        for c in p.get("checks") or []:
            cid = c["id"]
            key = f"{pid}.{cid}"
            cst = check_state.get(key) or {}
            checks_out.append(
                {
                    **c,
                    "status": cst.get("status") or "pending",
                    "lastRunAt": cst.get("lastRunAt"),
                    "message": cst.get("message"),
                }
            )
        check_done = sum(
            1 for c in checks_out if c["status"] in ("success", "done")
        )
        check_total = len(checks_out) or 1
        phase_status = st.get("status") or "pending"
        if check_done == check_total and check_total:
            phase_status = st.get("status") or "success"
        phases_out.append(
            {
                "id": pid,
                "label": p["label"],
                "workflow_stage": p["workflow_stage"],
                "status": phase_status,
                "lastRunAt": st.get("lastRunAt"),
                "runId": st.get("runId"),
                "message": st.get("message"),
                "checks": checks_out,
                "checksDone": check_done,
                "checksTotal": check_total,
            }
        )
    return {
        "found": True,
        "tenantId": tenant_id,
        "fixId": fix_id,
        "jira": fix.get("jira"),
        "dimension": fix.get("dimension"),
        "pipelineStage": fix.get("pipeline_stage"),
        "status": fix.get("status"),
        "phases": phases_out,
        "currentPhase": state.get("currentPhase"),
    }


def mark_checks_run(
    tenant_id: str,
    fix_id: str,
    phase_id: str,
    check_ids: list[str] | None,
    *,
    run_id: str,
    message: str,
    status: str = "success",
) -> dict[str, Any]:
    """Mark selected checks (or whole phase if check_ids empty/None)."""
    phase = _phase_def(phase_id)
    if phase is None:
        raise ValueError(f"Unknown phase: {phase_id}")

    all_ids = [str(c["id"]) for c in (phase.get("checks") or [])]
    if check_ids:
        unknown = [c for c in check_ids if c not in all_ids]
        if unknown:
            raise ValueError(f"Unknown checks for {phase_id}: {unknown}")
        selected = list(check_ids)
        whole_phase = False
    else:
        selected = all_ids
        whole_phase = True

    path = _run_state_path(tenant_id, fix_id)
    state = _read_yaml(path)
    checks = dict(state.get("checks") or {})
    phases = dict(state.get("phases") or {})
    now = datetime.now(timezone.utc).isoformat()

    for cid in selected:
        key = f"{phase_id}.{cid}"
        checks[key] = {
            "status": status,
            "lastRunAt": now,
            "runId": run_id,
            "message": message,
        }

    # Recompute phase status from checks
    done = 0
    for cid in all_ids:
        key = f"{phase_id}.{cid}"
        if (checks.get(key) or {}).get("status") in ("success", "done"):
            done += 1
    phase_complete = done == len(all_ids) and len(all_ids) > 0
    phases[phase_id] = {
        **(phases.get(phase_id) or {}),
        "status": "success" if phase_complete or whole_phase else "in_progress",
        "lastRunAt": now,
        "runId": run_id,
        "message": message
        if whole_phase
        else f"Checks {', '.join(selected)} · {done}/{len(all_ids)}",
    }

    # Auto-complete earlier phases if we advanced
    seen = False
    for p in DEFAULT_PHASES:
        if p["id"] == phase_id:
            seen = True
            continue
        if not seen:
            prev = phases.get(p["id"]) or {}
            if prev.get("status") in (None, "pending"):
                phases[p["id"]] = {
                    **prev,
                    "status": "done",
                    "lastRunAt": prev.get("lastRunAt") or now,
                    "message": prev.get("message")
                    or "Auto-marked before later phase",
                }
                for c in p.get("checks") or []:
                    key = f"{p['id']}.{c['id']}"
                    if (checks.get(key) or {}).get("status") not in (
                        "success",
                        "done",
                    ):
                        checks[key] = {
                            "status": "done",
                            "lastRunAt": now,
                            "message": "Auto-marked before later phase",
                        }

    state["checks"] = checks
    state["phases"] = phases
    state["currentPhase"] = phase_id
    state["updatedAt"] = now
    _write_yaml(path, state)

    catalog = load_fixes_catalog(tenant_id)
    fixes = list(catalog.get("fixes") or [])
    for i, item in enumerate(fixes):
        if isinstance(item, dict) and item.get("id") == fix_id:
            fixes[i] = {
                **item,
                "pipeline_stage": phase_id,
                "status": "done"
                if phase_id == "phase3" and phase_complete
                else "in_progress",
            }
            break
    catalog["fixes"] = fixes
    _write_yaml(tenant_dir(tenant_id) / "fixes" / "catalog.yaml", catalog)

    return get_checklist(tenant_id, fix_id)


def mark_phase_run(
    tenant_id: str,
    fix_id: str,
    phase_id: str,
    *,
    run_id: str,
    message: str,
    status: str = "success",
) -> dict[str, Any]:
    """Back-compat: run whole phase."""
    return mark_checks_run(
        tenant_id,
        fix_id,
        phase_id,
        None,
        run_id=run_id,
        message=message,
        status=status,
    )


def list_ticket_summaries(tenant_id: str) -> list[dict[str, Any]]:
    out = []
    for fix in list_fixes(tenant_id):
        fid = str(fix.get("id") or "")
        cl = get_checklist(tenant_id, fid) if fid else {"phases": []}
        phases = cl.get("phases") or []
        done = sum(
            1 for p in phases if p.get("status") in ("success", "done")
        )
        total = len(phases)
        out.append(
            {
                **fix,
                "checklistProgress": f"{done}/{total}",
                "currentPhase": cl.get("currentPhase"),
            }
        )
    return out
