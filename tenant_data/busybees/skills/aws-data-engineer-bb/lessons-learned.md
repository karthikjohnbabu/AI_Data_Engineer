# Hard-Learned Lessons — Busy Bees × Famly

## Critical lessons checklist (always remember)

- CI/CD overwrites direct S3 uploads
- UUID reverse ids must be **string**, not bigint
- Rebuild from curated alone loses `new_famly_*` — reverse path is `midlothian/famly/{domain}/`
- Glue CSV crawler lowercases camelCase without underscores → need `_CRAWLER_COLUMN_ALIASES`
- Script deployed ≠ table schema updated until crawl + rebuild
- Archive before any analytics in-place change
- Karthik is on Windows PowerShell; prefer console steps; AWS profile `bb`
- **DEV Midlothian Glue role** = `dev-midln-data-lake-role` (NOT `dev-bb-midln-famly-migration-data-lake-role` — that name does not exist in DEV)
- Glue Notebook tab may show blank/wrong template; Save often greyed out — persist via S3 script upload
- DEV `dev_midln_move_s3_to_s3` must use `--extra-py-files` → `midlothian/glue/common/data_ops.zip` (not `midlothian/common/`)
- **S3 EventBridge notifications** on data buckets are CLI-only (not Midlothian CDK). If missing, all `*-s3-trigger` rules are dead
- **`dev/redshift` ≠ Power BI `report_user`** — Glue secret is `glue_user`; mixing causes password auth failures
- **Reverse CSV duplicate lines → SCD2 fan-out** (DTK-679): always `dropDuplicates` on the SCD2 business key(s) before the join; bill_payer curated + famly must use the same composite grain

---

## Reverse CSV duplicates → multiple current_flag=Y (DTK-679, Aug 21–22 2026)

**Symptom:** UAT `dim_bill_payer` had multiple `current_flag='Y'` for the same
`old_famly_bill_payer_id` + `old_famly_child_id` after reverse load.

**Root cause:** Duplicate lines in the reverse CSV + famly job joined without
deduping incoming rows → Spark fan-out on SCD2 join.

**Fix:** `dropDuplicates` on SCD2 key(s) before join in all Midlothian famly reverse
jobs (+ curated bill_payer). Warn in logs if rows dropped. Curated bill_payer SCD2
key aligned to composite (`old_famly_bill_payer_id` + `old_famly_child_id`) like famly.
Existing UAT duplicate currents still need archive + clean + re-run after a unique reverse file.

---

## DEV move job missing `data_ops.zip` (Aug 3, 2026)

Famly/curated Glue step SUCCEEDED; SF failed on move with LAUNCH ERROR 404 for
`s3://dev-bb-famly-migration-artifacts/midlothian/common/data_ops.zip`.
Real artifact is `midlothian/glue/common/data_ops.zip` (UAT layout). Fixed job arg + copied zip to old path.

## Parent phone null in analytics (Aug 3, 2026)

**Symptom:** Saravana — parent phone missing. Curated CSV has `+447987762340`;
`dim_parent.parent_mobile_number` is null (confirmed in Monday parquet).
Expired + current SCD2 rows both null → lost at **curated** load, not famly reverse.

**Same pattern:** CSV `priority=3` also null in analytics. Catalog types `priority` as
`bigint` but ApplyMapping declares source `string` → Glue cast fails → null.

**Root cause:** Parent curated `ApplyMapping` type coercion. Declared mapping types
must match Spark/DynamicFrame types; mismatches null the field. Phone (`+447…`) is
vulnerable to numeric/Choice inference; force-cast string sources before ApplyMapping.

**Prasath 07/o7 rule:** separate formatting rule (keep UK `07`/`o7` as-is). Not in code yet.
Do after phone actually lands in analytics.

**Fix:** In `dev_midln_parent_s3_curated_to_analytics_export.py`, before ApplyMapping,
cast all string-mapped source cols (esp. `parent_mobile_number`, `priority`) to
`StringType`. Optionally normalize phone (`+44`→`0`, leave `07`/`o7` unchanged).
DEV reload: archive → truncate dim_parent → curated job → crawler → famly reverse restore.

