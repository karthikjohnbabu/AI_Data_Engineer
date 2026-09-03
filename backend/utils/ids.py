"""ID helpers."""

import uuid


def short_id() -> str:
    return str(uuid.uuid4())[:8]
