# Newton platform (master skill)

Use this skill whenever the work is **Newton** (the AI Data Engineer product): tenants, dashboard, Jira-to-production phases, lineage, production reports, or local URLs.

## Working URLs (local)

| Surface | URL |
|---------|-----|
| UI | http://localhost:3000 |
| Admin | http://localhost:3000/admin |
| Betfred portal | http://localhost:3000/tenants/betfred |
| BusyBees portal | http://localhost:3000/tenants/busybees |
| API | http://localhost:8000 |
| Health | http://localhost:8000/api/health |
| OpenAPI | http://localhost:8000/docs |

Start: `make dev-backend` and `make dev-frontend` from the Newton repo root (never Betfred `AWS_PROFILE`).

## Portals

- **`/admin`** — select any tenant; see skills, rules, fixes, lineage counts; open that tenant's client portal.
- **`/tenants/betfred`** — Databricks-style dark workspace: tickets, fixes (incl. proposed_solution HTML), lineage, reports, skills, rules.
- **`/tenants/busybees`** — Snowflake-style light workspace; same concepts, different visual language + sample nursery tickets.

Import Betfred fix packs (no warehouse data):

```bash
python3 scripts/import_betfred_fixes.py
python3 scripts/import_betfred_skills_rules.py
```

## What Newton is

One control plane from **Jira to production**: triage → investigate → plan → code → test → DEV → validate → PR → approval → merge → PROD → validate → memory. Engineers approve destructive / prod steps. Lineage and production reports sit on the **same dashboard**, scoped to the selected tenant.

## Folder law

```
tenant_data/<tenant_id>/{config.yaml,skills,rules,workflows,lineage,reports,memory,secrets.example.yaml}
```

- Inherit **skills and rules** from a customer's Cursor pack into that tenant only.
- Never import warehouse **data**.
- `secrets.local.yaml` is gitignored. Betfred frontend tests use the **betfred** file; Infominds AWS uses the **newton** file.
- Future MySQL: `tenant_data/_schema/mysql_plan.md` — `tenant_id` on every row.

## Isolation

Follow `Newton/.cursor/rules/tenant-isolation.mdc`. The IAM user `newton` is for Newton platform objects, not customer clouds.

## Phase checklist

UI: Dashboard (tenant switcher) or ticket overview. API: `POST /api/tenants/workflows/run-stage` with `X-Tenant-Id`. Run **one stage** at a time; do not retype creds.
