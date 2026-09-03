"""Investigation agent facade."""

from agents.investigation.log_analysis import analyse_logs
from agents.investigation.repo_analysis import analyse_repo
from agents.investigation.root_cause import analyze_root_cause


def run_investigation(classification_id: str, summary: str) -> dict:
    root_cause, impacted_files, confidence = analyze_root_cause(classification_id, summary)
    return {
        "rootCause": root_cause,
        "impactedFiles": impacted_files,
        "confidence": confidence,
        "logs": analyse_logs(summary),
        "repo": analyse_repo(impacted_files),
    }