## Console Clone Gotcha — WASTED HOURS ON THIS

- Console "Clone job" on a notebook-type job copies job CONFIG but the Notebook tab shows a BLANK AWS template. This display is IRRELEVANT — the job runs the S3 `.py`.
- The real trap: the `.py` sitting in S3 may be the WRONG script (e.g. centre content under a bill_payer filename). Symptom: log shows `Added default argument: --domain = famly_centre` when you expected `famly_bill_payer`, then `No configuration found for job ... in domain 'famly_centre'`.
- ALWAYS verify S3 content with `Select-String "domain"` at the START — one check saves hours. The job was never broken; the S3 file was wrong.
- CLI upload is more reliable than console notebook upload for testing; CI/CD is still the proper deploy path.

## CI/CD Overwrites Direct S3 Fixes (July 28, 2026)

Direct `aws s3 cp` is a TEST shortcut only. Next pipeline run OVERWRITES with old repo version. Prasath flagged: "that's not going through CI/CD right?" — always commit to `glue/jobs/dev_midln_*.py` and push.

## Centre & Room Reverse — bigint/UUID Trap (July 28, 2026)

Centre famly script had ids mapped as `bigint` but reverse file uses UUIDs. Casting UUID to bigint → NULL → SCD2 join matches null vs real UUID → 0 changed, silent no-op.

**Symptom:** "Incoming DataFrame count: 1" but "Changed records count: 0"

**Fix:** change both mappings to `"string"`. Re-ran → SCD2 fired correctly.

**Rule:** UUID/string ids MUST be declared string in schema_mappings. When reverse flow reads row but reports 0 changed, suspect type-cast mismatch on join key first.

Room reverse file (7 cols) worked with single key `old_famly_room_id` — room ids globally unique.

## Parent Reverse Schema Mismatch (July 30, 2026)

Parent reverse SF failed (SystemExit:1). Real error in CloudWatch driver log (`_g-...` stream): schema mismatch — incoming had 6 cols including `new_famly_centre_id` and `new_famly_child_id` but dim_parent only had `new_famly_parent_id`.

**Fix:** Parent CURATED script — chain `.withColumn("new_famly_centre_id", F.lit("NA"))` and `.withColumn("new_famly_child_id", F.lit("NA"))`; add both to excluded_columns. Deploy via CI/CD, rebuild from fresh curated data.

**Debugging:** For "SystemExit: 1", read CloudWatch driver log stream in Glue console (Runs → failed run → Error logs). CLI get-log-events may return empty.

**Fresh curated restore:** Saravanan reloads daily; use TODAY's dated archive folder (e.g. `curated/parent/2026-07-30_09-52/`).

## Running Reverse Flows via Step Functions (July 29, 2026)

UAT reverse flows orchestrated as Step Functions, not standalone Glue jobs.

State machines: `uat-midln-famly-{domain}-workflow`

Sequence: Set Default Parameters → Glue (famly export) → Glue (archive) → StartCrawler (analytics) → End

To run: Step Functions console → pick state machine → Start execution → leave default input → Start execution.

Config comes from SSM/yaml, not the input box.

## Rebuild Loses Reverse-Derived Columns (July 30, 2026)

Rebuilding dim from curated data ONLY wipes `new_famly_*` values already signed off via reverse flows — those ids come ONLY from famly reverse file, never curated.

**Before declaring masking/schema rebuild complete:** check `midlothian/famly/{domain}/` for dated reverse file. If SF already archived it, restore from dated subfolder (e.g. `famly_parent/2026-07-30_13-28/`), run curated crawler, re-run famly SF.

Reverse path is `midlothian/famly/{domain}/` — NOT `midlothian/curated/famly_{domain}/`.

## new_famly_child_id Gap (fixed July 27)

Comparison only includes columns in BOTH incoming and target. Target lacked `new_famly_child_id` → silently dropped by `align_schema` + `select(existing_df.columns)`.

**Fix:** Rebuild dim with column baked in via curated script (`new_famly_child_id='NA'`). Once column exists, famly comparison picks it up automatically.

