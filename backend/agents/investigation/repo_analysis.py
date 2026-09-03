"""Repository analysis helpers."""


def analyse_repo(impacted_files: list) -> dict:
    return {
        "candidatePaths": [f.get("path") if isinstance(f, dict) else str(f) for f in (impacted_files or [])],
        "strategy": "keyword + architecture memory",
    }
