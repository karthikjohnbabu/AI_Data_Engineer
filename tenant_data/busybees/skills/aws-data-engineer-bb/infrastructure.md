# Infrastructure Reference — Busy Bees × Famly

## S3 Buckets

| Purpose | DEV | UAT |
|---------|-----|-----|
| Artifacts | `dev-bb-famly-migration-artifacts` | `uat-bb-famly-migration-artifacts` |
| Data | `dev-bb-famly-migration` | `uat-bb-famly-migration` |
| Archive | `dev-bb-famly-migration-archive` | `uat-bb-famly-migration-archive` |

## Key S3 Paths

- Scripts: `[artifacts-bucket]/midlothian/glue/scripts/`
- Common libs: `[artifacts-bucket]/midlothian/glue/common/data_ops.zip`
- Config: `[artifacts-bucket]/midlothian/glue/common/config/base/[env]_midlothian_config.yaml`
- Curated data: `[data-bucket]/midlothian/curated/[domain]/`
- Famly reverse data: `[data-bucket]/midlothian/famly/famly_[domain]/` (dated subfolders after SF archive)
- Analytics output: `[data-bucket]/analytics/dim_[domain]/`
- Pre-fix archive: `[archive-bucket]/midlothian/Analytics/[domain]/`

## Glue Jobs (DEV → UAT pattern)

Replace `[env]` with `dev_midln` or `uat_midln`:

- `[env]_midln_centre_s3_curated_to_analytics_export`
- `[env]_midln_centre_s3_famly_curated_to_analytics_export`
- `[env]_midln_parent_s3_curated_to_analytics_export`
- `[env]_midln_parent_s3_famly_curated_to_analytics_export`
- `[env]_midln_child_s3_curated_to_analytics_export`
- `[env]_midln_child_s3_famly_curated_to_analytics_export`
- `[env]_midln_room_s3_curated_to_analytics_export`
- `[env]_midln_room_s3_famly_curated_to_analytics_export`
- `[env]_midln_bill_payer_s3_curated_to_analytics_export`
- `[env]_midln_bill_payer_s3_famly_curated_to_analytics_export`
- `[env]_midln_health_s3_curated_to_analytics_export` (curated only; no famly reverse as of Aug 2026)
- `[env]_midln_move_s3_to_s3` (archive step in Step Functions)
- `[env]_midln_copy_s3_to_s3`

DEV curated export jobs should be **JobMode=NOTEBOOK** (child is the pattern). CDK creates them as SCRIPT — convert after deploy. Glue still **runs** the S3 `.py`.

Repo source files use `dev_` prefix only; CDK pipeline renames at deploy.

## Glue Notebooks (unit test / in-place fix jobs)

- `dev_unit_test_midln` — DEV Midlothian unit-test / truncate notebook (Aug 2, 2026)
  - Role: **`dev-midln-data-lake-role`**
  - Script: `s3://bb-dev-code-repository/glue/scripts/dev_unit_test_midln.py`
- `uat_unit_test_midln` — UAT in-place fix notebook (July 2026, active)
  - Role: `uat-bb-midln-famly-migration-data-lake-role`
- `uat_unit_test` — older UAT notebook, uses `uat_glue_rds_s3_access_role`
- `dev_unit_test` — older DEV notebook, uses `dev_glue_rds_s3_access_role`
- `mask_data_in_dev` — DEV masking notebook
- `mask_data_frm_uat` — UAT masking notebook
- `mask_data_test_explr` — masking explorer notebook

## Crawlers

| Env | Curated crawler | Analytics crawler |
|-----|-----------------|-------------------|
| DEV | `dev_bb_midln_s3_curated_crawler` | `dev_bb_midln_s3_analytics_crawler` |
| UAT | `uat_bb_midln_s3_curated_crawler` | `uat_bb_midln_s3_analytics_crawler` |

Curated crawler paths include both `midlothian/curated/*` and `midlothian/famly/famly_*`.

## Athena Databases

| Env | Curated DB | Analytics DB |
|-----|------------|--------------|
| DEV | `dev_bb_midln_s3_curated` | `dev_bb_midln_s3_analytics` |
| UAT | `uat_bb_midln_s3_curated` | `uat_bb_midln_s3_analytics` |

Dimension tables: `dim_centre`, `dim_room`, `dim_child`, `dim_parent`, `dim_bill_payer`, `dim_health`

### Child health (Midlothian)

- **Where:** Athena `{env}_bb_midln_s3_analytics.dim_health` → S3 `…/analytics/dim_health/`
- **Source drop:** `midlothian/curated/health/*.csv` → `{env}-midln-health-workflow`
- **Not** on `dim_child`, **not** in Redshift DWH, **no** famly reverse for health
- Key: `old_famly_child_id`; fields include allergies, vaccines, doctor/dentist, diet, etc.

### Learning journal / photo paths (on `dim_child`)

- Set in curated child job from `old_famly_child_id` only (no S3 folder-exists check)
- Photo: `s3://{stage}-bb-famly-migration/midlothian/raw/child/images/{id}.jpg`
- Journal: `s3://{stage}-bb-famly-migration/midlothian/raw/child/learning_journal/{id}/`
- Famly reverse job excludes both path columns from SCD2 compare (preserves them)

### Parent / analytics dim status (Aug 2, 2026 evening)

