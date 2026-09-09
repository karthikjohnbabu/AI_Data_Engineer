# PROD — Redshift drop + watermark reset — deposit_limit_history

**Always ask permission before any prod action** (Glue start, DynamoDB delete,
Redshift DROP). Never auto-run.

**Jira:** DE-9556  
**Preferred tool:** Glue job `prod-redshift_cleanup_tables`  
  (etl-common `src/cleanup_jobs/redshift_cleanup_tables.py`)  
**Dim Glue job:** `prod_uk_digital_dimension_deposit_limit_history`  
**Gold:** `uk_digital.dimension.deposit_limit_history`  
**Control table:** `prod-ETLJobControl`  
**AWS profile / region:** `prod` / `eu-west-2`

Sibling DEV runbook: `dev_redshift_and_watermark_reset.md`

---

## Resolve `audit_job_component_keys` from DynamoDB (mandatory)

Do **not** guess from another dim’s shape. Scan first:

```bash
aws dynamodb scan \
  --profile prod \
  --region eu-west-2 \
  --table-name prod-ETLJobControl \
  --filter-expression "contains(job_name, :frag) OR contains(job_component_pk, :frag)" \
  --expression-attribute-values '{
    ":frag": {"S": "deposit_limit_history"}
  }' \
  --projection-expression "job_name, job_component_pk, #st, start_time, audit_sequence_time" \
  --expression-attribute-names '{"#st": "status"}' \
  --output json \
| jq '
  .Items
  | group_by(.job_component_pk.S)
  | map({
      job_component_pk: .[0].job_component_pk.S,
      job_name: .[0].job_name.S,
      n: length,
      last_success: ([.[] | select(.status.S == "SUCCESS")] | sort_by(.start_time.S) | last | {
        start_time: .start_time.S,
        audit_sequence_time: .audit_sequence_time.S
      })
    })
'
```

Use the row whose `job_name` is
`prod_uk_digital_dimension_deposit_limit_history`.  
Ignore older builder keys for `uk_digital_dimension_net_deposit_limit_history`.

**Confirmed 2026-08-25:**

| Field | Value |
|---|---|
| `job_component_pk` | `prod_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history` |
| Last SUCCESS | `2026-08-25 09:21:18.712812` |

Re-scan before every cleanup run.

---

## Glue console / start parameters

Job: **`prod-redshift_cleanup_tables`**

| Parameter | Value |
|---|---|
| `audit_job_name` | `prod_uk_digital_dimension_deposit_limit_history` |
| `audit_job_component_keys` | `prod_uk_digital_dimension_deposit_limit_history#uk_digital_dimension_deposit_limit_history` |
| `schema` | `dimension` |
| `tables` | `deposit_limit_history` |
| `delete_audit_entries` | `true` |
| `drop_redshift_table` | `true` |
| `truncate_redshift_table` | `false` |

Effects:

- Deletes **all** DynamoDB control rows for that `job_component_pk`
- `DROP TABLE dimension.deposit_limit_history`
- **No backup** — take a backup yourself if needed
- **No empty CREATE** — Glue recreates gold on the next dim run

---

## Agent flow (when user says prod drop + watermark reset)

1. Read this file
2. Re-scan DynamoDB; confirm `audit_job_component_keys`
3. Show the four core params (+ flags) to the user
4. Ask: *OK to start `prod-redshift_cleanup_tables` with these params?*
5. Only after explicit yes → start job (or user runs in console)
6. Confirm SUCCESS in Glue
7. Remind: `prod_uk_digital_dimension_player` then
   `prod_uk_digital_dimension_deposit_limit_history` **≥ 2×**
8. Compare **test SQL → prod Redshift** only when asked

---

## After cleanup

1. Run player dim if needed  
2. Run deposit limit history **≥ 2 times**  
3. Validate April 2024 (or agreed window) as test SQL → prod RS  
