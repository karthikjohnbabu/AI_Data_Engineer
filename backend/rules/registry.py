from __future__ import annotations

from pathlib import Path

import yaml

from rules.models import Rule


def load_rules(path: Path) -> list[Rule]:
    if not path.exists():
        return []
    rules: list[Rule] = []
    for f in path.glob("*.yaml"):
        data = yaml.safe_load(f.read_text(encoding="utf-8")) or {}
        rules.append(Rule.model_validate(data))
    return rules
