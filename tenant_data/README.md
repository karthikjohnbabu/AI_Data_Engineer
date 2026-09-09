# Tenant data

Each customer (and Newton itself) is a **separate tenant directory**.
Skills, rules, lineage, production reports, and secrets never cross tenants.

```
tenant_data/
  <tenant_id>/
    config.yaml              # identity, git, cloud, workflow
    skills/                  # this tenant's work skills (skill.yaml + SKILL.md)
    rules/                   # this tenant's rules (*.yaml + optional guidance/)
    workflows/               # tenant workflow tips / checklists
    lineage/                 # catalog.yaml — graph for THIS tenant only
    reports/                 # production.yaml — prod reports for THIS tenant
    memory/                  # tenant-scoped notes (filesystem now)
    secrets.example.yaml     # key names only — committed
    secrets.local.yaml       # real creds — gitignored
```

## Tenants

| Id | Purpose |
|----|---------|
| `newton` | Newton product: code repo, Infominds IAM user `newton`, platform skills |
| `betfred` | Betfred data-platform work: inherited **skills and rules only** (no warehouse dumps) |
| `busybees` | BusyBees tenant |
| `example_customer` | Demo tenant |

## Isolation (hard)

1. Resolve `X-Tenant-Id` (or default tenant) **before** any cloud / Jira / git call.
2. Load secrets only from that tenant's `secrets.local.yaml`.
3. Do **not** fall back to another tenant's keys (Newton `.env` AWS is the `newton` tenant only).
4. Do **not** copy warehouse tables, ticket extracts, or player keys into `tenant_data`.
5. Future MySQL: one database, `tenant_id` on every row, tenant-wise access. See `_schema/mysql_plan.md`.

## Frontend testing (Betfred)

Pick tenant **Betfred** in the dashboard. Phases use `tenant_data/betfred/secrets.local.yaml` so you do not retype creds. Copy `secrets.example.yaml` → `secrets.local.yaml` and fill values locally.
