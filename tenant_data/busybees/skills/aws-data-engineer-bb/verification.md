# Verification Queries — Busy Bees × Famly

Replace `[env]` with `dev` or `uat` as appropriate.

## Check Email Masking (parent)

```sql
SELECT parent_forenames, parent_surname, parents_email, current_flag
FROM uat_bb_midln_s3_analytics.dim_parent
WHERE parents_email IS NOT NULL AND parents_email != ''
LIMIT 10;
```

Expected UAT: `localpart_u@bb.invalid` | DEV: `localpart_d@bb.invalid`

## Check REST bill_payer new columns (Aug 30, 2026)

WhatsApp (short). Swap `uat` → `dev` as needed.

```sql
SELECT old_famly_bill_payer_id, old_famly_child_id, bill_payer_type, bill_payer_forenames, email, current_flag
FROM uat_bb_midln_s3_analytics.dim_bill_payer
WHERE current_flag = 'Y'
LIMIT 20;
```

Expect `bill_payer_type` (e.g. RELATION), forenames populated, UAT emails `*_u@bb.invalid`.

## Live id counts after Saravanan refresh (Aug 31, 2026)

```sql
SELECT 'child' AS domain,
  SUM(CASE WHEN current_flag = 'Y' THEN 1 ELSE 0 END) AS current_y,
  SUM(CASE WHEN current_flag = 'Y' AND new_famly_child_id NOT IN ('NA', '') THEN 1 ELSE 0 END) AS live_ids
FROM uat_bb_midln_s3_analytics.dim_child
UNION ALL
SELECT 'parent',
  SUM(CASE WHEN current_flag = 'Y' THEN 1 ELSE 0 END),
  SUM(CASE WHEN current_flag = 'Y' AND new_famly_parent_id NOT IN ('NA', '') THEN 1 ELSE 0 END)
FROM uat_bb_midln_s3_analytics.dim_parent
UNION ALL
SELECT 'bill_payer',
  SUM(CASE WHEN current_flag = 'Y' THEN 1 ELSE 0 END),
  SUM(CASE WHEN current_flag = 'Y' AND new_famly_bill_payer_id NOT IN ('NA', '') THEN 1 ELSE 0 END)
FROM uat_bb_midln_s3_analytics.dim_bill_payer;
```

Target after 31 Aug session: child **98**, parent **247**, bill_payer **384** current (84 Live bill payer if archive reverse kept).

## Saravanan query — bill payers NA where child has Live id (Aug 31)

```sql
WITH child AS (
  SELECT DISTINCT old_famly_child_id
  FROM uat_bb_midln_s3_analytics.dim_child
  WHERE current_flag = 'Y'
    AND new_famly_child_id IS NOT NULL
    AND new_famly_child_id <> 'NA'
)
SELECT bp.*
FROM uat_bb_midln_s3_analytics.dim_bill_payer bp
JOIN child c ON c.old_famly_child_id = bp.old_famly_child_id
WHERE bp.old_famly_centre_id = '4365a484-f0d0-4fc7-9e57-92216d792289'
  AND bp.current_flag = 'Y'
  AND (bp.new_famly_bill_payer_id IS NULL OR bp.new_famly_bill_payer_id = 'NA');
```

**Interpretation:** Low count is OK if archive reverse already mapped most pairs. Remaining rows often new bill payers (Elias/Nadine) pending updated **curated** extract — not famly reverse (Saravanan: bill payer curated only).

## Check Email Masking (bill_payer)

```sql
SELECT email, current_flag, valid_from, valid_to
FROM uat_bb_midln_s3_analytics.dim_bill_payer
WHERE email IS NOT NULL AND email != ''
LIMIT 10;
```

Verify both current (Y) AND expired (N) rows are masked for full SCD2 history coverage.

## Check SCD2 (replace domain and key value)

```sql
SELECT old_famly_centre_id, centre_name, current_flag, valid_from, valid_to
FROM dev_bb_midln_s3_analytics.dim_centre
WHERE old_famly_centre_id = '<test_id>'
ORDER BY valid_from;
```

Sign-off: exactly 2 rows — one `current_flag='N'` (expired) + one `current_flag='Y'` (current).

## Check Composite Key SCD2 (bill_payer)

```sql
SELECT old_famly_bill_payer_id, old_famly_child_id,
       new_famly_bill_payer_id, new_famly_child_id,
       current_flag, valid_from, valid_to
FROM uat_bb_midln_s3_analytics.dim_bill_payer
WHERE old_famly_bill_payer_id = '<test_id>'
  AND old_famly_child_id = '<test_child_id>'
ORDER BY valid_from;
```

## Check Composite Key SCD2 (parent) — July 31, 2026

```sql
SELECT old_famly_parent_id, old_famly_child_id,
       parent_forenames, relation, parents_email,
       current_flag, valid_from, valid_to
FROM dev_bb_midln_s3_analytics.dim_parent
WHERE old_famly_parent_id = '<test_parent_id>'
  AND old_famly_child_id = '<test_child_id>'
ORDER BY valid_from;
```

Sign-off: 2 rows for same composite key — one `N` + one `Y`.

