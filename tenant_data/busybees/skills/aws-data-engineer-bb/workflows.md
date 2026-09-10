# Operational Workflows — Busy Bees × Famly

## Centre / room — primary key gate (mandatory, Aug 28 2026)

**Trigger:** Any task mentioning centre, room, centre SOT, `centre_mapping`, Bishopsgarth, `dim_centre`, `dim_room`, or centre/room reverse/curated loads.

**Do not upload, load, or tell ops “will load” until this passes.**

| Step | Original DL centre SOT | Midlothian centre | Midlothian room |
|------|------------------------|-------------------|-----------------|
| **PK column** | `gs_ref` | `old_famly_centre_id` | `old_famly_room_id` |
| **Who assigns** | Prasath / tech team | Source / reverse CSV | Source / reverse CSV |
| **Before S3 upload** | Every new/changed row has non-blank `gs_ref`; `vat_no` = `NA` if unknown | Curated/reverse CSV has non-null ids | Same |
| **If BA file has blank `gs_ref`** | Send template only; wait for Prasath revised file | N/A | N/A |
| **After load** | S3 row + **Glue SOT job** + **`prod_bb_nc_s3_analytics.dim_centre`** in Athena | Athena SCD2 + PK not null | Same |
| **Redshift note** | No PK enforcement — blank `gs_ref` can sit in `"raw".centre` | Separate from SOT path | `gs_ref` on `dim_room` for joins |

**Centre SOT load workflow (original DL) — 3 steps, all mandatory:**

| Step | Action | Sign-off |
|------|--------|----------|
| **0. PK gate** | Katy/Ops returns CSV → **stop** if `gs_ref` blank; get revised file from Prasath | No blank `gs_ref` on new rows; `vat_no = NA` not blank |
| **1. S3** | Backup prod `centre_mapping.csv`; upload corrected file; verify hash + only intended row(s) changed | `aws s3 cp … centre_mapping.csv - \| Select-String Bishopsgarth` shows `gs_ref` |
| **2. Glue / SF** | Start **`prod-centre-sot-bb-nc-work-flow`** (runs `prod_centre_sot_s3_source_to_analytics_export` + archive copy). Or run the Glue job alone if Prasath agrees. S3 alone does **not** update analytics. | SF or Glue **SUCCEEDED** |
| **3. Athena** | Prasath sign-off table: **`prod_bb_nc_s3_analytics.dim_centre`** (not Midlothian, not Redshift for this check) | Row visible with `gs_ref = <id>` (integer, no quotes) |

**Prod commands (PowerShell, profile `bb`):**

```powershell
# Step 1 — upload (after backup)
aws s3 cp .\centre_mapping_SOT.csv s3://bb-prod-business-raw/centre/single_source/centre_mapping.csv --profile bb --region eu-west-2

# Step 2 — refresh analytics (prefer full SF)
aws stepfunctions start-execution `
  --state-machine-arn arn:aws:states:eu-west-2:058264393778:stateMachine:prod-centre-sot-bb-nc-work-flow `
  --profile bb --region eu-west-2
# Or Glue only: aws glue start-job-run --job-name prod_centre_sot_s3_source_to_analytics_export ...

# Step 3 — Prasath's check (gs_ref is INTEGER)
aws athena start-query-execution `
  --query-string "SELECT gs_ref, title, nurserycare_name, cost_centre, vat_no, current_flag FROM prod_bb_nc_s3_analytics.dim_centre WHERE gs_ref = 90012" `
  --query-execution-context Database=prod_bb_nc_s3_analytics `
  --result-configuration OutputLocation=s3://uat-bb-famly-migration-artifacts/midlothian/athena/ `
  --profile bb --region eu-west-2
