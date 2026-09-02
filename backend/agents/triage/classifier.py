"""Ticket classification by keyword patterns."""

CLASSIFICATION_RULES = [
    ("glue_timeout", ["glue", "timeout"], "Glue Performance", "High"),
    ("redshift_scd", ["redshift", "scd"], "Redshift SCD", "Critical"),
    ("schema_drift", ["schema drift", "iceberg"], "Schema Drift", "Medium"),
    ("databricks_oom", ["databricks", "oom"], "Databricks Memory", "High"),
    ("reconciliation", ["reconciliation", "mismatch"], "Data Reconciliation", "High"),
    ("watermark", ["watermark", "incremental"], "Incremental Load", "Medium"),
    ("terraform", ["terraform", "drift"], "Infrastructure Drift", "Low"),
    ("pyspark_perf", ["pyspark", "udf", "performance"], "PySpark Performance", "Medium"),
]


def classify_ticket(summary: str) -> tuple[str, str, str]:
    """Return (classification_id, label, severity)."""
    lower = summary.lower()
    for rule_id, keywords, label, severity in CLASSIFICATION_RULES:
        if any(keyword in lower for keyword in keywords):
            return rule_id, label, severity
    return "general", "General Data Issue", "Medium"
