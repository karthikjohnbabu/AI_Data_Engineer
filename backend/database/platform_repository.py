"""Repository for platform configuration, credentials, workflows, and recommendations."""

import uuid
from pathlib import Path

from database.db import dumps, get_connection, init_db, loads
from models.agent_run import utc_now
from security.crypto import decrypt_credential_data, encrypt_credential_data

DOMAINS_DIR = Path(__file__).resolve().parent.parent / "data" / "domains"
WORKFLOWS_DIR = Path(__file__).resolve().parent.parent / "data" / "workflows"


def _ensure_db() -> None:
    init_db()


# --- Credentials ---

def save_credentials(service: str, data: dict) -> dict:
    _ensure_db()
    now = utc_now()
    existing = get_credentials(service) or {}
    merged = {**existing, **{k: v for k, v in data.items() if v}}
    encrypted = encrypt_credential_data(merged)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO credentials (service, data, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(service) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
            """,
            (service, dumps(encrypted), now),
        )
        conn.commit()
    return {"service": service, "configured": True, "updatedAt": now, "encrypted": True}


def get_credentials(service: str) -> dict | None:
    _ensure_db()
    with get_connection() as conn:
        row = conn.execute("SELECT data FROM credentials WHERE service = ?", (service,)).fetchone()
    if not row:
        return None
    return decrypt_credential_data(loads(row["data"]))


def list_credential_services() -> list[str]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute("SELECT service FROM credentials").fetchall()
    return [r["service"] for r in rows]


def get_credentials_masked() -> list[dict]:
    _ensure_db()
    services = ["aws", "jira", "bitbucket", "github", "jenkins", "slack", "teams"]
    configured = set(list_credential_services())
    result = []
    for svc in services:
        cred = get_credentials(svc)
        result.append({
            "service": svc,
            "configured": svc in configured,
            "maskedFields": _mask_fields(cred) if cred else {},
            "updatedAt": _get_updated_at(svc),
        })
    return result


def _get_updated_at(service: str) -> str | None:
    with get_connection() as conn:
        row = conn.execute("SELECT updated_at FROM credentials WHERE service = ?", (service,)).fetchone()
    return row["updated_at"] if row else None


def _mask_fields(data: dict) -> dict:
    masked = {}
    for key, value in data.items():
        if key in ("accessKeyId", "email", "url", "workspace", "region", "webhookUrl"):
            masked[key] = value
        elif isinstance(value, str) and len(value) > 4:
            masked[key] = "****" + value[-4:]
        else:
            masked[key] = "****"
    return masked


# --- Project / Onboarding ---

def get_project_config() -> dict:
    _ensure_db()
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM project_config WHERE id = 1").fetchone()
    if not row:
        return {
            "domain": "betting",
            "projectType": "existing",
            "context": "",
            "clientName": "",
            "onboarded": False,
        }
    return {
        "domain": row["domain"],
        "projectType": row["project_type"],
        "context": row["context"],
        "clientName": row["client_name"],
        "onboarded": bool(row["onboarded"]),
        "updatedAt": row["updated_at"],
    }


def save_project_config(config: dict) -> dict:
    _ensure_db()
    now = utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO project_config (id, domain, project_type, context, client_name, onboarded, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                domain=excluded.domain, project_type=excluded.project_type,
                context=excluded.context, client_name=excluded.client_name,
                onboarded=excluded.onboarded, updated_at=excluded.updated_at
            """,
            (
                config.get("domain", "betting"),
                config.get("projectType", "existing"),
                config.get("context", ""),
                config.get("clientName", ""),
                1 if config.get("onboarded", True) else 0,
                now,
            ),
        )
        conn.commit()
    return get_project_config()


# --- Domains ---

def list_domains() -> list[dict]:
    domains = []
    for path in sorted(DOMAINS_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            import json
            domains.append(json.load(f))
    return domains


def get_domain(domain_id: str) -> dict | None:
    path = DOMAINS_DIR / f"{domain_id}.json"
    if not path.exists():
        return None
    import json
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# --- Workflows ---

def get_default_workflow() -> dict:
    import json
    path = WORKFLOWS_DIR / "default_jira_workflow.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def list_workflows() -> list[dict]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM workflows ORDER BY updated_at DESC").fetchall()
    custom = [{"id": r["id"], "name": r["name"], "description": r["description"],
               "phases": loads(r["phases"]), "custom": True} for r in rows]
    default = get_default_workflow()
    default["custom"] = False
    return [default, *custom]


