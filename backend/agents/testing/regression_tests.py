"""Regression test runner stub."""


def run_regression_tests(classification_id: str) -> list[dict]:
    return [{"name": f"regression_{classification_id}", "status": "passed", "durationMs": 1500}]
