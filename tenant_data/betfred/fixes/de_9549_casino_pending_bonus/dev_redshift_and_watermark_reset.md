# DEV — Redshift drop + DynamoDB watermark reset — casino_pending_bonus

Runbook for DEV full reload / watermark reset for DE-9549.

**Jira:** DE-9549  
**Glue job:** `dev_uk_digital_dimension_casino_pending_bonus`  
**Gold:** `uk_digital.dimension.casino_pending_bonus`  
**Control table:** `dev-ETLJobControl`  
**AWS profile / region:** `dev` / `eu-west-2`

Skill: `Cursor/.cursor/skills/dimension-watermark-reset/SKILL.md`

---

## Why reload

Tip maps `bonus_bk` ← `template_code` (was `a.code`). Existing gold still
holds action-code BKs until DROP + full Iceberg re-read.

---

## Job identifiers (re-scanned 2026-09-08)

| Field | Value |
|---|---|
| DynamoDB `job_name` | `dev_uk_digital_dimension_casino_pending_bonus` |
| `job_component_pk` | `dev_uk_digital_dimension_casino_pending_bonus#dev_uk_digital_dimension_casino_pending_bonus` |
| Last SUCCESS `start_time` | `2026-08-19 13:47:01.503572` |
| Last SUCCESS `audit_sequence_time` | `2026-08-19 13:47:01.503572` |

Component: **both sides of `#` match full JOB_NAME** (same pattern as some
payment dims; unlike `deposit_limit_history`). Re-scan before every reset.

---

## Ordered gate (after Jenkins DEV apply)

1. Confirm S3 / Glue script tip has `template_code AS bonus_bk`
2. **BACKUP** gold → `dimension.casino_pending_bonus_bak_YYYYMMDD` (CTAS) —
   **mandatory on DEV** unless gold empty / user skips
3. **DROP** `uk_digital.dimension.casino_pending_bonus` — only after backup
4. **Do not CREATE** empty gold — Glue recreates
5. Reset SUCCESS watermark to epoch **or** `dev-redshift_cleanup_tables`
6. Run `dev_uk_digital_dimension_casino_pending_bonus` **≥ 2×** (defaults only)
7. Compare **test SQL → DEV Redshift** (BK intersection)

DEV Redshift: Data API + secret `redshift!dev-redshift-cluster-admin_user`
(cluster `dev-redshift-cluster`, DB `uk_digital`).

---

## Cleanup job params (optional instead of manual DROP + epoch)

| Parameter | Value |
|---|---|
| Glue job | `dev-redshift_cleanup_tables` |
| `audit_job_name` | `dev_uk_digital_dimension_casino_pending_bonus` |
| `audit_job_component_keys` | `dev_uk_digital_dimension_casino_pending_bonus#dev_uk_digital_dimension_casino_pending_bonus` |
| `schema` | `dimension` |
| `tables` | `casino_pending_bonus` |

Do **not** override the three flag defaults.

---

## Manual watermark reset (epoch)

**Do not reset the latest NODATA row.** Reset the **SUCCESS** row.

```bash
aws dynamodb update-item \
  --profile dev \
  --region eu-west-2 \
  --table-name dev-ETLJobControl \
  --key '{
    "job_component_pk": {"S": "dev_uk_digital_dimension_casino_pending_bonus#dev_uk_digital_dimension_casino_pending_bonus"},
    "start_time": {"S": "<SUCCESS_start_time_from_scan>"}
  }' \
  --update-expression "SET audit_sequence_time = :epoch" \
  --expression-attribute-values '{
    ":epoch": {"S": "1970-01-01 00:00:00.000000"}
  }'
```
