"""Database repository for agent runs and ticket state."""

from database.db import dumps, get_connection, init_db, loads
from models.agent_run import AgentRunResult, RunStatus, TimelineStep


def _ensure_db() -> None:
    init_db()


def save_run(result: AgentRunResult) -> None:
    _ensure_db()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO agent_runs (
                ticket_id, status, classification, severity, root_cause,
                confidence, impacted_files, timeline, code_changes,
                test_results, data_validation, summary, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticket_id) DO UPDATE SET
                status=excluded.status,
                classification=excluded.classification,
                severity=excluded.severity,
                root_cause=excluded.root_cause,
                confidence=excluded.confidence,
                impacted_files=excluded.impacted_files,
                timeline=excluded.timeline,
                code_changes=excluded.code_changes,
                test_results=excluded.test_results,
                data_validation=excluded.data_validation,
                summary=excluded.summary,
                completed_at=excluded.completed_at
            """,
            (
                result.ticket_id,
                result.status.value,
                result.classification,
                result.severity,
                result.root_cause,
                result.confidence,
                dumps([f for f in result.impacted_files]),
                dumps([s.model_dump() for s in result.timeline]),
                dumps(result.code_changes),
                dumps(result.test_results),
                dumps(result.data_validation),
                result.summary,
                result.completed_at,
            ),
        )
        conn.commit()


def get_run(ticket_id: str) -> AgentRunResult | None:
    _ensure_db()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM agent_runs WHERE ticket_id = ?", (ticket_id,)
        ).fetchone()
    if not row:
        return None
    return AgentRunResult(
        ticket_id=row["ticket_id"],
        status=RunStatus(row["status"]),
        classification=row["classification"],
        severity=row["severity"],
        root_cause=row["root_cause"],
        confidence=row["confidence"],
        impacted_files=loads(row["impacted_files"]),
        timeline=[TimelineStep(**s) for s in loads(row["timeline"])],
        code_changes=loads(row["code_changes"]),
        test_results=loads(row["test_results"]),
        data_validation=loads(row["data_validation"]),
        summary=row["summary"],
        completed_at=row["completed_at"],
    )


def list_runs() -> list[AgentRunResult]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM agent_runs ORDER BY completed_at DESC"
        ).fetchall()
    return [
        AgentRunResult(
            ticket_id=row["ticket_id"],
            status=RunStatus(row["status"]),
            classification=row["classification"],
            severity=row["severity"],
            root_cause=row["root_cause"],
            confidence=row["confidence"],
            impacted_files=loads(row["impacted_files"]),
            timeline=[TimelineStep(**s) for s in loads(row["timeline"])],
            code_changes=loads(row["code_changes"]),
            test_results=loads(row["test_results"]),
            data_validation=loads(row["data_validation"]),
            summary=row["summary"],
            completed_at=row["completed_at"],
        )
        for row in rows
    ]


def save_ticket_override(ticket_id: str, data: dict) -> None:
    _ensure_db()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO ticket_overrides (ticket_id, data) VALUES (?, ?)
            ON CONFLICT(ticket_id) DO UPDATE SET data = excluded.data
            """,
            (ticket_id, dumps(data)),
        )
        conn.commit()


def get_ticket_override(ticket_id: str) -> dict | None:
    _ensure_db()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT data FROM ticket_overrides WHERE ticket_id = ?", (ticket_id,)
        ).fetchone()
    return loads(row["data"]) if row else None


def save_deployment(deployment: dict) -> None:
    _ensure_db()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO deployments (id, ticket_id, environment, status, approved_by, timestamp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status,
                approved_by=excluded.approved_by,
                timestamp=excluded.timestamp
            """,
            (
                deployment["id"],
                deployment["ticketId"],
                deployment["environment"],
                deployment["status"],
                deployment.get("approvedBy"),
                deployment.get("timestamp"),
                deployment["createdAt"],
            ),
        )
        conn.commit()


def list_deployments() -> list[dict]:
    _ensure_db()
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM deployments ORDER BY created_at DESC"
        ).fetchall()
    return [
        {
            "id": row["id"],
            "ticketId": row["ticket_id"],
            "environment": row["environment"],
            "status": row["status"],
            "approvedBy": row["approved_by"],
            "timestamp": row["timestamp"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]