- Scripts: wide curated + composite famly SCD2 (`old_famly_parent_id` + `old_famly_child_id`) live via CI/CD
- UAT curated: `s3://uat-bb-famly-migration/midlothian/curated/parent/` — **empty** (sample removed)
- UAT analytics: `dim_parent` — **0 rows**, ~60-col schema ready
- DEV analytics: all 5 dims (`dim_centre/room/child/parent/bill_payer`) — **0 rows** after Prasath truncate (schema kept)
- Truncate archive: `…/Analytics/<domain>/2026-08-02_truncate/`
- DEV notebook: `dev_unit_test_midln` → role `dev-midln-data-lake-role`
- Older archives: `…/Analytics/parent/2026-07-31_12-37/` (DEV), `…/Analytics/parent/2026-07-31_13-54/` (UAT)

## SSM Parameters

- `/config/dev_midln` → dev config yaml in S3
- `/config/uat_midln` → uat config yaml in S3

## IAM Roles

- **`dev-midln-data-lake-role`** — main DEV Midlothian Glue / notebook role
  (used by `dev_midln_*` jobs and `dev_unit_test_midln`)
  - Do NOT use `dev-bb-midln-famly-migration-data-lake-role` — **does not exist** in account
- `uat-bb-midln-famly-migration-data-lake-role` — main UAT project role
  - Policy: `FamlyMigrationDataLakeRoleDefaultPolicyB90FE6F7` (customer inline)
  - Includes `glue:TagResource` (added July 26, 2026) for interactive sessions
- `dev_glue_rds_s3_access_role` — older DEV role used by `dev_unit_test` notebook
- `uat_glue_rds_s3_access_role` — older UAT role used by `uat_unit_test` notebook

## Step Functions

- Normal: `{stage}-midln-{domain}-workflow` (e.g. `uat-midln-centre-workflow`, `dev-midln-centre-workflow`)
- Famly reverse: `{stage}-midln-famly-{domain}-workflow` (e.g. `uat-midln-famly-parent-workflow`)

Workflow steps: Set Default Parameters → Glue (curated/famly export) → Glue (move/archive) → StartCrawler (analytics)

### DEV Midlothian SFs (created Aug 3, 2026 — CLI; CDK DEV pipeline still off)

Normal: `dev-midln-centre-workflow`, `dev-midln-room-workflow`, `dev-midln-child-workflow`, `dev-midln-parent-workflow`, `dev-midln-bill-payer-workflow`, `dev-midln-health-workflow`  
Famly: `dev-midln-famly-centre-workflow`, `dev-midln-famly-room-workflow`, `dev-midln-famly-child-workflow`, `dev-midln-famly-parent-workflow`, `dev-midln-famly-bill-payer-workflow`  
Role: `dev-midln-data-lake-role`  
(Older legacy: `dev-bb-midln-child-famly-pipeline`, `dev-bb-midln-parent-famly-pipeline` still exist)

## EventBridge Schedules (UTC base; UAT +30 min offset)

| Workflow | Hour | Minute |
|----------|------|--------|
| centre | 3 | 0 |
| room | 3 | 30 |
| child | 4 | 0 |
| parent | 5 | 0 |
| bill-payer | 6 | 0 |
| health | 6 | 30 |
| famly-child | 7 | 0 |
| famly-parent | 8 | 0 |
| famly-bill-payer | 9 | 0 |

**What Midlothian CDK controls vs CLI:**

| Piece | In CDK (`midln_event_bridge_stack`)? |
|-------|--------------------------------------|
| Daily Step Function **cron** schedules | **Yes** (UAT; keep DISABLED for S3-triggered domains) |
| S3 Object Created **rules** (`*-s3-trigger`) | **No** — CLI only (DEV + UAT) |
| Bucket **EventBridge notifications** on `*-bb-famly-migration` | **No** — CLI/`put-bucket-notification-configuration` only |

**DEV vs UAT triggers (important):**

- **UAT + DEV:** S3 Object Created rules (CLI): curated `*-curated-s3-trigger`, famly `*-famly-*-s3-trigger`
- **UAT CDK crons:** must stay **DISABLED** so deploy does not turn batch back on
- Health DEV trigger: `dev-midln-health-curated-s3-trigger` (Aug 15)
- **21 Aug:** Both `dev-bb-famly-migration` and `uat-bb-famly-migration` had **no** `EventBridgeConfiguration` (only landing-child Lambda). Re-enabled EventBridge while keeping that Lambda. Without it, S3 triggers never fire.

**Gap:** No EventBridge schedule for `famly-room` — confirm with Prasath if intentional.

## Redshift (DWH / Serverless) — secrets & users (Aug 21, 2026)

Workgroups: `dev-wg-bb-redshift`, `uat-wg-bb-redshift`, `prod-wg-bb-redshift` (eu-west-2).

| Secret | Typical Glue connection | DB user | Purpose |
|--------|-------------------------|---------|---------|
| `dev/redshift` | `dev_redshift_connection` (`SECRET_ID`) | `glue_user` | Glue / pipeline write; Lambda Data API via `SecretArn` |
| `uat/redshift` | `uat_redshift_connection` | `glue_user` | Same for UAT |
| `prod/redshift` | `prod_redshift_connection` | `glue_user` | Same for PROD |
| *(not a secret path for Power BI)* | — | `report_user` | Read-only for Power BI embed — credentials shared separately |

**Verified 21 Aug:** ~93 DEV `dwh`/`rreplica` Glue jobs use `dev_redshift_connection` → secret **`dev/redshift`**.

**Akhilesh / Lambda (Prasath guidance):**
- Do not point Lambda at Power BI `report_user` details when using `SecretArn=dev/redshift`
- Error `password authentication failed for user "glue_user"` = secret resolved to glue_user but auth/IAM wrong — fix Lambda IAM to Redshift + secret; do not casually change policies mid-call
- Keep pipeline secrets standard across envs (`{stage}/redshift`)
