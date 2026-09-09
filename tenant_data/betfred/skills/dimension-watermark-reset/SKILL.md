---
name: dimension-watermark-reset
description: >-
  Read or reset DynamoDB incremental watermarks for UK Digital Glue dimension
  jobs in ETLJobControl; DEV reload gate (BACKUP then DROP gold — Glue
  recreates); PROD reload via prod-redshift_cleanup_tables or DROP + epoch
  watermark. Always ask permission before mutations. Use when the user asks
  to reset watermark, drop Redshift gold, full reload a dimension in DEV or
  PROD, or run redshift_cleanup_tables.
---

# Dimension watermark reset

Reset (or read) the incremental watermark in `{env}-ETLJobControl` so a Glue
dimension job re-reads all Iceberg history after a gold table drop or logic
change.

**Not the same as** `{env}-DataProcessingJobControl` — that table is the
**transactional_data_quality_mapping** CDC watermark store (same
JobStatusHandler item shape; different writer). Dim watermark resets always
use **ETLJobControl**, never DataProcessingJobControl.

## AWS SSO (proactive)

Before DynamoDB / Glue / Redshift Data API calls: if the token is expired,
run `aws sso login --profile <dev|prod>` (match the env), wait for browser
approval, then **retry** — do not stop at “SSO expired”. See rule
`aws-sso-proactive.mdc`. Prod **mutations** still need an explicit user yes.

**Per-dimension runbooks:**
- DEV: `fixes/dimensions/{status}/de_{jira}_{name}/dev_redshift_and_watermark_reset.md`
- PROD: `fixes/dimensions/{status}/de_{jira}_{name}/prod_redshift_and_watermark_reset.md`
- Prod validation evidence (when done): `fixes/dimensions/{status}/de_{jira}_{name}/final_prod_results.md`

**Example (deposit_limit_history):**
- `fixes/dimensions/done/de_9556_deposit_limit_history/dev_redshift_and_watermark_reset.md`
- `fixes/dimensions/done/de_9556_deposit_limit_history/prod_redshift_and_watermark_reset.md`
- `fixes/dimensions/done/de_9556_deposit_limit_history/final_prod_results.md`

When the user says *watermark reset and drop redshift table in prod*, follow
the PROD file and **ask permission** before starting `prod-redshift_cleanup_tables`.
Always re-scan `{env}-ETLJobControl` for `audit_job_component_keys`.

After prod reload + compare (test SQL → prod Redshift), write/update
`fixes/{dim}/final_prod_results.md` as **Jira-paste ready**:

1. First line: `# PASTE INTO JIRA (DE-XXXX) — copy everything below this line`
2. Body under that line is **Betfred-facing only** — compare pair, window,
   presence table, vs-DEV if useful, short context, **PASS/FAIL verdict**
3. **No** Cursor paths, skill names, **Place 1/2/3 labels**, or local tooling
4. Use headings **“DEV validation”** / **“Post-deploy prod validation”** (see
   `dimension-validate` § Jira comments)
5. When user asks to update Jira: post via MCP with the same wording (not
   “Place 3”)

---

## PROD hard rule (mandatory)

**Never run, start, or mutate anything in prod without an explicit yes for that
step** — not even Glue job starts, DynamoDB deletes, or Redshift DROP.

When the user says *“watermark reset and drop redshift table in prod”* (or
similar):

1. Confirm dim / gold table / Glue job name
2. Re-scan `prod-ETLJobControl` for live `job_component_pk`
3. Show **only** the four cleanup parameters (below) — **not** the flag trio
4. State: prod reload is **DROP + audit wipe via cleanup job defaults** — **no backup** unless the user explicitly asks
5. Ask: *“OK to run `prod-redshift_cleanup_tables` with these four params?”*
6. Only after yes: start the job (or give console values to paste)
7. After success: optional upstream dim, then target job **≥ 2×**
8. Validate with **test SQL → prod Redshift** only when they ask

**Always resolve `audit_job_component_keys` from DynamoDB** (`{env}-ETLJobControl`)
— scan for the dim’s `job_name` / SUCCESS rows and use the live
`job_component_pk`. Do not guess from payment_method’s “both sides match”
pattern. Re-scan before every prod cleanup.
Do **not** use the DEV Data API secret / `dev` profile against prod. Do **not**
hand-run `DROP TABLE` or DynamoDB `update-item` in prod unless the user
explicitly rejects the cleanup job and asks for the manual path.

---

