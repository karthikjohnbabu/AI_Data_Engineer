# Gold Redshift CREATE — Glue only

After an intentional **DROP** of dimension/fact gold (DEV reload gate) the
table must come back **only through the Glue job**, not via agent Redshift
Data API / console `CREATE TABLE` shells.

## Hard rule

- **Do not** run external `CREATE TABLE` / empty-shell DDL for gold as the
  recovery path (agent, ad-hoc SQL, “run this CREATE then start Glue”).
- The job must detect a missing target and recreate + load (e.g.
  `redshift_recreate` when gold is absent; `redshift_sync` MERGE when it
  exists). Skip `delete_from_redshift` when gold is missing.
- Ops DROP + epoch watermark is fine; **recreation is Glue’s job**.

## Why

`redshift_sync` alone does not reliably CREATE a missing target (append
path / `pyWriteDynamicFrame` failures). Putting recreate in the job keeps
one path for scheduled and manual runs — no out-of-band DDL drift.

## Agent behaviour

- Watermark skill: **DEV** = BACKUP (`_bak_YYYYMMDD`) then DROP + epoch →
  user runs Glue with **defaults** after Jenkins has the job tip.
  **PROD** = no backup unless user asks. No external CREATE step.
- Reference DDL under `fixes/{dim}/*.sql` is documentation only — not the
  reload create path.
- Incremental **ALTER ADD COLUMN** while gold exists may still be
  Liquibase/DBA or `redshift_sync` auto-ALTER; that is not the same as
  recreating a dropped table.

## Related

- `glue-no-manual-job-param-overrides`
- `dimension-watermark-reset`
- `dimension-fix`
