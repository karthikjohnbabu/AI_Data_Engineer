"""Reports API routes."""

from fastapi import APIRouter

from data.loader import load_json
from services.agent_service import get_all_runs

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
async def get_report_summary():
    dashboard = load_json("dashboard.json")
    runs = get_all_runs()

    return {
        "metrics": dashboard["metrics"],
        "agentRuns": len(runs),
        "successRate": round(
            sum(1 for r in runs if r.status.value == "completed") / max(len(runs), 1) * 100, 1
        ),
        "topClassifications": _top_classifications(runs),
        "recentRuns": [
            {
                "ticketId": r.ticket_id,
                "classification": r.classification,
                "confidence": r.confidence,
                "status": r.status.value,
                "completedAt": r.completed_at,
            }
            for r in runs[:5]
        ],
    }


def _top_classifications(runs) -> list[dict]:
    counts: dict[str, int] = {}
    for run in runs:
        counts[run.classification] = counts.get(run.classification, 0) + 1
    return [{"classification": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
