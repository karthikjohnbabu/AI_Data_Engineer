# Completed Tasks & Pending Follow-ups

## Current state (as of Aug 21, 2026)

- UAT Midlothian on S3 file-drop; EventBridge re-enabled on DEV+UAT data buckets (21 Aug)
- Famly reverse restore + Saravanan bulk child/parent reverse green (20–21 Aug)
- Learning journals + health locations documented in infrastructure.md
- Redshift: Glue uses `{env}/redshift` (`glue_user`); Power BI uses `report_user`

## Completed (July 31 → Aug 2, 2026)

### Task 1: famly_centre pipeline
- Full 37-column schema, SCD2 verified DEV + UAT

### Task 2: Parent email masking (early)
- DEV verified (`_d@bb.invalid`)
- UAT: 344 records masked in-place via `uat_unit_test_midln` notebook
- Later properly fixed in repo — see Task 9
- IAM role fixed (`glue:TagResource` added)

### Task 3: bill_payer famly pipeline
- Created `dev_midln_bill_payer_s3_famly_curated_to_analytics_export` job
- Added famly_bill_payer path to curated crawler
- Composite key: `old_famly_bill_payer_id` + `old_famly_child_id`
- Track both `new_famly_bill_payer_id` and `new_famly_child_id`; DEV + UAT signed off
- Lesson: wrong script content under correct S3 filename wasted hours — always verify S3 script

### Task 4: bill_payer email masking (July 28)
- `mask_email(sdf, "email", env)` in bill_payer CURATED `process_data`
- Rebuilt both envs; UAT verified with SCD2 + both new ids intact

### Task 5: Centre & room reverse flows DEV (July 28)
- Room: 3 rooms SCD2 verified (count 3 → 6)
- Centre: fixed bigint→string for UUID reverse file (silent 0-changed if wrong)

### Task 6: new_famly_centre_id on dim_room (July 28)
- Room CURATED script updated; DEV rebuilt and verified
- UAT: deployed via CI/CD, ran normal curated flow — column live with NA values
- Lesson: "available in UAT" = in the TABLE, not just deployed script

### Task 7: bill_payer reverse workflow SF + EventBridge (July 30)
- Added `famly-bill-payer` to `midln_step_functions_stack.py` and `midln_event_bridge_stack.py`
- Deployed via uat branch; state machine + EventBridge rule live
- Verified SCD2: count 124 → 126, composite key + both new ids tracked

### Task 8: bill_payer email masking via CI/CD (July 30)
- Root cause: earlier S3-only fix overwritten by pipeline
- Committed to repo, full rebuild; 124/124 masked including expired rows

### Task 9: parent email masking via CI/CD (July 30)
- `mask_email` added to parent curated in repo; rebuild wiped `new_famly_*`
- Restored reverse from `midlothian/famly/famly_parent/2026-07-30_13-28/`, re-ran famly SF
- Final: 288/288 masked, new ids 8/8/8 restored

### Task 10: parent dim schema expansion + composite key (July 31)
Prasath decisions (at the time):
- Load ALL columns from sample `extract_child_relations_sample 1.csv`
- Composite SCD2: `old_famly_parent_id` + `old_famly_child_id` (relation grain)
- Real Midlothian parent CSV: Saravanan loads Monday
- UAT: MUST delete sample + truncate `dim_parent` before real load
- DEV: do NOT truncate sample rows **at that time** (later overridden by Task 11 Aug 2)

What we did:
1. Rewrote `glue/jobs/dev_midln_parent_s3_curated_to_analytics_export.py` like child
   (normalize, `to_json` nested fields, `_CRAWLER_COLUMN_ALIASES`, wide mappings,
   `mask_email(parents_email)`, `new_famly_*='NA'`)
2. Updated `glue/jobs/dev_midln_parent_s3_famly_curated_to_analytics_export.py` for composite SCD2
3. Commit `b7229f0` on `uat`; pipeline `uat-bb-midln-famly-migration-pipeline` green
4. **DEV:** archive `…/Analytics/parent/2026-07-31_12-37/` → rebuild → ~60 cols; SCD2 OK;
   emails `_d@bb.invalid`; **3 rows kept then** (cleared later in Task 11)
5. **UAT:** sample → crawl → archive `…/Analytics/parent/2026-07-31_13-54/` → rebuild → ~60 cols;
   emails `*_u@bb.invalid`; SCD2 Nataly `Mother-SCD2-TEST`(N) → `Mother-UAT-SCD2-TEST`(Y)
6. **UAT cleanup DONE:** sample removed from
   `s3://uat-bb-famly-migration/midlothian/curated/parent/` (empty);
   `dim_parent` truncated to 0 rows; schema kept (~60 cols)
7. Verified DEV vs UAT `dim_parent` schemas MATCH exactly (Glue/Athena)

### Task 11: Truncate all DEV analytics dim tables + create `dev_unit_test_midln` (Aug 2) — TODAY
Prasath: "truncate all the tables in Dev" + create DEV notebook like UAT.