## Check Parent Wide Schema Columns

```sql
SELECT column_name, data_type, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'uat_bb_midln_s3_analytics'
  AND table_name = 'dim_parent'
ORDER BY ordinal_position;
```

```sql
-- DEV vs UAT must all MATCH
WITH d AS (
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'dev_bb_midln_s3_analytics' AND table_name = 'dim_parent'
),
u AS (
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'uat_bb_midln_s3_analytics' AND table_name = 'dim_parent'
)
SELECT COALESCE(d.column_name, u.column_name) AS column_name,
       d.data_type AS dev_type, u.data_type AS uat_type,
       CASE
         WHEN d.column_name IS NULL THEN 'UAT_ONLY'
         WHEN u.column_name IS NULL THEN 'DEV_ONLY'
         WHEN d.data_type <> u.data_type THEN 'TYPE_MISMATCH'
         ELSE 'MATCH'
       END AS status
FROM d FULL OUTER JOIN u ON d.column_name = u.column_name
ORDER BY status, column_name;
```

After July 31 rebuild (both envs): ~60 columns (address_*, name_*, image_*, behaviors, roles2, SCD2 cols, etc.).  
**As of Aug 2 evening:** UAT `dim_parent` = **0** (ready for Monday real CSV).  
**DEV all 5 dims = 0** after Task 11 truncate (schema kept). Schemas still match.

## DEV truncate verification (Aug 2, 2026 — verified)

```sql
SELECT 'dim_centre' AS t, COUNT(*) AS rows FROM dev_bb_midln_s3_analytics.dim_centre
UNION ALL SELECT 'dim_room', COUNT(*) FROM dev_bb_midln_s3_analytics.dim_room
UNION ALL SELECT 'dim_child', COUNT(*) FROM dev_bb_midln_s3_analytics.dim_child
UNION ALL SELECT 'dim_parent', COUNT(*) FROM dev_bb_midln_s3_analytics.dim_parent
UNION ALL SELECT 'dim_bill_payer', COUNT(*) FROM dev_bb_midln_s3_analytics.dim_bill_payer;
```

Expected: all rows = **0**.

## Monday readiness checks (before / after real parent load)

```sql
-- Both DEV and UAT parent should be empty BEFORE real load (after Aug 2 truncate)
SELECT COUNT(*) AS uat_rows FROM uat_bb_midln_s3_analytics.dim_parent;
SELECT COUNT(*) AS dev_rows FROM dev_bb_midln_s3_analytics.dim_parent;

-- After real load: expect > 0 and masked emails
SELECT COUNT(*) AS total,
       SUM(CASE WHEN current_flag = 'Y' THEN 1 ELSE 0 END) AS current_y,
       SUM(CASE WHEN parents_email LIKE '%_u@bb.invalid' THEN 1 ELSE 0 END) AS masked_u
FROM uat_bb_midln_s3_analytics.dim_parent;
```

## Check new_famly_* Population

```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN current_flag = 'Y' THEN 1 ELSE 0 END) AS current_rows,
  SUM(CASE WHEN new_famly_parent_id IS NOT NULL AND new_famly_parent_id != 'NA' THEN 1 ELSE 0 END) AS parent_ids_populated,
  SUM(CASE WHEN new_famly_centre_id IS NOT NULL AND new_famly_centre_id != 'NA' THEN 1 ELSE 0 END) AS centre_ids_populated,
  SUM(CASE WHEN new_famly_child_id IS NOT NULL AND new_famly_child_id != 'NA' THEN 1 ELSE 0 END) AS child_ids_populated
FROM uat_bb_midln_s3_analytics.dim_parent;
```

## Check Column Count Matches DEV vs UAT

```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'dim_centre'
AND table_schema = 'dev_bb_midln_s3_analytics';
```

Run for both `dev_bb_midln_s3_analytics` and `uat_bb_midln_s3_analytics` — counts must match.

## Check Truncate (schema kept, zero rows)

```sql
SELECT COUNT(*) AS row_count FROM uat_bb_midln_s3_analytics.dim_centre;

SELECT COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'dim_centre'
AND table_schema = 'uat_bb_midln_s3_analytics';
```

Expected after truncate: row_count = 0, column_count unchanged.

## Check Famly Source File in Catalog

```sql
SELECT COUNT(*) FROM uat_bb_midln_s3_curated.famly_parent;
```

Run after restoring reverse file and running curated crawler — confirms Glue Catalog sees the file.

## Masking Coverage (full history)

```sql
SELECT
  current_flag,
  COUNT(*) AS total,
  SUM(CASE WHEN parents_email LIKE '%@bb.invalid' THEN 1 ELSE 0 END) AS masked
FROM uat_bb_midln_s3_analytics.dim_parent
WHERE parents_email IS NOT NULL AND parents_email != ''
GROUP BY current_flag;
```

Both Y and N groups should show 100% masked in UAT.

## Centre / room — primary key checks (mandatory before load)

### Original DL centre SOT (`centre_mapping.csv`)

PowerShell — last row / new centre before S3 upload:

