"""Seed demo data by running agents on sample tickets."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "backend"))

from database.db import init_db
from services.agent_service import run_agent

DEMO_TICKETS = [
    "UKDATA-4821",
    "UKDATA-4815",
    "UKDATA-4812",
    "UKDATA-4808",
]


def main():
    init_db()
    print("Seeding demo agent runs...")
    for ticket_id in DEMO_TICKETS:
        try:
            result = run_agent(ticket_id)
            print(f"  {ticket_id}: {result.classification} ({result.confidence}% confidence)")
        except Exception as exc:
            print(f"  {ticket_id}: FAILED - {exc}")
    print("Done. Open http://localhost:3000/runs to view.")


if __name__ == "__main__":
    main()
