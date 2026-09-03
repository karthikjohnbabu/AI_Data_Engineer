"""Estimate blast radius for a planned change."""


def analyse_impact(classification_id: str, impacted_files: list) -> dict:
    files = impacted_files or []
    return {
        "filesAffected": len(files),
        "tablesAffected": max(1, len(files) // 2) if files else 0,
        "blastRadius": "Medium" if len(files) > 2 else "Low",
        "classificationId": classification_id,
    }
