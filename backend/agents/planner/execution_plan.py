"""Build ordered execution steps for Newton pipeline."""


def build_execution_plan(ticket_id: str, classification_id: str, impact: dict) -> dict:
    return {
        "ticketId": ticket_id,
        "classificationId": classification_id,
        "steps": [
            "Create feature branch",
            "Generate ETL/ELT code changes",
            "Run unit / integration / regression tests",
            "Deploy to DEV and validate data",
            "Create PR and request human approval",
            "Merge and deploy PROD with validation",
            "Update Jira / memory / sector skills",
        ],
        "impact": impact,
    }
