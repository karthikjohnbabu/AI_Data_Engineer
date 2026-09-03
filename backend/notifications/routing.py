"""Route notifications by event type."""


def route(event: str) -> list[str]:
    mapping = {
        "approval_required": ["slack", "teams", "in_app"],
        "run_failed": ["slack", "in_app"],
        "prod_deployed": ["slack", "teams", "jira"],
    }
    return mapping.get(event, ["in_app"])