**Coalesce behaviour:** When SCD2 fires, ALL incoming source values (including untriggered new ids) get written via coalesce(new, old).

## Column "Available in UAT" Means in the TABLE (July 28)

Deploying script alone is not enough. Must run normal curated flow so column exists live in dim table (NA values) before reverse can populate real values.

## Schema & Type Issues

- bigint vs string mismatch causes silent row drops in SCD2 join — verify source types match schema_mappings
- Curated legacy data may use bigint; Famly reverse UUID files need string
- After schema fix on existing dim, delete Delta and rebuild from scratch

## Glue Notebook Connections

- `%connections` must match exact connection name in Glue console
- Common error: `rds_sql_server_connections` vs `rds_sql_server_connection` (no 's')

## IAM for Interactive Sessions

`uat-bb-midln-famly-migration-data-lake-role` needs `glue:TagResource` on `arn:aws:glue:eu-west-2:058264393778:session/*` — missing caused `AccessDeniedException` on `CreateSession`.

## Zero Incoming Records

If Glue job runs but masking never triggers → check incoming DataFrame count. Count = 0 means no new curated records → use in-place notebook approach instead.

## UAT Famly Job Order Mistake

Running famly BEFORE curated gives wrong/incomplete schema. Always: curated first → verify schema → famly on top.

## DEV Test Data for Composite Key

Need row where composite key MATCHES existing current record AND compared column has genuinely NEW value. Pull real combos from Athena:
```sql
SELECT old_famly_bill_payer_id, old_famly_child_id
FROM dev_bb_midln_s3_analytics.dim_bill_payer
WHERE current_flag='Y';
```

## Glue Catalog Database Filter Gotcha

When browsing Glue Tables, check database filter isn't stuck on wrong db (e.g. `cipher-db`) — switch to `[env]_bb_midln_s3_analytics`.

## Parent Schema Expansion — Crawler Name Aliases (July 31, 2026)

Glue CSV crawler lowercases camelCase **without** inserting underscores:
`childCustody` → `childcustody` (not `child_custody`); `name.firstname` after snake → `name_firstname`.

Parent curated must map these via `_CRAWLER_COLUMN_ALIASES` or ApplyMapping silently misses real values (nulls / wrong empties).

Also: crawler keeps dotted names (`address.city`) — normalize `.` → `_` before mapping.

## Script Ready ≠ Table Schema Ready (July 31, 2026)

UAT pipeline can deploy new parent script while Glue curated `parent` and `dim_parent` stay old until:
1. Curated file lands (sample or real)
2. Curated crawler
3. Archive + rebuild analytics Delta
4. Analytics crawler

Do not tell stakeholders "UAT schema done" based on script grep alone.

**July 31 evening:** UAT was rebuilt with sample → schemas now match DEV (~60 cols). Sample then removed + `dim_parent` truncated (0 rows, schema kept). Ready for Monday real CSV.

## Parent Composite Key (July 31, 2026)

Parent extract is **relation grain** (parent ↔ child). SCD2 key must be:
`old_famly_parent_id` + `old_famly_child_id`
(same pattern as bill_payer famly composite). Single parent_id alone is wrong when one parent has multiple children.

## Sample Cleanup: UAT Must, DEV Optional (July 31, 2026)

Prasath (July 31): **UAT must** delete curated sample file and truncate sample `dim_parent` rows before real Monday load. **DEV does not need** row truncate at that time — keep sample SCD2 rows for reference.

**Override Aug 2:** Prasath asked to truncate **all DEV analytics dims** — done (Task 11). DEV sample rows cleared. Truncate keeps schema; Athena count = 0. Old parquet under `year=/month=` may remain until VACUUM — Delta log is source of truth for row count.

## DEV Midlothian IAM Role Name (Aug 2, 2026)

CDK / docs sometimes say `dev-bb-midln-famly-migration-data-lake-role`. That role **does not exist** in the account.

| Env | Actual role used by Midlothian Glue jobs |
|-----|------------------------------------------|
| DEV | `dev-midln-data-lake-role` |
| UAT | `uat-bb-midln-famly-migration-data-lake-role` |

