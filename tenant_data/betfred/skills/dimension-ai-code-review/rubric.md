# Review rubric — dimension AI Code Review (PR)

Mirrors `data-platform-ai-review` **`docs/rubric-data-platform.md`** (v0.2.0)
plus dim/fact checks the agentic Jenkins bot hits via this repo’s `CLAUDE.md`.

CI already runs ruff / SQLFluff / terraform fmt / tflint / Checkov /
detect-secrets — **do NOT report formatting, line-length, import-order, or
style nits**. Focus on what those cannot catch:

## From packaged data-platform rubric

- **Correctness & logic** — edge cases, error handling, null/empty handling,
  **idempotency** (jobs safely re-runnable).
- **Reuse over reinvention** — before accepting a new helper, check siblings
  for `from utilities.<module> import ...` (`redshift_fetch`, `redshift_sync`,
  `redshift_delete`, `glue_spark_config.configure_spark`, …). Flag local
  re-wraps of `create_dynamic_frame.from_options(... "redshift" ...)` and
  helpers copy-pasted across files in the same PR.
- **Glue / job renames** — renaming breaks **DynamoDB watermark** / Step
  Functions → reprocessing + cost. Flag renames without migration/runbook.
- **Job dependencies & ordering** — EventBridge / Step Function order;
  enrichment before consumers.
- **Data correctness (Iceberg)** — partitioning, schema evolution,
  merge/upsert keys, predicate pushdown.
- **Terraform** — matching `.tf`; no hardcoded env/account; idempotent.
- **Security** — no secrets; least-privilege IAM; safe SQL; PII care.
- **Config** — `{env}` placeholders; no hardcoded `dev`/`prod`.

## Dim / fact extras (CLAUDE.md + bot lessons)

- **INNER JOINs silently delete rows** — every INNER onto a reference/link
  table; LEFT JOIN unsafe if NULL keys feed a later INNER / WHERE / GROUP BY.
- **Sentinel keys (`-1`)** — history fetch / window / LAG-LEAD must not pull
  or partition the whole unmatched cohort under a shared sentinel.
- **MERGE / delete grain** — aligned with TF `--primary_keys`.
- **Timezone** — UTC vs `Europe/London` for `is_current` / “now” comparisons
  when matching legacy GETDATE()-local behaviour.
- **DDL before read/write** — new gold columns (e.g. `customer_id_legacy`)
  need DBA DDL before deploy or fetch/sync fails.
- **Shared Spark** — `configure_spark` / `create_glue_runtime`; no hand-rolled
  Iceberg catalog SparkConf.
- **Testing evidence** — PR description should show runs/compare; note missing
  evidence as warn (bot does).

## Infra ↔ Glue coupling (agentic — HIGH when missed)

When the diff adds or changes any of these in Glue, **read the matching `.tf`
and grep siblings** before approving:

| Glue pattern | TF / ops check | Why |
|---|---|---|
| `delete_from_redshift` | `max_concurrent_runs = 1` on the Glue job | Fixed staging table name (`staging_delete_<target>`); overlapping runs truncate each other's keys → DELETE no-ops, MERGE still writes. **Reference:** `uk_digital_dimension_time_spent.tf` + comment block ~653–659 in `uk_digital_dimension_time_spent.py`; `session_history` DE-9567. |
| `delete_from_redshift` | Staging key columns match delete grain in `.py` | Wrong keys → partial delete or wrong rows removed |
| `configure_spark` / `create_glue_runtime` | `--catalog_name` = `awsdatacatalog` in TF | Mismatch → `REQUIRES_SINGLE_PART_NAMESPACE` |
| `redshift_sync` + new output columns | Liquibase / gold DDL in target env | Fetch or sync fails on missing column |
| Job rename | DynamoDB watermark / Step Function input | Silent full reprocess |

**Do not** assume `var.dimension_builder_max_concurrent_runs` (default **100**)
is safe — most UK Digital dimension `.tf` files hardcode `= 1`; jobs that call
`delete_from_redshift` **must** hardcode `= 1`.

Report every issue with severity + confidence; cite file and line. Human
triages afterwards.
