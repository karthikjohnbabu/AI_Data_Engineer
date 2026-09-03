"""Feature flags for Newton."""

FLAGS = {
    "planner_agent": True,
    "pr_review_agent": True,
    "human_approval_gates": True,
    "sector_skill_learning": True,
}


def enabled(flag: str) -> bool:
    return bool(FLAGS.get(flag, False))