## PROD: `prod-redshift_cleanup_tables` (preferred)

Glue job in **etl-common** (script `src/cleanup_jobs/redshift_cleanup_tables.py`):
`{env}-redshift_cleanup_tables` → in prod: **`prod-redshift_cleanup_tables`**.

### Glue job defaults — do **not** override unless the user asks

Terraform `default_arguments` on the cleanup job already set:

| Parameter | Default | Effect |
|---|---|---|
| `delete_audit_entries` | **`true`** | Deletes **all** DynamoDB control rows for `audit_job_component_keys` |
| `drop_redshift_table` | **`true`** | `DROP TABLE {schema}.{table}` (Glue recreates on next dim run — **no empty CREATE**) |
| `truncate_redshift_table` | **`false`** | Truncate instead of drop — leave at default when dropping |

**Hard rule:** when starting `prod-redshift_cleanup_tables`, set **only** the
four dimension-specific parameters below. Do **not** pass
`delete_audit_entries`, `drop_redshift_table`, or `truncate_redshift_table`
unless the user explicitly wants a different mode (e.g. truncate-only, keep
audit rows).

### Parameters you set (per dimension)

Re-scan `prod-ETLJobControl` for the live `job_component_pk` before every run.

| Parameter | Value |
|---|---|
| `audit_job_name` | `prod_uk_digital_dimension_{name}` |
| `audit_job_component_keys` | `{resolved job_component_pk prefix}` — see below |
| `schema` | usually `dimension` |
| `tables` | gold table name only (no schema), e.g. `session_history` |

Leave all other job args (`control_table`, `redshift_connection`, and the
three flag defaults above) as the Glue job’s **DefaultArguments**.

**Component key shape varies by job** — always resolve from DynamoDB scan,
not from a sibling dim. Examples:

| Dimension | `audit_job_component_keys` |
|---|---|
| `session_history` | `prod_uk_digital_dimension_session_history#prod_uk_digital_dimension_session_history#session_history` |
| `deposit_limit_history` | `prod_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history` |

### Worked example — `session_history` (DE-9567)

| Parameter | Value |
|---|---|
| Glue job to run | `prod-redshift_cleanup_tables` |
| `audit_job_name` | `prod_uk_digital_dimension_session_history` |
| `audit_job_component_keys` | `prod_uk_digital_dimension_session_history#prod_uk_digital_dimension_session_history#session_history` |
| `schema` | `dimension` |
| `tables` | `session_history` |

*(Flags omitted — job defaults: delete audit + drop table.)*

After cleanup succeeds:

1. Run `prod_uk_digital_dimension_session_history` **≥ 2 times** (defaults only)
2. Compare **test SQL → prod Redshift**, April 2024 (or agreed window)

### Legacy parameter mapping note

Older runbooks listed `delete_audit_entries` / `drop_redshift_table` /
`truncate_redshift_table` on every example — that duplicated Terraform
defaults. Only document them when overriding.

### Worked example — `deposit_limit_history` (DE-9556)

Component is **`uk_digital_dimension_deposit_limit_history`** (not `prod_…`
after `#` — unlike session_history):

| Parameter | Value |
|---|---|
| Glue job to run | `prod-redshift_cleanup_tables` |
| `audit_job_name` | `prod_uk_digital_dimension_deposit_limit_history` |
| `audit_job_component_keys` | `prod_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history` |
| `schema` | `dimension` |
| `tables` | `deposit_limit_history` |

After cleanup succeeds:

1. Run `prod_uk_digital_dimension_player` (or confirm player is current)
2. Run `prod_uk_digital_dimension_deposit_limit_history` **≥ 2 times**
3. Compare **test SQL → prod Redshift**, April 2024 (or agreed window)

---

## DEV deploy / full reload gate (mandatory)

Use this for **every** DEV dimension reload before / when merging the feature
branch to `dev`. **Ask the user for permission before each step** — never chain
DROP → watermark → merge without an explicit yes for that step.

**Env:** AWS profile `dev` only. Never use prod `.env` / prod Redshift for this
gate. Gold table is typically `uk_digital.dimension.{table}`.

### DEV Redshift connection (always)

For **all** DEV count / DROP against Redshift, use the
Redshift Data API with Secrets Manager — **never** IAM-only Data API and
**never** print secret values.

| Field | Value |
|---|---|
| AWS profile | `dev` |
| Region | `eu-west-2` |
| Cluster | `dev-redshift-cluster` |
| Database | `uk_digital` |
| Secret name | `redshift!dev-redshift-cluster-admin_user` |