```

**Env job names:** SF **`prod-centre-sot-bb-nc-work-flow`** · Glue `prod_centre_sot_s3_source_to_analytics_export` · (uat/dev: `uat-centre-sot-bb-nc-work-flow`, etc.)

**Triggers (checked 28 Aug 2026):**
- **Daily cron only:** `prod-centre-sot-stepfuntion-daily-schedule` → `cron(0 3 ? * * *)` = **04:00 London** → starts **`prod-centre-sot-bb-nc-work-flow`**
- **No S3 file trigger** on `bb-prod-business-raw` for `centre/single_source/centre_mapping.csv` (bucket has no EventBridge S3 notifications; unlike Midlothian curated triggers)
- **Ad-hoc S3 upload after 04:00 London will NOT auto-run** — must start SF/Glue manually or wait for next day

**After all 3 steps:** confirm Katy; notify Akhilesh if separate Redshift `"raw".centre` load is needed (often lags SOT / not same-day).

See Bishopsgarth incident: [lessons-learned.md](lessons-learned.md) · verification queries: [verification.md](verification.md)

## Creating a NEW Famly Job (verified July 26, 2026)

The S3 `.py` script is the SOURCE OF TRUTH. Glue runs the `.py` at Script path — NOT the Notebook tab.

1. Take closest existing famly script (e.g. centre famly) as template
2. Edit locally: JOB_NAME default, `--domain` default, business_key, surrogate_key, schema_mappings
3. **Proper path:** commit to `glue/jobs/dev_midln_<domain>_s3_famly_curated_to_analytics_export.py`, push via CI/CD
4. **Test shortcut only:** upload via CLI, then verify S3 content before running:
   ```powershell
   aws s3 cp "local_path.py" s3://dev-bb-famly-migration-artifacts/midlothian/glue/scripts/JOBNAME.py --profile bb --region eu-west-2
   aws s3 cp s3://.../scripts/JOBNAME.py - --profile bb --region eu-west-2 | Select-String "famly_bill_payer"
   ```
5. Register Glue job (console Clone copies config — change Name + Script filename)
6. Add `famly_[domain]` section to config YAML if missing
7. Add famly S3 path to curated crawler, run crawler, confirm table in Athena
8. Run curated job first, then famly job

## New Midlothian domain sign-off (Aug 15, 2026 — health miss)

**Do not treat “Glue job succeeded + Athena has rows” as done.** Prasath checks curated emptiness, DEV trigger, and whether the job is a notebook.

Workflow every SF already has: export Glue → **move/archive** (`*_midln_move_s3_to_s3`) → analytics crawler → post-check.

| Check | DEV | UAT |
|-------|-----|-----|
| How to run | Start `dev-midln-{domain}-workflow` | Start `uat-midln-{domain}-workflow` |
| Archive | curated `{domain}/` empty; files under archive `curated/{domain}/<timestamp>/` | same pattern |
| Trigger | S3 Object Created `midlothian/curated/{domain}/*.csv` → SF. Rule: `dev-midln-{domain}-curated-s3-trigger`. Famly: `dev-midln-famly-{domain}-s3-trigger`. **Not in this repo.** | Same S3 pattern: `uat-midln-{domain}-curated-s3-trigger` / `uat-midln-famly-{domain}-s3-trigger`. CDK daily crons **DISABLED**. |
| Glue JobMode | **NOTEBOOK** (copy child default args: `library-set=analytics`, shuffle). CDK creates **SCRIPT** — convert after deploy. | SCRIPT from CDK is OK unless Prasath asks otherwise |
| Role | `dev-midln-data-lake-role` | `uat-bb-midln-famly-migration-data-lake-role` |

If you already loaded via standalone Glue: run **only** `dev_midln_move_s3_to_s3` with `--env dev_midln --domain {domain}` to archive without rebuilding the dim.

Health example (fixed Aug 15):
- Archive folder: `s3://dev-bb-famly-migration-archive/midlothian/curated/health/2026-08-15_08-52/`
- Trigger: `dev-midln-health-curated-s3-trigger` ENABLED
- Job: `dev_midln_health_s3_curated_to_analytics_export` JobMode=NOTEBOOK
- UAT already had `uat-midln-health-stepfunction-daily-schedule` cron(0 7 ? * * *)

## CI/CD Deploy Flow (source of truth)

1. Edit `glue/jobs/dev_midln_*.py` in repo
2. `git add` ONLY the intended file (never `git add .` — untracked CSVs/configs everywhere)
3. `git commit -m "..."`, push to branch (`git push origin uat` or `git push codecommit://bb@bb-famly-migration-pipeline uat`)
4. Wait for `uat-bb-midln-famly-migration-pipeline` — all stages green
5. Verify deployed S3 script has the fix

## Adding a NEW Tracked Column to Existing Dim (Prasath's rebuild plan)

**Problem:** `align_schema` + `df_final.select(existing_df.columns)` drops columns not in target.

**Do not use `mergeSchema` to silently grow Delta** (Prasath, 30 Aug 2026 — REST bill_payer).

**Solution:**
1. Update **CURATED** mappings for the new source cols; SCD2 compare = columns on **both** incoming and existing
2. Archive analytics dim first (golden rule)
3. Delete analytics Delta data: `aws s3 rm s3://[data-bucket]/analytics/dim_[domain]/ --recursive`
4. UAT: restore archived curated files (copy dated subfolder contents up one level) **or** leave the stuck CSV in curated and start the SF
5. Run **full SF** → initial load establishes the wide schema
6. Refresh Glue catalog (analytics crawler) and verify Athena columns
7. Re-drop same file to prove incremental SCD2 (must not error `old.<new_col> does not exist`)
8. Run famly reverse job if `new_famly_*` were wiped

## Composite Business Key (bill_payer + parent)

## Composite Business Key (bill_payer + parent)

**bill_payer:** `old_famly_bill_payer_id` + `old_famly_child_id`  
**parent (July 31, 2026):** `old_famly_parent_id` + `old_famly_child_id` (child–parent relation grain)

Without composite = wrong SCD2 when one parent/payer links to many children.

- Replace `business_key` with `business_keys = [...]`
- AND-composite join at all join points (main, expire, left_anti)
- bill_payer reverse file: 4 cols — `old_famly_child_id, new_famly_child_id, old_famly_bill_payer_id, new_famly_bill_payer_id`
- parent reverse still maps old/new parent (+ centre/child ids as present)

## Expanding Parent Curated Schema (like child) — July 31, 2026

Use **child curated** as template when Famly relation extract grows wide columns.

1. Sample: `midlothian/curated/parent/extract_child_relations_sample 1.csv`
2. Update `dev_midln_parent_s3_curated_to_analytics_export.py`:
   - `_to_snake_case` + `_CRAWLER_COLUMN_ALIASES` (crawler lowercases camelCase without underscores)
   - rename `old_famly_*` → `famly_*` for ApplyMapping sources
   - `to_json` for nested `address` / `behaviors` / `image` / `name` / `roles` / `roles2`
   - `get_parent_schema_mappings()` — full sample columns; missing sources → null for old extracts
   - keep `mask_email(parents_email)` + `new_famly_*='NA'`
3. Update parent **famly** script SCD2 to same composite keys
4. DEV test with sample → archive → delete Delta → curated job → analytics crawler → SCD2 smoke
5. Commit + push `uat` (S3-only upload is test-only; pipeline overwrites)
6. UAT mirror: copy sample → curated crawl → archive analytics → delete Delta → curated job → analytics crawl → SCD2 smoke
7. **UAT cleanup (must):** delete sample from curated parent prefix; truncate `dim_parent` (keep schema, 0 rows)
8. **DEV cleanup (optional):** Prasath decision July 31 — **keep DEV sample rows**; no truncate required

**Status as of Aug 2, 2026:** DEV + UAT scripts + wide schema live (~60 cols, schemas match).
UAT curated parent empty + `dim_parent` 0 rows (schema kept). DEV `dim_parent` still has ~3 sample SCD2 rows (intentional).

### Monday real parent load (next step)

1. Saravanan drops real Midlothian parent CSV into curated parent path
2. Run curated crawler → confirm `parent` table in curated DB
3. Run curated job (`[env]_midln_parent_s3_curated_to_analytics_export`) — **DEV first, then UAT**
4. Run analytics crawler → verify Athena `dim_parent` counts + masking + schema
5. If `new_famly_*` wiped by curated-only rebuild: restore reverse from
   `midlothian/famly/famly_parent/` dated folder → curated crawl → re-run
   `uat-midln-famly-parent-workflow` (or DEV equivalent)

## Email Masking in Curated Script

```python
from data_quality import convert_str_to_date, convert_str_dttime_to_date, mask_email

# In process_data(), after NA withColumn lines, before surrogate key:
sdf = mask_email(sdf, "email", env)          # bill_payer — column "email"
sdf = mask_email(sdf, "parents_email", env)  # parent — column "parents_email"
```

Rebuild required when masking existing rows: archive → delete analytics → restore curated → curated job → crawler → famly job.

Parent script historically needed mask in 3 places; single `process_data()` placement is preferred (bill_payer pattern).

## Truncate Delta Tables (keep schema, zero rows)

Use env notebook:
- UAT: `uat_unit_test_midln` (role `uat-bb-midln-famly-migration-data-lake-role`)
- DEV: `dev_unit_test_midln` (role **`dev-midln-data-lake-role`**) — created Aug 2, 2026

Do NOT use `DeltaTable.forPath().delete()` in standard Glue session.

```python
# DEV example (swap bucket for UAT)
base_path = 's3://dev-bb-famly-migration/analytics/'
tables = ['dim_bill_payer','dim_centre','dim_child','dim_parent','dim_room']
for t in tables:
    path = f'{base_path}{t}/'
    df = spark.read.format('delta').load(path)
    before = df.count()
    df.filter("1=0").write.format('delta').mode('overwrite') \
      .option('overwriteSchema','false').save(path)
    after = spark.read.format('delta').load(path).count()
    print(f'{t}: before={before}, after={after}')
```

**Always archive first** to:
`s3://{env}-bb-famly-migration-archive/midlothian/Analytics/<domain>/YYYY-MM-DD_truncate/`

Verify via Athena: COUNT(*) = 0 AND columns still present.

**Aug 2 DEV truncate:** archived `2026-08-02_truncate/`, all 5 dims → 0 rows, Athena verified.

## In-Place Delta Fix (preserve SCD2 history)

```python
delta_table_path = 's3://uat-bb-famly-migration/analytics/dim_parent/'
df = spark.read.format('delta').load(delta_table_path)
# Apply fix, preview with .show() FIRST
df_fixed = df.withColumn('parents_email', ...)
df_fixed.write.format('delta').mode('overwrite') \
    .option('mergeSchema', 'true').partitionBy('year', 'month').save(delta_table_path)
```

Archive before any in-place write. Old Delta versions retain original data — VACUUM if GDPR requires permanent deletion.

## Glue Interactive Session (Delta Lake)

```python
%%configure
{
    "--enable-glue-datacatalog": "true",
    "--datalake-formats": "delta",
    "--extra-py-files": "s3://uat-bb-famly-migration-artifacts/midlothian/glue/common/data_ops.zip"
}
```

Next cell:
```python
%idle_timeout 2880
%glue_version 4.0
%worker_type G.1X
%number_of_workers 3
```

**Rules:**
- `%%configure` in separate cell, run FIRST
- `%datalake_formats delta` magic does NOT work
- `%additional_python_modules delta-spark==2.4.0` causes FAILED — never use
- Stop session before changing config

## data_ops.zip Packaging

1. Unzip, edit `data_quality.py`, rezip **without** `__MACOSX` folder
2. Upload to **both** DEV and UAT artifacts buckets after any change

## Archive Restore Pattern

Archived curated files sit in dated subfolders:
`s3://...archive/.../curated/bill_payer/2026-07-21_12-07/`

Live curated folder expects files directly (no subfolder):
```powershell
aws s3 cp s3://...archive/.../bill_payer/2026-07-21_12-07/ s3://...migration/.../bill_payer/ --recursive --profile bb --region eu-west-2
```

Use TODAY's dated folder from Saravanan's daily reload, not an old one.

## UAT manual-run mode + domain reverse policy (Aug 31, 2026)

**Prasath:** Disable curated + famly S3 triggers; run Step Functions manually when Saravanan confirms file drop.

**Disabled rules (31 Aug):** `uat-midln-{child|parent|bill-payer}-curated-s3-trigger`, `uat-midln-famly-{child|parent|bill-payer}-s3-trigger`. Daily crons already off in CDK.

**Per domain (Saravanan 31 Aug):**

| Step | child | parent | bill_payer |
|------|-------|--------|------------|
| Curated SF | Yes | Yes | Yes (scratch = archive analytics → wipe Delta → SF) |
| Famly reverse SF | Yes | Yes | **No** — new Famly creations, curated extract only |
| Carry-forward `new_famly_*` on curated SCD2 | Yes (fix in repo) | Yes (deployed) | Yes (deployed) |

**Child reverse replay:** Union dedupe all CSVs under `uat-bb-famly-migration-archive/midlothian/famly/famly_child/` — not only the largest 87-row file.

**Bill payer curated CSV header (verified 31 Aug):** `famly_centre_id,famly_child_id,billPayerId,shares,billPayerType,address.*,email,phone,name.firstName,name.lastName,…`

**Saravanan gap query** (child Live + bill payer NA): expect small count when archive reverse already applied; remaining NA mostly children without Live child id. See [verification.md](verification.md).

## Child photos + learning journals (S3 grain)

**Always `old_famly_child_id`.** Glue writes `child_photo_s3_path` and `child_learning_journal_s3_path` on the child curated load. Do not run child SF or a notebook UPDATE when PDFs/photos arrive.

| Role | Action |
|------|--------|
| Ashley | Drop PDFs in Prod landing `midlothian/landing/original_learning_journals/` |
| Saravanan | Move to `midlothian/raw/child/learning_journal/{old_famly_child_id}/` |
| Andy / Akhilesh | LIVE Famly attach |
| Us | Confirm folders match old ID vs `dim_child`. If folders are Live IDs → Saravanan renames. We do not change the Delta column |

Prod 3 Sep: first 59 folders were Live ID; Saravanan renamed to old ID same evening. Details: [lessons-learned.md](lessons-learned.md).
