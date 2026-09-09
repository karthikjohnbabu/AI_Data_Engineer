"""Pack / unpack tenant skill folders as zip archives."""

from __future__ import annotations

import io
import re
import zipfile
from pathlib import Path
from typing import Any

from tenants.secrets import tenant_dir

SAFE_SKILL = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$")
ALLOWED_SUFFIXES = {".yaml", ".yml", ".md", ".txt", ".json"}


def tenant_skills_dir(tenant_id: str) -> Path:
    return tenant_dir(tenant_id) / "skills"


def list_skill_folders(tenant_id: str) -> list[dict[str, Any]]:
    root = tenant_skills_dir(tenant_id)
    if not root.exists():
        return []
    out: list[dict[str, Any]] = []
    for path in sorted(root.iterdir()):
        if not path.is_dir() or path.name.startswith("."):
            continue
        yaml_path = path / "skill.yaml"
        if not yaml_path.exists():
            yaml_path = path / "skill.yml"
        files = sorted(p.name for p in path.iterdir() if p.is_file())
        out.append(
            {
                "id": path.name,
                "path": str(path.relative_to(tenant_dir(tenant_id))),
                "hasManifest": yaml_path.exists(),
                "files": files,
            }
        )
    return out


def build_skills_zip(
    tenant_id: str, skill_id: str | None = None
) -> tuple[bytes, str]:
    """Return (zip_bytes, filename). skill_id None = all tenant skill folders."""
    root = tenant_skills_dir(tenant_id)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        if skill_id:
            if not SAFE_SKILL.match(skill_id):
                raise ValueError(f"Invalid skill id: {skill_id}")
            folder = root / skill_id
            if not folder.is_dir():
                raise FileNotFoundError(f"Skill not found: {skill_id}")
            _add_folder(zf, folder, prefix=skill_id)
            name = f"{tenant_id}-{skill_id}-skill.zip"
        else:
            if not root.exists():
                raise FileNotFoundError("No skills directory for tenant")
            added = 0
            for folder in sorted(root.iterdir()):
                if folder.is_dir() and not folder.name.startswith("."):
                    _add_folder(zf, folder, prefix=folder.name)
                    added += 1
            if added == 0:
                raise FileNotFoundError("No tenant skill packs to download")
            name = f"{tenant_id}-skills.zip"
    return buf.getvalue(), name


def _add_folder(zf: zipfile.ZipFile, folder: Path, prefix: str) -> None:
    for path in folder.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in ALLOWED_SUFFIXES:
            continue
        rel = path.relative_to(folder)
        arc = f"{prefix}/{rel.as_posix()}"
        zf.write(path, arcname=arc)


def unpack_skills_zip(tenant_id: str, raw: bytes) -> dict[str, Any]:
    """Extract zip into tenant skills dir. Returns summary."""
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError("Zip too large (max 8 MB)")
    root = tenant_skills_dir(tenant_id)
    root.mkdir(parents=True, exist_ok=True)

    written: list[str] = []
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        names = zf.namelist()
        if not names:
            raise ValueError("Empty zip")
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = info.filename.replace("\\", "/")
            if name.startswith("/") or ".." in name.split("/"):
                raise ValueError(f"Unsafe path in zip: {name}")
            parts = [p for p in name.split("/") if p]
            if len(parts) < 2:
                # allow bare skill.yaml at root only if paired — skip orphans
                continue
            skill_id = parts[0]
            if not SAFE_SKILL.match(skill_id):
                raise ValueError(f"Invalid skill folder name: {skill_id}")
            file_name = parts[-1]
            suffix = Path(file_name).suffix.lower()
            if suffix not in ALLOWED_SUFFIXES:
                continue
            # flatten nested junk: skill_id / file
            if len(parts) > 2:
                # keep relative structure under skill
                rel = Path(*parts[1:])
            else:
                rel = Path(file_name)
            dest = (root / skill_id / rel).resolve()
            if not str(dest).startswith(str(root.resolve())):
                raise ValueError("Path escape blocked")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(zf.read(info))
            written.append(f"{skill_id}/{rel.as_posix()}")

    if not written:
        raise ValueError(
            "No skill files extracted. Zip must contain "
            "<skill-id>/skill.yaml (and optional SKILL.md)."
        )
    skills = sorted({w.split("/", 1)[0] for w in written})
    return {
        "tenantId": tenant_id,
        "skills": skills,
        "filesWritten": written,
        "count": len(skills),
    }
