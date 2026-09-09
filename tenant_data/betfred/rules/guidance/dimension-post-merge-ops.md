# Dimension post-merge ops (PR + prod reload)

Use the **same four-step shape** in every `pr.md` **Post-merge ops (manual)**
section and in prod reload instructions unless the ticket needs extra lines.

```text
1. Prod reload: run prod-redshift_cleanup_tables (four params only — see rule prod-cleanup-four-params-only). Glue recreates gold. No manual CREATE. No backup.
2. Run <prod_glue_job> ≥ 2 times (defaults only).
3. Post-deploy validation as test SQL Server → prod Redshift (Jira: **Post-deploy prod validation** — not “Place 3”):
   - Smoke (counts, ticket-specific invariants, e.g. 0 OK%)
   - **Business key overlap** from test SQL Server (intersection %, SQL-only, warehouse-only, attribute match on shared keys) — **mandatory; smoke alone is not enough**
4. Attach evidence in Jira DE-XXXX; update `final_prod_results.md`.
```

**Cleanup job — set only:** `audit_job_name`, `audit_job_component_keys`,
`schema`, `tables`. Do **not** override `delete_audit_entries` /
`drop_redshift_table` / `truncate_redshift_table` (Glue defaults: true / true / false).

**Manual epoch watermark** (step 2 in older PRs) applies only when **not**
using `prod-redshift_cleanup_tables` with default `delete_audit_entries=true`.

**Note** line at the end — **only** for ticket-specific caveats (repair until
reload, coordinate reporting, etc.). Omit if nothing extra.

## Defaults

- **DEV reload:** **always BACKUP** gold
  (`dimension.{table}_bak_YYYYMMDD` CTAS) **then DROP**. Skip backup only if
  the user explicitly says so, or gold is empty/missing. Glue recreates gold
  after DROP — no empty CREATE.
- **PROD reload:** **no backup** unless the user **explicitly** asks
  (`prod-redshift_cleanup_tables` / post-merge default).
- **No** manual CREATE empty gold — Glue `redshift_recreate` when missing
  (`glue-gold-create-via-job-only`).
- **Post-deploy gate:** always include **BK overlap from test SQL Server**
  (same grain as DEV validation), not prod smoke/count checks only.
- **No** vague Jenkins / Liquibase / backfill paragraphs — concrete steps only.
- Upstream job order **only when the dim needs it** (e.g. run
  `dimension.player` before `deposit_limit_history`; session_history reads
  Iceberg — usually no player dim first).

Full template and examples: skill `dimension-pr`. DEV/prod runbooks:
skill `dimension-watermark-reset`.