What we did:
1. **Created Glue notebook job** `dev_unit_test_midln` (`JobMode: NOTEBOOK`)
   - Script: `s3://bb-dev-code-repository/glue/scripts/dev_unit_test_midln.py`
   - Also: `s3://dev-bb-famly-migration-artifacts/midlothian/glue/scripts/dev_unit_test_midln.py`
   - ipynb: `s3://dev-bb-famly-migration-artifacts/midlothian/glue/notebooks/dev_unit_test_midln.ipynb`
   - Glue 4.0, G.1X, 3 workers, Delta + `data_ops.zip`
2. **Role fix:** first attempt used non-existent
   `dev-bb-midln-famly-migration-data-lake-role` → notebook failed assume-role.
   Correct DEV Midlothian role = **`dev-midln-data-lake-role`**
   (same as `dev_midln_*` curated jobs). Trust includes `glue.amazonaws.com`.
3. **Archived** all 5 dims (PowerShell validated object count + size match):
   `s3://dev-bb-famly-migration-archive/midlothian/Analytics/<domain>/2026-08-02_truncate/`
   - centre 12, room 6, child 3, parent 6, bill_payer 3 objects
4. **Truncated** via notebook (`filter("1=0")` overwrite, `overwriteSchema=false`)
5. **Athena verified** all 5 = 0 rows:
   `dim_centre`, `dim_room`, `dim_child`, `dim_parent`, `dim_bill_payer`
6. Notebook tab showed wrong/old template; Save greyed out after paste —
   persisted truncate cells via S3 upload instead (same Notebook-tab gotcha as before)

---

### Task 12: Create DEV Step Functions (parity with UAT) (Aug 3)
Prasath approved: create SFs in DEV like UAT.
- Created 10 STANDARD state machines under `dev-midln-*-workflow`
- Role: `dev-midln-data-lake-role`
- Flow each: curated/famly Glue job → `dev_midln_move_s3_to_s3` → `dev_bb_midln_s3_analytics_crawler`
- Normal: centre, room, child, parent, bill-payer
- Famly reverse: famly-centre, famly-room, famly-child, famly-parent, famly-bill-payer
- Note: created via CLI (DEV CDK pipeline still commented out in `app.py`) — not yet managed by CodePipeline
- EventBridge schedules for DEV **not** added (Prasath asked for SFs only)

---

### Task 13: DEV famly-child reverse (Aug 3)
Prasath: child created + reverse file available → run reverse.
1. Curated crawler OK — `famly_child` in `dev_bb_midln_s3_curated`
2. Reverse file: `bb_5911b234-..._20260803T104137Z.csv` (1 row mapping)
3. `dev-midln-famly-child-workflow`: famly export **SUCCEEDED**; move initially **FAILED**
   (`--extra-py-files` pointed at missing `midlothian/common/data_ops.zip`)
4. Fix: copied zip + updated move job to `midlothian/glue/common/data_ops.zip`
5. Manual move + analytics crawler **SUCCEEDED** (reverse file archived)
6. Athena SCD2 sign-off on `dim_child`:
   - 2 rows same `old_famly_child_id` (`8e7688dc-...`)
   - expired `N` with `new_famly_child_id=NA`
   - current `Y` with `new_famly_child_id=42282c89-4d7b-4ddb-a890-e6b5492a135e`

---

### Task 14: DEV famly-parent reverse (Aug 3)
Prasath: reverse file for parent creation → load it.
1. Reverse file: `bb_5911b234-..._20260803T115846Z.csv` (1 row; parent+child+centre ids)
2. Curated crawler OK; `dev-midln-famly-parent-workflow` **SUCCEEDED** end-to-end
   (move/archive OK after earlier `data_ops.zip` fix)
3. Athena SCD2 sign-off on `dim_parent` (composite key parent+child):
   - expired `N` with `new_famly_*=NA`
   - current `Y` with `new_famly_parent_id=00723812-...`, `new_famly_child_id=42282c89-...`
   - counts `2 / 1 / 1 / 1`

---

### Task 15: Fix parent_mobile_number null in analytics (Aug 3)
Saravanan: parent mobile empty in UI. Email issue = his code (not ours).
**Root cause:** ApplyMapping type coercion nulling string fields (`parent_mobile_number`,
also `priority` bigint→string).
**Fix:** force-cast all string mapping sources to `StringType` before DynamicFrame/
ApplyMapping in `dev_midln_parent_s3_curated_to_analytics_export.py`. Phone loaded
**as-is** (`+447…`); `+44`→`07` formatting deferred pending Prasath.
**DEV reload:** archived `…/Analytics/parent/2026-08-03_phone_fix/` → curated job
SCD2 → famly-parent SF restored reverse.
**Verified current row:** `parent_mobile_number=+447987762340`, `priority=3`,
email masked, `new_famly_*` populated.
**Note:** script uploaded to DEV S3 for test — still need CI/CD commit/push to `uat`
so pipeline does not overwrite.

---

