"""Skill registry with tenant override resolution.

Order: tenant override → tenant custom → Newton standard
"""

from __future__ import annotations

from pathlib import Path

from skills.base import SkillManifest
from skills.loader import load_skills_from_dir


class SkillRegistry:
    def __init__(self, standard_dir: Path, tenant_dir: Path | None = None):
        self.standard = {s.id: s for s in load_skills_from_dir(standard_dir, "standard")}
        self.tenant: dict[str, SkillManifest] = {}
        if tenant_dir:
            self.tenant = {s.id: s for s in load_skills_from_dir(tenant_dir, "tenant")}

    def resolve(self, skill_id: str) -> SkillManifest | None:
        if skill_id in self.tenant:
            skill = self.tenant[skill_id]
            skill.source = "override" if skill_id in self.standard else "tenant"
            return skill
        return self.standard.get(skill_id)

    def list_ids(self) -> list[str]:
        return sorted(set(self.standard) | set(self.tenant))
