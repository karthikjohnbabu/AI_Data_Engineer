"""Load skill manifests from YAML directories."""

from __future__ import annotations

from pathlib import Path

import yaml

from skills.base import SkillManifest


def load_skills_from_dir(path: Path, source: str) -> list[SkillManifest]:
    if not path.exists():
        return []
    skills: list[SkillManifest] = []
    for skill_yaml in path.rglob("skill.yaml"):
        data = yaml.safe_load(skill_yaml.read_text(encoding="utf-8")) or {}
        data.setdefault("id", skill_yaml.parent.name)
        data.setdefault("name", skill_yaml.parent.name)
        data["source"] = source
        skills.append(SkillManifest.model_validate(data))
    return skills
