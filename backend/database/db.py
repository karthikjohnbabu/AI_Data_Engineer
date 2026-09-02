"""Extended database schema for credentials, onboarding, workflows, and recommendations."""

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

CREATE TABLE IF NOT EXISTS credentials (
    service     TEXT PRIMARY KEY,
    data        TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_config (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    domain      TEXT NOT NULL DEFAULT 'betting',
    project_type TEXT NOT NULL DEFAULT 'existing',
    context     TEXT NOT NULL DEFAULT '',
    client_name TEXT NOT NULL DEFAULT '',
    onboarded   INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    phases      TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendations (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    category    TEXT NOT NULL,
    priority    TEXT NOT NULL DEFAULT 'medium',
    dismissed   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_actions (
    id          TEXT PRIMARY KEY,
    source      TEXT NOT NULL,
    ticket_id   TEXT,
    action      TEXT NOT NULL,
    message     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
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


def dumps(data) -> str:
    return json.dumps(data)


def loads(data: str):
    if not data:
        return []
    return json.loads(data)