def save_workflow_from_nl(name: str, description: str, phases_text: str) -> dict:
    """Parse natural language phase description into structured workflow."""
    phases = _parse_nl_phases(phases_text)
    wf_id = str(uuid.uuid4())[:8]
    now = utc_now()
    _ensure_db()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO workflows (id, name, description, phases, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (wf_id, name, description, dumps(phases), now, now),
        )
        conn.commit()
    return {"id": wf_id, "name": name, "description": description, "phases": phases, "custom": True}


def _parse_nl_phases(text: str) -> list[dict]:
    """Simple NL parser: lines starting with 'Phase' become phases, bullets become tasks."""
    phases = []
    current = None
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        if lower.startswith("phase"):
            if current:
                phases.append(current)
            current = {"id": f"phase-{len(phases)+1}", "name": line.rstrip(":"), "tasks": []}
        elif current and (line.startswith("-") or line.startswith("*") or line[0].isdigit()):
            task = line.lstrip("-*0123456789. ").strip()
            if task:
                current["tasks"].append(task)
        elif current:
            current["tasks"].append(line)
    if current:
        phases.append(current)
    if not phases:
        phases = [{"id": "phase-1", "name": "Custom Phase", "tasks": [text]}]
    return phases


# --- Recommendations (adaptive learning) ---

def list_recommendations(include_dismissed: bool = False) -> list[dict]:
    _ensure_db()
    query = "SELECT * FROM recommendations"
    if not include_dismissed:
        query += " WHERE dismissed = 0"
    query += " ORDER BY created_at DESC"
    with get_connection() as conn:
        rows = conn.execute(query).fetchall()
    return [_row_to_recommendation(r) for r in rows]


def add_recommendation(title: str, message: str, category: str, priority: str = "medium") -> dict:
    _ensure_db()
    rec_id = str(uuid.uuid4())[:8]
    now = utc_now()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO recommendations (id, title, message, category, priority, dismissed, created_at) VALUES (?,?,?,?,?,0,?)",
            (rec_id, title, message, category, priority, now),
        )
        conn.commit()
    return {"id": rec_id, "title": title, "message": message, "category": category, "priority": priority}


def dismiss_recommendation(rec_id: str) -> None:
    _ensure_db()
    with get_connection() as conn:
        conn.execute("UPDATE recommendations SET dismissed = 1 WHERE id = ?", (rec_id,))
        conn.commit()


def generate_daily_recommendations() -> list[dict]:
    """Study work patterns and auto-generate skill/workflow recommendations."""
    from services.run_store import list_runs

    runs = list_runs()
    new_recs = []
    if not runs:
        new_recs.append(add_recommendation(
            "Run your first agent",
            "Submit a Jira ticket or click Run Again to start building work pattern history.",
            "onboarding", "high",
        ))
        return new_recs

    classifications: dict[str, int] = {}
    for run in runs:
        classifications[run.classification] = classifications.get(run.classification, 0) + 1

    top = max(classifications, key=classifications.get)
    new_recs.append(add_recommendation(
        f"Optimize {top} workflow",
        f"You've had {classifications[top]} {top} tickets. Consider creating a dedicated skill template to speed up resolution.",
        "skills", "medium",
    ))

    failed = [r for r in runs if r.status.value == "failed"]
    if failed:
        new_recs.append(add_recommendation(
            "Review failed runs",
            f"{len(failed)} agent run(s) failed. Review root causes and update domain memory with known fixes.",
            "quality", "high",
        ))

    config = get_project_config()
    if config.get("domain") == "betting":
        new_recs.append(add_recommendation(
            "BBees incremental load pattern",
            "For source row updates (e.g. surname changes), use watermark-based delta loads — not full extracts. Data freeze is active post-migration.",
            "workflow", "medium",
        ))

    return new_recs


def _row_to_recommendation(row) -> dict:
    return {
        "id": row["id"], "title": row["title"], "message": row["message"],
        "category": row["category"], "priority": row["priority"],
        "dismissed": bool(row["dismissed"]), "createdAt": row["created_at"],
    }


# --- Pending actions (human-in-the-loop) ---

