"""Stage transition helpers."""


def next_enabled_stages(stages: list[dict], current_index: int) -> int | None:
    i = current_index + 1
    while i < len(stages):
        if stages[i].get("enabled", True):
            return i
        i += 1
    return None
