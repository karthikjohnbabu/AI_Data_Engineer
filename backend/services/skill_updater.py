"""End-of-day skill updates from work pattern analysis."""

import uuid

from database.platform_repository import add_learned_skill, list_learned_skills
from models.agent_run import utc_now
from services.run_store import list_runs

SKILL_TEMPLATES: dict[str, dict] = {
    "glue_timeout": {
        "name": "Glue Timeout Resolution",
        "description": "Auto-tune Spark configs and partition strategy for Glue job timeouts.",
        "category": "AWS",
    },
    "scd_merge": {
        "name": "SCD2 Merge Patterns",
        "description": "Handle Redshift SCD2 merge failures with dedup and key validation.",
        "category": "AWS",
    },
    "schema_drift": {
        "name": "Iceberg Schema Drift",
        "description": "Detect and reconcile Iceberg schema evolution in silver layer.",
        "category": "Data Quality",
    },
    "incremental_load": {
        "name": "Incremental Delta Loads",
        "description": "Watermark-based delta loads for source row updates (e.g. surname changes).",
        "category": "ETL",
    },
    "reconciliation": {
        "name": "Data Reconciliation",
        "description": "Daily sales and fact table reconciliation checks.",
        "category": "Data Quality",
    },
}


def update_skills_from_patterns() -> list[dict]:
    """Study today's runs and auto-add skills the team is using frequently."""
    runs = list_runs()
    if not runs:
        return []

    existing = {s["name"] for s in list_learned_skills()}
    added = []

    counts: dict[str, int] = {}
    for run in runs:
        counts[run.classification] = counts.get(run.classification, 0) + 1

    for classification, count in counts.items():
        if count < 2:
            continue
        template = SKILL_TEMPLATES.get(classification)
        if not template or template["name"] in existing:
            continue
        skill = add_learned_skill(
            skill_id=str(uuid.uuid4())[:8],
            name=template["name"],
            description=f"{template['description']} (auto-learned from {count} tickets)",
            category=template["category"],
            usage_count=count,
        )
        added.append(skill)

    return added