Do **not** fall back to `public` schema. If the secret fails, stop and ask.

### Ordered steps (stop and wait after each)

| Step | Action | Ask first |
|---|---|---|
| **0** | Confirm dim, Glue job, gold table | Yes |
| **0b** | Quality gate: ruff + ty on touched Glue `.py` | Yes |
| **1** | Scan DynamoDB last SUCCESS watermark | Yes |
| **1b** | **BACKUP** gold → `dimension.{table}_bak_YYYYMMDD` (CTAS) | Yes — **mandatory on DEV** |
| **2** | **DROP** gold (`uk_digital.dimension.{table}`) | Yes — only after backup exists |
| **3** | Epoch watermark on SUCCESS row **or** `dev-redshift_cleanup_tables` | Yes |
| **4** | Merge / deploy to `dev` if user asks (TF/code only — no Glue param overrides) | Yes |
| **5+** | User runs Glue with **defaults** ≥2× (job recreates gold if missing); validate | Inform / Yes |

### DEV backup (HARD RULE)

**Always** take a Redshift backup **before** DROP on DEV. Do not skip unless
the user explicitly says “skip backup” for that run.

```sql
-- DEV only — Data API / uk_digital
CREATE TABLE dimension.{table}_bak_YYYYMMDD AS
SELECT * FROM dimension.{table};
-- Verify COUNT(*) on bak ≈ gold, then DROP dimension.{table}
```

Naming: `dimension.{table}_bak_YYYYMMDD` (e.g. `casino_pending_bonus_bak_20260909`).
If gold is empty / missing, note that and proceed — no bak required.

**Do not** CREATE empty gold outside Glue after DROP — rule
`glue-gold-create-via-job-only`. Job tip must use `redshift_recreate` (or
equivalent) when the target is missing.

### Hard rules

1. Permission every step (or explicit “yes to all …”).
2. **DEV: BACKUP then DROP** (mandatory). **PROD: no backup** unless the user
   explicitly asks (cleanup job / post-merge default).
3. After DROP: **do not** CREATE empty gold via Data API / console. The
   Glue job must recreate (`redshift_recreate` when missing). See
   `glue-gold-create-via-job-only`.
4. DEV secret only for DEV; never dump secrets.
5. Git bare push/commit → data-jobs repo only.
6. Skills/rules only under `Cursor/.cursor/`.
7. **PROD:** `prod-redshift_cleanup_tables` or manual DROP + epoch — ask
   before every prod action. **No backup** unless user asks.
8. Pre-deploy quality gate before merge to `dev` / Jenkins.
9. **Never** start or instruct a Glue run with **manual parameter
   overrides** (console Default parameters, or
   `aws glue start-job-run --arguments …`). Fix TF/code → Jenkins apply →
   user runs with defaults. See rule `glue-no-manual-job-param-overrides`.
10. **Do not** start Glue jobs for the user unless they explicitly ask the
    agent to start one; default is watermark/DROP only, then they run the
    job.

## When to reset

- After DROP of Redshift gold
- After MERGE-key / incremental logic change needing full reload
- User asks: *"reset watermark"* / *"drop redshift in prod"*

## How watermarks work

- `{env}-ETLJobControl`
- `get_last_success_time(component)` → latest SUCCESS `audit_sequence_time`
- DEV manual reset: `1970-01-01 00:00:00.000000`
- PROD cleanup: deletes all audit rows for the component key

## Identify job keys

1. Glue `JOB_NAME` → e.g. `prod_uk_digital_dimension_deposit_limit_history`
2. Component from `log_job_status(...)` — often `stored_procedure_name` without
   env prefix; sometimes full JOB_NAME (customer_payment_method)
3. Document in `fixes/{dim}/dev_redshift_and_watermark_reset.md` and
   `fixes/{dim}/prod_redshift_and_watermark_reset.md`
4. After prod validate: `fixes/{dim}/final_prod_results.md`

## Critical pitfall

Manual path: **do not** reset the latest NODATA row. Cleanup job deletes **all**
entries for the component — intentional for prod full reload.

## Related

- `dimension-pr` / `dimension-validate`
- etl-common: `src/cleanup_jobs/redshift_cleanup_tables.py`
- After DROP / epoch / Glue runs: tick
  `fixes/.../delivery_checklist.md` same turn (rule
  `dimension-delivery-order` § Delivery checklist)
