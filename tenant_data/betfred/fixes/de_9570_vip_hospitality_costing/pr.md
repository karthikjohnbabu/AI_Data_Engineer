**PR title:** `fix:/DE-9570: exclude Oddsking accounts from VIP hospitality costing`

**Source branch:** `feature/de-9570-dimension-vip-hospitality-costing` → **main**

**Before raising:** sync feature branch with latest `main` (`git fetch origin main && git merge origin/main`).

---

Copy everything below into the Bitbucket PR description.

---

# DE-9570 — VIP Hospitality Costing — Oddsking exclusion

Add `account_number NOT LIKE 'OK%'` on the Iceberg read so Oddsking accounts
are excluded from `uk_digital.dimension.vip_hospitality_costing`, matching
legacy SQL and sibling CDD dimension behaviour.

Linked Jira ticket: [DE-9570](https://betfred.atlassian.net/browse/DE-9570)

Fixes #DE-9570

## Context

SQL Procedure: `XtrlTransform.usp_etl_table_transform_1_Sharepoint_VIPHospitalityCosting`

Glue Job: `uk_digital_dimension_vip_hospitality_costing.py`

## Migration findings

| Severity | Issue | Description / impact | Addressed in this PR |
| --- | --- | --- | --- |
| Critical | Missing Oddsking (`OK%`) account exclusion | On-prem deliberately excludes `OK%` accounts; Glue could load them | **Yes** |
| Critical | FullName / Username not selected | Attributes missing downstream | **No** — already resolved in DEV (Sowmiya) |
| Critical | AccountNumber dropped before sync | Reconciliation column missing | **No** — already on gold (Sowmiya) |
| Medium | AccountNumber trim vs SQL | Minor match-rate drift | **No** — already aligned (Sowmiya) |

## Description

### Changes

* **OK% exclusion** — Iceberg read filters `AND account_number NOT LIKE 'OK%'`
  before player enrichment and Redshift MERGE. Forward-only: stops future
  Oddsking rows entering gold; does not rewrite existing rows. Same pattern as
  `uk_digital_dimension_cdd_risk_assessment_reporting_data` and legacy proc
  (`WHERE T1.AccountNumber NOT LIKE 'OK%'`).

**File changed:**

* `glue-jobs/uk/digital/dimension/uk_digital_dimension_vip_hospitality_costing.py`

**Commit:** `713f8ccf`

## DEV validation evidence

**Compare pair:** test SQL Server (`EnterpriseDataMartUnity`) → DEV Redshift
(`uk_digital.dimension.vip_hospitality_costing`)

**Scope validated:** OK% exclusion only (per Sowmiya — other Criticals already
closed in DEV).

| Check | Result |
| --- | --- |
| Jenkins `dev` apply | Complete |
| Gold reload | **Not required** — forward-only filter; gold already clean |
| DEV total rows | 1,311 |
| DEV `OK%` rows | **0** |
| `account_number`, `username`, `full_name` | Populated |
| BK overlap (test SQL → DEV) | **298 / 298** SharePoint IDs match (`event_name`, `account_number` 100%) |

**Row-count note:** test SQL dimension has **295** rows vs DEV **1,311** because
test Unity holds a partial SharePoint snapshot (~23% of DEV business keys).
All test-SQL keys present in DEV with matching attributes — not a watermark or
duplicate issue (`COUNT(*) = COUNT(DISTINCT viphospitality_costing_bk)`).

Jira DEV validation comment posted 2026-09-01.

## Type of change

- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Post-merge ops (manual)

1. **Prod reload:** **Not required** — prod verified **0** `OK%` rows (1,311
   total, 2026-09-01). No `prod-redshift_cleanup_tables`. No backup.
2. Run `prod_uk_digital_dimension_vip_hospitality_costing` **≥ 2 times**
   (defaults only).
3. Smoke: `SELECT COUNT(*) FROM dimension.vip_hospitality_costing WHERE
   UPPER(account_number) LIKE 'OK%'` → **0**.
4. Re-validate as **test SQL Server → prod Redshift**; attach evidence in Jira
   DE-9570 (**Post-deploy prod validation**).

## Reviewer notes

* INNER JOIN on `dimension.player` in the Redshift fetch is intentional —
  costing rows without a player match still flow via LEFT JOIN on the Spark
  side; early exit only when **no** player matches exist in the batch.
* MERGE key remains `shpt_viphospitality_costing_id` (1:1 with SharePoint BK).
* No Terraform change in this PR.

## How to test

1. Run `dev_uk_digital_dimension_vip_hospitality_costing` (defaults).
2. Confirm job SUCCESS.
3. `SELECT COUNT(*) FROM dimension.vip_hospitality_costing WHERE UPPER(account_number) LIKE 'OK%'` → **0**.
