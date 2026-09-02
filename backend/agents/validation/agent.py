"""Data validation agent (simulated checks; real AWS/Databricks later)."""

DEFAULT_CHECKS = [
    {"name": "Row Count Check", "value": "8.49M rows", "status": "passed"},
    {"name": "Schema Check", "value": "23 columns", "status": "passed"},
    {"name": "Data Quality Check", "value": "100%", "status": "passed"},
    {"name": "Reconciliation Check", "value": "100%", "status": "passed"},
]


def run_validation(classification_id: str, confidence: int) -> list[dict]:
    """Run data validation checks."""
    checks = [dict(c) for c in DEFAULT_CHECKS]
    if confidence < 60:
        checks[3] = {"name": "Reconciliation Check", "value": "94.2%", "status": "failed"}
    elif classification_id == "reconciliation":
        checks[3] = {"name": "Reconciliation Check", "value": "100%", "status": "passed"}
    return checks