def list_pending_actions() -> list[dict]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM pending_actions WHERE status = 'pending' ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def create_pending_action(source: str, action: str, message: str, ticket_id: str | None = None) -> dict:
    _ensure_db()
    action_id = str(uuid.uuid4())[:8]
    now = utc_now()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO pending_actions (id, source, ticket_id, action, message, status, created_at) VALUES (?,?,?,?,?,'pending',?)",
            (action_id, source, ticket_id, action, message, now),
        )
        conn.commit()
    return {"id": action_id, "source": source, "action": action, "message": message, "status": "pending"}


def resolve_pending_action(action_id: str, approved: bool) -> dict:
    _ensure_db()
    status = "approved" if approved else "rejected"
    with get_connection() as conn:
        conn.execute("UPDATE pending_actions SET status = ? WHERE id = ?", (status, action_id))
        conn.commit()
    return {"id": action_id, "status": status}


# --- Tech stack detection ---

def detect_tech_stack() -> dict:
    creds = {s: get_credentials(s) for s in list_credential_services()}
    aws = creds.get("aws", {})
    return {
        "detected": True,
        "cloud": "aws" if aws else "not_configured",
        "services": [
            {"name": "AWS", "category": "Cloud", "status": "connected" if aws else "not_configured",
             "environments": _aws_environments(aws)},
            {"name": "Jira", "category": "Ticketing", "status": "connected" if creds.get("jira") else "mock"},
            {"name": "Bitbucket", "category": "Version Control", "status": "connected" if creds.get("bitbucket") else "mock"},
            {"name": "Jenkins", "category": "CI/CD", "status": "connected" if creds.get("jenkins") else "not_configured"},
            {"name": "Slack", "category": "Notifications", "status": "connected" if creds.get("slack") else "mock"},
            {"name": "Microsoft Teams", "category": "Notifications", "status": "connected" if creds.get("teams") else "not_configured",
             "note": "Uses webhook relay — no direct manager monitoring"},
            {"name": "Databricks", "category": "Platform", "status": "mock"},
        ],
        "domain": get_project_config().get("domain", "betting"),
        "client": get_project_config().get("clientName", ""),
    }


# --- Provisioning ---

def save_provisioning_job(job: dict) -> dict:
    _ensure_db()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO provisioning_jobs (id, status, cloud, resources, created_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                job["id"], job["status"], job["cloud"], dumps(job["resources"]),
                job["createdAt"], job.get("completedAt"),
            ),
        )
        conn.commit()
    return job


def list_provisioning_jobs() -> list[dict]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM provisioning_jobs ORDER BY created_at DESC LIMIT 10").fetchall()
    return [
        {
            "id": r["id"], "status": r["status"], "cloud": r["cloud"],
            "resources": loads(r["resources"]), "createdAt": r["created_at"],
            "completedAt": r["completed_at"],
        }
        for r in rows
    ]


# --- Learned skills ---

def add_learned_skill(
    skill_id: str, name: str, description: str, category: str, usage_count: int = 0,
) -> dict:
    _ensure_db()
    now = utc_now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO learned_skills
            (id, name, description, category, usage_count, auto_generated, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
            """,
            (skill_id, name, description, category, usage_count, now),
        )
        conn.commit()
    return {
        "id": skill_id, "name": name, "description": description,
        "category": category, "usageCount": usage_count, "status": "active",
        "autoGenerated": True, "lastUsed": now,
    }


def list_learned_skills() -> list[dict]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM learned_skills ORDER BY created_at DESC").fetchall()
    return [
        {
            "id": r["id"], "name": r["name"], "description": r["description"],
            "category": r["category"], "usageCount": r["usage_count"],
            "status": "active", "autoGenerated": bool(r["auto_generated"]),
            "lastUsed": r["created_at"],
        }
        for r in rows
    ]


def _aws_environments(aws: dict) -> list[dict]:
    if not aws:
        return [
            {"name": "Dev", "status": "not_configured", "region": "—"},
            {"name": "UAT", "status": "not_configured", "region": "—"},
            {"name": "Prod", "status": "not_configured", "region": "—"},
        ]
    region = aws.get("region", "eu-west-2")
    return [
        {"name": "Dev", "status": "connected", "region": region, "vpc": aws.get("devVpc", "vpc-dev-data")},
        {"name": "UAT", "status": "connected", "region": region, "vpc": aws.get("uatVpc", "vpc-uat-data")},
        {"name": "Prod", "status": "connected", "region": region, "vpc": aws.get("prodVpc", "vpc-prod-data")},
    ]
