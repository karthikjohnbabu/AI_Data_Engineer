# Prod cleanup job — four parameters only

When running **`prod-redshift_cleanup_tables`** for a dimension gold reload:

## Set only these (per dimension)

| Parameter | Example (session_history) |
|---|---|
| `audit_job_name` | `prod_uk_digital_dimension_session_history` |
| `audit_job_component_keys` | Re-scan `prod-ETLJobControl` — e.g. `prod_uk_digital_dimension_session_history#prod_uk_digital_dimension_session_history#session_history` |
| `schema` | `dimension` |
| `tables` | `session_history` |

## Do **not** pass unless user explicitly overrides

Glue Terraform defaults (`etl-common` `redshift_cleanup_tables.tf`):

- `delete_audit_entries` = **`true`**
- `drop_redshift_table` = **`true`**
- `truncate_redshift_table` = **`false`**

Do not list or re-set these three in runbooks, PR post-merge ops, or when
starting the job — duplicates noise and invites wrong overrides.

## After cleanup

Run the prod dimension Glue job **≥ 2×** (defaults only). Glue recreates gold;
no manual CREATE. No backup unless user asks.

Skill: `dimension-watermark-reset`.
