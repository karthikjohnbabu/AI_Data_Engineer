"""Load mock JSON data for API routes."""

import json
from pathlib import Path

MOCK_DIR = Path(__file__).parent / "mock"


def load_json(filename: str) -> dict | list:
    with open(MOCK_DIR / filename, encoding="utf-8") as f:
        return json.load(f)
