"""Log analysis helpers for investigation."""


def analyse_logs(summary: str) -> dict:
    return {
        "signals": [s for s in ("timeout", "oom", "schema", "null") if s in summary.lower()],
        "source": "cloudwatch|job-logs (mock)",
    }