### Task 16: UAT truncate child/parent/bill_payer for reload (Aug 3)
Saravanan/Prasath: drop child, parent, billpayer in UAT before reload.
Interpreted as **truncate** (0 rows, schema kept). Centre/room untouched.
1. Archived to `uat-bb-famly-migration-archive/midlothian/Analytics/{child,parent,bill_payer}/2026-08-03_uat_reload_prep/`
2. Glue job `uat_truncate_child_parent_billpayer` SUCCEEDED
3. Athena: child/parent/bill_payer = **0**; centre=2, room=10 unchanged; schemas present (77/60/43 cols)

---

### Task 17: UAT curated reload child/parent/billpayer (Aug 3)
Saravanan: data available — child, child profile images, parent, billpayer.
1. Curated crawler OK; ran `uat-midln-child/parent/bill-payer-workflow` — all SUCCEEDED
2. Child profile images = path set in child job (`child_photo_s3_path` → raw/child/images/)
3. Athena current rows: child **418**, parent **337**, bill_payer **123**
4. Parent phones present on most rows; email masking `_u@bb.invalid` applied
5. Famly reverse **not** run (waiting for reverse files / Prasath)

---

### Task 18: UAT famly-child reverse — 5 children (Aug 3)
Saravanan: 5 children created + reverse file ready.
1. Reverse CSV 5 rows under `midlothian/famly/famly_child/`
2. `uat-midln-famly-child-workflow` **SUCCEEDED**
3. Athena: total 423 rows, current 418, **mapped 5**; each of 5 keys has SCD2 N→Y with real `new_famly_child_id`

---

### Task 19: UAT famly-parent reverse (Aug 3)
Saravanan: parents loaded + reverse file ready.
1. Reverse CSV **8** relation rows under `famly_parent/`
2. `uat-midln-famly-parent-workflow` **SUCCEEDED**
3. Athena: current 337, **parent_mapped 8 / child_mapped 8**

---

### Task 20: DEV dim_health follow the child pattern (Aug 15)
Prasath: curated health CSVs not archived; no trigger; health must be a notebook in DEV.
1. Cause: export Glue was run standalone; `dev-midln-health-workflow` had 0 executions; CDK cron is UAT-only; CDK job is SCRIPT
2. Archived via `dev_midln_move_s3_to_s3 --domain health` → `...-archive/midlothian/curated/health/2026-08-15_08-52/` (5 CSVs); curated empty
3. Created `dev-midln-health-curated-s3-trigger` (Object Created `midlothian/curated/health/*.csv` → `dev-midln-health-workflow`)
4. `dev_midln_health_s3_curated_to_analytics_export` JobMode **NOTEBOOK** (same script/role/`--env`/`--domain`)
5. UAT unchanged (already had `uat-midln-health-stepfunction-daily-schedule`)

---

### Task 21: UAT reverse restore + EventBridge + bulk (Aug 20–21)
1. **Learning journals:** confirmed path-from-child-ID logic; Cruz/Elio OK; sample orphan folders with Saravanan
2. **Famly reverse restore (20 Aug):** child/parent/bill_payer — rebuilt reverse CSVs, archived analytics, ran famly SFs; `new_famly_*` restored for in-scope kids
3. **Tife `centre_area_info`:** loaded UAT → `dim_centre_cc` 2026 = 369
4. **21 Aug Saravanan bulk:** child reverse SUCCEEDED (manual start — trigger silent); parent reverse auto SUCCEEDED after EventBridge fix
5. **EventBridge:** re-enabled on `dev-bb-famly-migration` + `uat-bb-famly-migration` (kept landing-child Lambda)
6. **Tife health:** clarified `dim_health` in Athena (13 current rows); not Redshift DWH / not dim_child
7. **Akhilesh Redshift:** confirmed DEV Glue uses `dev_redshift_connection` → secret `dev/redshift` (`glue_user`); ≠ Power BI `report_user`

---

## Pending next

1. After curated rebuild: restore/re-run famly parent reverse SF if `new_famly_*` wiped
2. Ask Prasath: EventBridge missing schedule for `famly-room` (UAT) — intentional?
3. Centre/room UAT reverse — wait for Prasath; centre may need bigint→string
4. Optional VACUUM DEV/UAT dims (old parquet may remain under year/month after truncate)
5. Longer-term: enable DEV CDK pipeline in `app.py`; optionally IaC the DEV/UAT S3 triggers **and** bucket EventBridgeConfiguration (today CLI-only)
6. Broader UAT sign-off across domains
7. Re-test `dev-midln-famly-child-workflow` end-to-end after move-job fix (optional smoke)
8. After next CI/CD: re-check health JobMode still NOTEBOOK (CDK may reset to SCRIPT)
9. AgentCore / Lambda Redshift: Akhilesh IAM for `dev/redshift` + glue_user — confirm after Prasath call; do not change policies without him
10. `Moved from Busy…` room truncation — still Akhilesh RDS
11. Ashley director emails — need source if still required
12. Continue Saravanan UAT bulk (bill payer / remaining as he drops)
