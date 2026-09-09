# DE-9570 — Post-deploy prod validation

**Date:** 2026-09-02  
**Pair:** test SQL Server → prod Redshift (`uk_digital.dimension.vip_hospitality_costing`)  
**PR:** #764 merged to `main` (`89d0b317`)  
**Business key:** `viphospitality_costing_bk` (= SharePoint list `ID` / `VIPHospitalityCostingBK`)

## Deploy evidence

| Check | Result |
|---|---|
| Prod S3 script | `UPPER(trim(account_number)) NOT LIKE 'OK%'` |
| Jenkins `main` apply | Complete |
| Prod Glue runs (2026-09-02) | 09:40 SUCCEEDED, 15:11 SUCCEEDED |
| Gold reload | **Not required** — no cleanup job |

## Prod smoke (live query)

```sql
SELECT COUNT(*) AS total_rows,
       SUM(CASE WHEN UPPER(account_number) LIKE 'OK%' THEN 1 ELSE 0 END) AS ok_prefix_rows
FROM dimension.vip_hospitality_costing;
```

| total_rows | ok_prefix_rows |
|---:|---:|
| 1,311 | 0 |

## Business key overlap (test SQL Server → prod Redshift)

Source: test Unity `Sharepoint.VIPHospitalityCosting` (298 staging BKs) vs prod gold.
Same evidence as DEV validation — prod row count unchanged after deploy.

| Metric | Prod |
|---|---|
| Test SQL staging BKs | 298 |
| Prod gold BKs | 1,311 |
| **Intersection (SQL BKs found in prod)** | **298 / 298 (100%)** |
| SQL-only BKs | **0** |
| Prod-only BKs | 1,013 (partial test Unity snapshot — live SharePoint feed) |
| Attribute match on 298 shared BKs | `event_name` **100%**, `account_number` **100%** |
| Duplicate BKs in prod | **0** (`COUNT(*) = COUNT(DISTINCT viphospitality_costing_bk)`) |

**Count mismatch note:** SQL dimension view **295** rows vs prod **1,311** — test Unity
holds ~23% of live SharePoint IDs; every test-SQL BK present in prod with matching attributes.

## Verdict

**PASS** — Oddsking exclusion deployed; prod smoke clean; **100% BK overlap** on test SQL scope.
