"""SQLite database setup and connection management."""

import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "agent.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS agent_runs (
    ticket_id       TEXT PRIMARY KEY,
    status          TEXT NOT NULL,
    classification  TEXT NOT NULL,
    severity        TEXT NOT NULL,
    root_cause      TEXT NOT NULL,
    confidence      INTEGER NOT NULL,
    impacted_files  TEXT NOT NULL DEFAULT '[]',
    timeline        TEXT NOT NULL DEFAULT '[]',
    code_changes    TEXT NOT NULL DEFAULT '[]',
    test_results    TEXT NOT NULL DEFAULT '[]',
    data_validation TEXT NOT NULL DEFAULT '[]',
    summary         TEXT NOT NULL DEFAULT '',
    completed_at    TEXT
);

CREATE TABLE IF NOT EXISTS ticket_overrides (
    ticket_id TEXT PRIMARY KEY,
    data      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deployments (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT NOT NULL,
    environment TEXT NOT NULL,
    status      TEXT NOT NULL,
    approved_by TEXT,
    timestamp   TEXT,
    created_at  TEXT NOT NULL
);
"""


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(_SCHEMA)
        conn.commit()


def row_to_dict(row: sqlite3.Row) -> dict:
    return dict(row)


def dumps(data) -> str:
    return json.dumps(data)


def loads(data: str):
    return json.loads(data) if data else []
