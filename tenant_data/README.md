# Tenant data

Each customer (and Newton itself) is a **separate tenant directory**.
**Portal features are the same for every tenant** (Overview, Tickets, Fixes /
Checklist / Results, Lineage, Reports). **Skills and rules are tenant-specific.**

```
tenant_data/
  <tenant_id>/
    config.yaml              # identity, git, cloud, workflow
    skills/                  # THIS tenant's work skills only
    rules/                   # THIS tenant's rules only
    workflows/               # tenant workflow tips
    fixes/                   # fix packs + catalog.yaml
    lineage/                 # catalog.yaml — graph for THIS tenant only
    reports/                 # production.yaml — prod reports for THIS tenant
    memory/                  # tenant-scoped notes
    secrets.example.yaml     # key names only — committed
    secrets.local.yaml       # real creds — gitignored
```

Run `python scripts/ensure_tenant_scaffold.py` after adding a tenant so the
shared folders exist (skills/rules content stays yours).

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

## Frontend testing

Open `/tenants/<tenant_id>` (e.g. `/tenants/busybees`). The shell sets
`X-Tenant-Id` from the URL. Skills/rules listed are only that tenant's plus
shared standard skills when `include_standard: true`.
