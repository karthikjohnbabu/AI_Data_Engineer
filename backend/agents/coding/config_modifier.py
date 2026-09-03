"""Generate config / job parameter changes."""


def apply_config_changes(classification_id: str) -> list[dict]:
    return [{"file": "job_params.json", "change": f"tuned for {classification_id}", "language": "json"}]
