# DEV — Redshift drop + DynamoDB watermark reset — session_history

Runbook for DEV full reload / watermark reset for DE-9567.

**Jira:** DE-9567  
**Glue job:** `dev_uk_digital_dimension_session_history`  
**Gold:** `uk_digital.dimension.session_history`  
**Control table:** `dev-ETLJobControl`  
**AWS profile / region:** `dev` / `eu-west-2`

---

## Job identifiers

| Field | Value |
|---|---|
| DynamoDB `job_name` | `dev_uk_digital_dimension_session_history` |
| `stored_procedure_name` (TF arg) | `session_history` |
| Component passed to handler | `dev_uk_digital_dimension_session_history#session_history` |
| `job_component_pk` (live) | `dev_uk_digital_dimension_session_history#dev_uk_digital_dimension_session_history#session_history` |

`JobStatusHandler` prefixes `job_name#` onto the component, so the pk is
**triple**-segmented. Always re-scan before reset.

---

## 2026-08-27 reload (skip backup — user option 2)

| Step | Result |
|---|---|
| Pre-drop gold count | 135,277,265 |
| Backup | **skipped** (user choice) |
| `DROP TABLE dimension.session_history` | FINISHED |
| Epoch on latest SUCCESS | `start_time=2026-08-27 08:19:27.270818` → `audit_sequence_time=1970-01-01 00:00:00.000000` |
| Table gone check | `information_schema` count = 0 |
| TF `--catalog_name` | `awsdatacatalog` committed `b6240a19`, merged+pushed `dev` (`cfb3359c`) — **Jenkins apply required** |
| Empty gold CREATE | **removed** — job recreates via `redshift_recreate` when missing |
| Glue starts | **User only**, after Jenkins apply of job tip + TF catalog, **defaults** |

Next: Jenkins apply `dev` → run `dev_uk_digital_dimension_session_history` ≥2× with defaults → Place 2.

---

## Manual watermark reset (epoch)

**Do not reset the latest NODATA row.** Reset the **SUCCESS** row.

```bash
aws dynamodb update-item \
  --profile dev \
  --region eu-west-2 \
  --table-name dev-ETLJobControl \
  --key '{
    "job_component_pk": {"S": "dev_uk_digital_dimension_session_history#dev_uk_digital_dimension_session_history#session_history"},
    "start_time": {"S": "<SUCCESS_start_time_from_scan>"}
  }' \
  --update-expression "SET audit_sequence_time = :ast" \
  --expression-attribute-values '{
    ":ast": {"S": "1970-01-01 00:00:00.000000"}
  }'
```

DEV Redshift: Data API + secret `redshift!dev-redshift-cluster-admin_user`
(cluster `dev-redshift-cluster`, DB `uk_digital`). Never dump the secret.
