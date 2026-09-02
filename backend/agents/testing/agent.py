"""Test execution agent (simulated results; real runner later)."""

TEST_SUITES: dict[str, list[dict]] = {
    "glue_timeout": [
        {"id": "t1", "name": "test_dimension_load_completes_within_timeout", "type": "Unit", "environment": "Dev", "status": "passed", "duration": "4.2s"},
        {"id": "t2", "name": "test_partition_pruning_reduces_row_count", "type": "Unit", "environment": "Dev", "status": "passed", "duration": "2.8s"},
        {"id": "t3", "name": "test_scd2_merge_integrity", "type": "Integration", "environment": "Dev", "status": "passed", "duration": "18.5s"},
    ],
    "redshift_scd": [
        {"id": "t1", "name": "test_merge_idempotency", "type": "Integration", "environment": "Dev", "status": "passed", "duration": "22.1s"},
        {"id": "t2", "name": "test_no_duplicate_active_rows", "type": "Data Quality", "environment": "Dev", "status": "passed", "duration": "8.4s"},
    ],
    "schema_drift": [
        {"id": "t1", "name": "test_schema_compatibility", "type": "Data Quality", "environment": "Dev", "status": "passed", "duration": "3.4s"},
        {"id": "t2", "name": "test_nullable_column_backfill", "type": "Unit", "environment": "Dev", "status": "passed", "duration": "5.1s"},
    ],
}

DEFAULT_TESTS = [
    {"id": "t1", "name": "test_fix_applies_cleanly", "type": "Unit", "environment": "Dev", "status": "passed", "duration": "3.0s"},
    {"id": "t2", "name": "test_no_regression", "type": "Integration", "environment": "Dev", "status": "passed", "duration": "12.0s"},
]


def run_tests(classification_id: str, confidence: int) -> list[dict]:
    """Simulate test execution. Lower confidence may produce failures."""
    tests = TEST_SUITES.get(classification_id, DEFAULT_TESTS)
    if confidence < 60:
        return [{**tests[0], "status": "failed", "duration": "1.2s"}, *tests[1:]]
    return tests
