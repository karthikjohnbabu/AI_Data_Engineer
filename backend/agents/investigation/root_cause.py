"""Root cause analysis (rule-based; LLM-ready later)."""

ROOT_CAUSE_TEMPLATES = {
    "glue_timeout": (
        "Glue job timeout is likely caused by increased data volume or missing partition pruning. "
        "Review job timeout configuration and enable adaptive query execution."
    ),
    "redshift_scd": (
        "Redshift SCD2 merge failure often indicates distribution key skew or concurrent write conflicts. "
        "Check merge logic and WLM queue saturation during peak ETL windows."
    ),
    "schema_drift": (
        "Schema drift detected between source and Iceberg silver layer. "
        "Upstream schema change not propagated through compatibility checks."
    ),
    "databricks_oom": (
        "Databricks OOM during partition aggregation suggests insufficient cluster memory "
        "or missing broadcast join optimization for large dimension tables."
    ),
    "reconciliation": (
        "Data reconciliation mismatch between source and target. "
        "Likely caused by late-arriving records or incorrect watermark boundary."
    ),
    "watermark": (
        "Watermark not advancing indicates failed incremental load checkpoint. "
        "Previous run may have committed partial data without updating the watermark table."
    ),
    "terraform": (
        "Terraform drift in Glue connection configuration. "
        "Manual console changes not reflected in IaC state file."
    ),
    "pyspark_perf": (
        "PySpark UDF performance degradation caused by non-vectorized Python UDFs "
        "on large datasets. Consider replacing with Spark SQL expressions."
    ),
    "general": (
        "Issue requires further investigation. Agent will analyze logs, repository, and memory "
        "for similar past incidents."
    ),
}

IMPACTED_FILES = {
    "glue_timeout": [
        {"path": "glue/jobs/uk_digital_dimension_timeout.py", "changeType": "modified", "linesAdded": 12, "linesRemoved": 3},
        {"path": "glue/config/uk_digital_dimension.json", "changeType": "modified", "linesAdded": 4, "linesRemoved": 2},
    ],
    "redshift_scd": [
        {"path": "sql/scd2/customer_dim_merge.sql", "changeType": "modified", "linesAdded": 8, "linesRemoved": 2},
    ],
    "schema_drift": [
        {"path": "iceberg/silver/events_table.py", "changeType": "modified", "linesAdded": 6, "linesRemoved": 1},
    ],
    "databricks_oom": [
        {"path": "notebooks/loyalty_aggregation.py", "changeType": "modified", "linesAdded": 15, "linesRemoved": 5},
    ],
}


def analyze_root_cause(classification_id: str, summary: str) -> tuple[str, list[dict], int]:
    """Return (root_cause, impacted_files, confidence)."""
    root_cause = ROOT_CAUSE_TEMPLATES.get(classification_id, ROOT_CAUSE_TEMPLATES["general"])
    files = IMPACTED_FILES.get(classification_id, [])
    confidence = 91 if classification_id != "general" else 65
    if "failed" in summary.lower() or "mismatch" in summary.lower():
        confidence = max(45, confidence - 20)
    return root_cause, files, confidence
