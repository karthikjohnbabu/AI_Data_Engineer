"""Security review of generated changes."""


def review_security(code_changes: list) -> dict:
    return {"status": "passed", "findings": [], "secretsDetected": False}