Symptom if wrong: Notebook fails to start —  
`Role ... should be given assume role permissions for Glue Service` / `InvalidInputException`.

Older DEV notebook `dev_unit_test` uses `dev_glue_rds_s3_access_role` (different legacy role).

## Glue Notebook Tab Save Greyed Out (Aug 2, 2026)

After pasting truncate cells into `dev_unit_test_midln` Notebook tab, **Save** stayed greyed out (common when session is running / Glue doesn’t mark dirty).

Workaround: upload cells to ScriptLocation via CLI:
`aws s3 cp local.py s3://bb-dev-code-repository/glue/scripts/dev_unit_test_midln.py --profile bb --region eu-west-2`

Notebook tab may still show blank/wrong template — paste cells for interactive run; rely on S3 for persistence. Same family of gotcha as Console Clone blank Notebook tab.

## New domain: Athena rows ≠ done (health, Aug 15, 2026)

Built `dim_health` script + crawler + SF + CDK cron, then ran the **Glue export job only**. Athena had 3 current rows. Prasath still flagged:

1. **CSVs still in curated health** — archive is the SF **move** step, not the export job. `dev-midln-health-workflow` had **0 executions**. Fix: `dev_midln_move_s3_to_s3 --domain health`.
2. **No DEV trigger** — CDK EventBridge is **UAT daily cron**. DEV uses **S3 file-arrival** rules (`dev-midln-child-curated-s3-trigger` etc.) which are **not in Git**. Health needed `dev-midln-health-curated-s3-trigger` on `midlothian/curated/health/*.csv`.
3. **Job was SCRIPT** — child is `JobMode=NOTEBOOK`. CDK Glue stack creates SCRIPT. Convert DEV with `glue update-job` JobMode=NOTEBOOK; keep same ScriptLocation / `--env` / `--domain`. Next pipeline may revert to SCRIPT.

**Rule:** copy child/parent for SF run, archive, DEV S3 trigger, notebook. Never sign off from a standalone Glue run.

## DWH centre vs centre_cc (knowledge, Aug 13, 2026)

Prasath training (not Midlothian): `dwh centre` source is RDS `bb_centre` → `dim_centre`. `dwh centre_cc` source is S3 `s3://bb-prod-business-raw/centre_dwh/centre_area_info.xlsx` → `dim_centre_cc`. Do not assume every DWH pipeline has an S3 source.

## S3 EventBridge off → silent Midlothian triggers (Aug 21, 2026)

Saravanan dropped famly child reverse CSV; EventBridge rule `uat-midln-famly-child-s3-trigger` was ENABLED but **no SF started**. Root cause: bucket notification config had only Lambda for `midlothian/landing/child/*.json` — **no `EventBridgeConfiguration`**. Same gap on DEV bucket.

**Fix:** `put-bucket-notification-configuration` with existing Lambda **plus** `"EventBridgeConfiguration": {}` on `dev-bb-famly-migration` and `uat-bb-famly-migration`. After fix, parent reverse auto-fired.

**Rule:** Midlothian CDK owns cron only; S3 triggers + bucket EventBridge are CLI. Re-check EventBridge after anyone rewrites bucket notifications.

## Redshift `glue_user` vs `report_user` (Akhilesh, Aug 21, 2026)

Akhilesh Lambda uses `SecretArn` + `Database` (no separate user/password). Tried `dev/redshift` → `FATAL: password authentication failed for user "glue_user"`.

Prasath clarification:
- Power BI JDBC details (`report_user`) are **not** what lives in `dev/redshift`
- `dev/redshift` / Glue connection `dev_redshift_connection` → **`glue_user`** (write) for pipelines
- `report_user` = read-only for Power BI embed
- Remaining Lambda failure → IAM to secret + Redshift; do not change policies mid-call without confirm
- Keep secrets standard: `{dev|uat|prod}/redshift` across envs for Glue

## Learning journal path = no folder check (Aug 20, 2026)

Prasath/Saravanan: always set `child_learning_journal_s3_path` from child ID (like photo). If folder missing, content simply empty. Do not gate on S3 exists. Sample journal folders without `dim_child` rows are orphans / early uploads — not a pipeline bug.