```powershell
Import-Csv .\centre_mapping_SOT.csv |
  Where-Object { [string]::IsNullOrWhiteSpace($_.gs_ref) } |
  Select-Object gs_ref, title, cost_centre
```

Expected: **0 rows** (or only rows Prasath explicitly flagged as pending).

S3 verify after upload:

```powershell
aws s3 cp s3://bb-prod-business-raw/centre/single_source/centre_mapping.csv - --profile bb --region eu-west-2 |
  Select-String 'Bishopsgarth'
```

Expect non-blank first column (`gs_ref`).

### Athena sign-off — centre SOT (Prasath check)

**Database:** `prod_bb_nc_s3_analytics` · **Table:** `dim_centre` · **`gs_ref` is INTEGER** (no quotes).

```sql
-- Replace 90012 with assigned gs_ref for new centre
SELECT gs_ref, title, nurserycare_name, cost_centre, vat_no, current_flag
FROM prod_bb_nc_s3_analytics.dim_centre
WHERE gs_ref = 90012;
```

Expected: **1 row**, `current_flag = 'Y'`. UAT/dev: same query against `uat_bb_nc_s3_analytics` / `dev_bb_nc_s3_analytics`.

**Common mistake:** Checking Redshift `dwh.dim_centre` or using `gs_ref = '90012'` (varchar) → type error in Athena.

**After S3 upload:** Must start **`prod-centre-sot-bb-nc-work-flow`** (or Glue job) before this query shows new centres. **No S3 file trigger** — only daily schedule **04:00 London** (`prod-centre-sot-stepfuntion-daily-schedule`). Ad-hoc uploads after that time need manual SF/Glue run.

### Redshift — centre loaded? (separate DWH pipeline, prod example)

```sql
SELECT gs_ref, nurserycare_name, cost_centre, vat_no, source_load_date
FROM "raw".centre
WHERE cost_centre = 349 OR nurserycare_name = 'Bishopsgarth' OR gs_ref = '90012';

SELECT gs_ref, nurserycare_name, cost_centre, current_flag
FROM dwh.dim_centre
WHERE cost_centre = 349 OR nurserycare_name = 'Bishopsgarth' OR gs_ref = '90012';
```

Blank PK audit:

```sql
SELECT gs_ref, nurserycare_name, cost_centre
FROM "raw".centre
WHERE gs_ref IS NULL OR TRIM(gs_ref) = '';
```

### Midlothian Athena — centre / room PK not null

```sql
SELECT old_famly_centre_id, centre_name, current_flag
FROM uat_bb_midln_s3_analytics.dim_centre
WHERE old_famly_centre_id IS NULL OR TRIM(old_famly_centre_id) IN ('', 'NA')
LIMIT 20;

SELECT old_famly_room_id, room_name, gs_ref, current_flag
FROM uat_bb_midln_s3_analytics.dim_room
WHERE old_famly_room_id IS NULL OR TRIM(old_famly_room_id) IN ('', 'NA')
LIMIT 20;
```

Curated file pre-load (PowerShell):

```powershell
Import-Csv .\centre.csv | Where-Object { [string]::IsNullOrWhiteSpace($_.old_famly_centre_id) }
Import-Csv .\room.csv   | Where-Object { [string]::IsNullOrWhiteSpace($_.old_famly_room_id) }
```

Expected: **0 rows** before starting Step Function.

## Child photo + learning journal paths (Prod / UAT / DEV)

Swap `prod` → `uat` / `dev` as needed. Paths use **old** Famly child ID.

```sql
SELECT
  COUNT(*) AS current_children,
  SUM(CASE WHEN child_photo_s3_path IS NOT NULL AND child_photo_s3_path <> '' THEN 1 ELSE 0 END) AS with_photo_path,
  SUM(CASE WHEN child_learning_journal_s3_path IS NOT NULL AND child_learning_journal_s3_path <> '' THEN 1 ELSE 0 END) AS with_journal_path,
  MIN(child_photo_s3_path) AS sample_photo,
  MIN(child_learning_journal_s3_path) AS sample_journal
FROM prod_bb_midln_s3_analytics.dim_child
WHERE current_flag = 'Y';
```

```sql
SELECT old_famly_child_id, new_famly_child_id,
       child_photo_s3_path, child_learning_journal_s3_path, current_flag
FROM prod_bb_midln_s3_analytics.dim_child
WHERE current_flag = 'Y'
LIMIT 20;
```

```sql
-- Is this UUID old or Live?
SELECT current_flag, old_famly_child_id, new_famly_child_id,
       child_learning_journal_s3_path,
       CASE
         WHEN old_famly_child_id = '<uuid>' THEN 'OLD id'
         WHEN new_famly_child_id = '<uuid>' THEN 'NEW/Live id'
       END AS this_uuid_is
FROM prod_bb_midln_s3_analytics.dim_child
WHERE old_famly_child_id = '<uuid>'
   OR new_famly_child_id = '<uuid>';
```

S3: `s3://prod-bb-famly-migration/midlothian/raw/child/images/` and `…/raw/child/learning_journal/`. Athena path populated ≠ object exists. After a Saravanan journal drop, folder names must match `old_famly_child_id` (Prod 3 Sep: 59/152 after rename).
