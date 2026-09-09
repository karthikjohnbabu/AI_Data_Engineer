#!/usr/bin/env python3
"""Write gitignored tenant secrets.local.yaml from local env files (no prints of values)."""

from __future__ import annotations

import os
from pathlib import Path

NEWTON_ROOT = Path(__file__).resolve().parents[1]
MIGRATION_ENV = NEWTON_ROOT.parent / "data-platform-migration-data-test" / ".env"
NEWTON_ENV = NEWTON_ROOT / ".env"


def _yaml_str(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _section(name: str, fields: dict[str, str]) -> str:
    lines = [f"{name}:"]
    for key, val in fields.items():
        lines.append(f"  {key}: {_yaml_str(val)}")
    return "\n".join(lines) + "\n"


def _parse_env(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip('"').strip("'")
    return out


def _dump(path: Path, sections: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(sections).rstrip() + "\n", encoding="utf-8")
    os.chmod(path, 0o600)


def main() -> None:
    newton_env = _parse_env(NEWTON_ENV)
    _dump(
        NEWTON_ROOT / "tenant_data" / "newton" / "secrets.local.yaml",
        [
            _section(
                "aws",
                {
                    "iamUser": newton_env.get("AWS_IAM_USER", "newton"),
                    "region": newton_env.get("AWS_REGION", "eu-west-2"),
                    "accessKeyId": newton_env.get("AWS_ACCESS_KEY_ID", ""),
                    "secretAccessKey": newton_env.get("AWS_SECRET_ACCESS_KEY", ""),
                },
            ),
            _section(
                "github",
                {
                    "token": newton_env.get("GITHUB_TOKEN", ""),
                    "repo": newton_env.get("GITHUB_REPO", ""),
                },
            ),
        ],
    )

    mig = _parse_env(MIGRATION_ENV)
    _dump(
        NEWTON_ROOT / "tenant_data" / "betfred" / "secrets.local.yaml",
        [
            _section(
                "aws",
                {
                    "profile": mig.get("AWS_PROFILE", ""),
                    "region": mig.get("AWS_REGION", "eu-west-2"),
                    "accessKeyId": "",
                    "secretAccessKey": "",
                },
            ),
            _section(
                "jira",
                {
                    "url": newton_env.get("JIRA_URL", ""),
                    "email": newton_env.get("JIRA_EMAIL", ""),
                    "apiToken": newton_env.get("JIRA_API_TOKEN", ""),
                    "projectKey": "DE",
                },
            ),
            _section(
                "sqlserver",
                {
                    "host": mig.get("SQLSERVER_HOST", ""),
                    "port": mig.get("SQLSERVER_PORT", "1433"),
                    "database": mig.get("SQLSERVER_DB", ""),
                    "user": mig.get("SQLSERVER_USER", ""),
                    "password": mig.get("SQLSERVER_PASSWORD", ""),
                },
            ),
            _section(
                "redshift",
                {
                    "host": mig.get("REDSHIFT_HOST", ""),
                    "port": mig.get("REDSHIFT_PORT", "5439"),
                    "database": mig.get("REDSHIFT_DB", ""),
                    "user": mig.get("REDSHIFT_USER", ""),
                    "password": mig.get("REDSHIFT_PASSWORD", ""),
                },
            ),
            _section(
                "athena",
                {
                    "s3StagingDir": mig.get("ATHENA_S3_STAGING_DIR", ""),
                    "workgroup": mig.get("ATHENA_WORKGROUP", "primary"),
                    "catalog": mig.get("ATHENA_CATALOG", "AWSDataCatalog"),
                },
            ),
            _section(
                "bitbucket",
                {
                    "workspace": "sharpgaming",
                    "repo": "data-platform-glue-etl-transactional-data-jobs",
                    "appPassword": newton_env.get("BITBUCKET_APP_PASSWORD", ""),
                },
            ),
        ],
    )
    print("wrote newton and betfred secrets.local.yaml (gitignored)")


if __name__ == "__main__":
    main()
