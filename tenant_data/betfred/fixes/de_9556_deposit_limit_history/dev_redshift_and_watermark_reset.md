# DEV — Redshift drop + DynamoDB watermark reset — deposit_limit_history

Runbook for DEV full reload / watermark reset for DE-9556.

**Jira:** DE-9556  
**Glue job:** `dev_uk_digital_dimension_deposit_limit_history`  
**Gold:** `uk_digital.dimension.deposit_limit_history`  
**Control table:** `dev-ETLJobControl`  
**AWS profile / region:** `dev` / `eu-west-2`

Sibling PROD runbook: `prod_redshift_and_watermark_reset.md`  
Skill: `Cursor/.cursor/skills/dimension-watermark-reset/SKILL.md`

---

## How the watermark works

The Glue job calls `JobStatusHandler.get_last_success_time(stored_procedure_name)`.
That queries the **latest SUCCESS row** for this job component and returns
`audit_sequence_time` (falls back to `start_time` if null).

```sql
WHERE pdl.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
```

Resetting `audit_sequence_time` to `1970-01-01 00:00:00.000000` forces a
**full Iceberg re-read** on the next run (after gold is dropped).

---

## Job identifiers

| Field | Value |
|---|---|
| DynamoDB `job_name` | `dev_uk_digital_dimension_deposit_limit_history` |
| Component (`stored_procedure_name`) | `uk_digital_dimension_deposit_limit_history` |
| `job_component_pk` | `dev_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history` |

Component has **no** `dev_` prefix after `#` (unlike `customer_payment_method`,
where both sides of `#` match the full JOB_NAME). Still re-scan before reset.

---

## DEV full reload gate (ask before each step)

1. Quality gate on touched Glue `.py` (`ruff` / `ty`)
2. Scan last SUCCESS watermark (read-only)
3. Backup: `dimension.deposit_limit_history_{YYYYMMDD}` (today’s date)
4. Show gold + backup `COUNT(*)` — wait for user OK
5. `DROP TABLE dimension.deposit_limit_history` only (keep backup)
6. **Do not CREATE empty gold** — Glue recreates on next run
7. Reset SUCCESS `audit_sequence_time` to epoch **or** run
   `dev-redshift_cleanup_tables` with the same param pattern as prod
8. Deploy / merge to `dev` if needed
9. Run player then deposit limit history **≥ 2×**
10. Compare **test SQL → DEV Redshift**

DEV Redshift: Data API + secret `redshift!dev-redshift-cluster-admin_user`
(cluster `dev-redshift-cluster`, DB `uk_digital`). Never dump the secret.

---

## Read watermark (scan only)

### Last SUCCESS

```bash
aws dynamodb scan \
  --profile dev \
  --region eu-west-2 \
  --table-name dev-ETLJobControl \
  --filter-expression "job_name = :job AND #st = :success" \
  --expression-attribute-names '{"#st": "status"}' \
  --expression-attribute-values '{
    ":job": {"S": "dev_uk_digital_dimension_deposit_limit_history"},
    ":success": {"S": "SUCCESS"}
  }' \
  --output json \
| jq '.Items | sort_by(.start_time.S) | last | {
    start_time: .start_time.S,
    audit_sequence_time: .audit_sequence_time.S,
    job_component_pk: .job_component_pk.S,
    status: .status.S
  }'
```

---

## Manual watermark reset (epoch)

**Do not reset the latest NODATA row.** Reset the **SUCCESS** row.

```bash
aws dynamodb update-item \
  --profile dev \
  --region eu-west-2 \
  --table-name dev-ETLJobControl \
  --key '{
    "job_component_pk": {"S": "dev_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history"},
    "start_time": {"S": "<SUCCESS_start_time_from_scan>"}
  }' \
  --update-expression "SET audit_sequence_time = :ast" \
  --expression-attribute-values '{
    ":ast": {"S": "1970-01-01 00:00:00.000000"}
  }'
```

Ask permission before `update-item`. Re-scan to confirm epoch.

---

## Optional: `dev-redshift_cleanup_tables`

Same shape as prod; resolve keys from `dev-ETLJobControl` first:

| Parameter | Typical value |
|---|---|
| `audit_job_name` | `dev_uk_digital_dimension_deposit_limit_history` |
| `audit_job_component_keys` | `dev_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history` |
| `schema` | `dimension` |
| `tables` | `deposit_limit_history` |
| `delete_audit_entries` | `true` |
| `drop_redshift_table` | `true` |
| `truncate_redshift_table` | `false` |

Prefer the **manual backup → counts → DROP → epoch** gate when validating in
DEV so a dated backup is kept.
