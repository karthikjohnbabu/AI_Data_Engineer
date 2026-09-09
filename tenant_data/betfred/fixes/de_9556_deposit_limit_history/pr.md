**PR title:** `feature/de-9556 dimension deposit limit history`

**Source branch:** `feature/de-9556-dimension-deposit-limt-histy` → **main**

---

Copy everything below into the Bitbucket PR description.

When pasting into Bitbucket, **attach / paste** the two PNG screenshots
(`customer_id_legacy_before.png` and `customer_id_legacy_after.png`) under
the CustomerID section (local paths will not render for reviewers).

---

# DE-9556 — Dimension Deposit Limit History migration fix

Fix silent row loss and business-flag parity in `uk_digital_dimension_deposit_limit_history.py` so gold can reach the ≥90% presence bar vs SQL Server `[Dimension].[DepositLimitHistory]`.

Linked Jira ticket: [DE-9556](https://betfred.atlassian.net/browse/DE-9556)

Fixes #DE-9556

## Context

SQL Procedure: `XtrlTransform.usp_etl_table_transform_1_dimension_DepositLimitHistory`

Glue Job: `uk_digital_dimension_deposit_limit_history.py`

## Migration findings

| Severity | Issue | Description / impact | Addressed in this PR |
| --- | --- | --- | --- |
| **Critical** | `is_first_dl` via `ROW_NUMBER()` over all rows (valid + invalid) | Accounts whose earliest record is invalid never get `FirstTime_DL = 1` | Yes — rank valid-only rows after valid/invalid split |
| **Critical** | Player enrich **INNER JOIN** vs legacy **LEFT JOIN** + `-1` sentinel | Deposit-limit records with no matching player silently dropped (safer-gambling risk) | Yes — LEFT JOIN + `-1` sentinel on both enrich paths |
| **Critical** | `CustomerID` not populated in Glue | Downstream joins on `CustomerID` break silently | Yes — `customer_id_legacy` from `dimension.player` (+ DBA DDL for column) |
| **Medium** | `IsCurrent` / `LimitInPlace_Currently` timezone | Legacy compares naive `ValidFromUTC` to `GETDATE()` (UK local); Glue used UTC `current_timestamp()` | Yes — `from_utc_timestamp(current_timestamp(), 'Europe/London')` |
| **Medium** | `valid_from` used `COALESCE(effective_from_utc, valid_from_utc)` | Shifted window dates vs legacy `ValidFromUTC` (= `valid_from_utc` only) → false April presence miss | Yes — `pdl.valid_from_utc AS valid_from` |
| **Medium** | `sgp_player` / `sgp_currency` declared but never used | Dead code | Yes — removed unused table refs |
| ~~Medium~~ | ~~Watermark `ds_tsprocessed` vs `DateLastModified`~~ | ~~Struck on ticket~~ | Out of scope |
| Enhancement | DynamoDB-backed job status tracking | Already present | No change |

## Description

### Changes

* `4aca14ac` — fix silent row loss and `is_first_dl` in deposit limit history

  Player enrich used INNER JOIN to Redshift `dimension.player`, so unmatched accounts lost
  every deposit-limit event with no error. Switched both enrich paths to LEFT JOIN + `-1`
  sentinel for `sgp_player_id`, matching legacy `ISNULL(p.PlayerID, -1)`.
  `account_number` falls back to the limit-event join column when the player side is null
  so downstream window functions do not collapse on a shared null.

  `is_first_dl` / `FirstTime_DL` used `ROW_NUMBER()` over all rows (valid + invalid). If
  the earliest row for an account was invalid, no later valid row could get first-time DL.
  Moved the rank to the valid-only subset after the valid/invalid split, matching the
  legacy procedure CTE.

  Removed unused `sgp_player` / `sgp_currency` table references.

* `141fd9fc` — add `customer_id_legacy` and fix PK / `is_current` parity

  Populated `customer_id_legacy` from `dimension.player` with `-1` sentinel when
  unmatched (legacy `CustomerID` / Optima customer id).

  Normalised `account_history_log_id = -1` on all output rows so MERGE-on-BK aligns
  with the composite compare key.

  `is_current` and `limit_in_place_currently` now use
  `from_utc_timestamp(current_timestamp(), 'Europe/London')` for parity with legacy
  `GETDATE()` on SQL Server.

  Invalid-row delete in staging uses `player_deposit_limit_bk` only, aligned with
  `--primary_keys`.

* Tip — `valid_from` = `valid_from_utc` only (no `COALESCE` with `effective_from_utc`)

  Aligns the gold window column with legacy `ValidFromUTC`.

* Tip — historical gold lookup skips `sgp_player_id = -1`

  Driving batch for `fetch_historical_records` is filtered to real player ids
  only, so unmatched sentinels do not pull every `-1` gold row into one
  LAG/LEAD window.

* Tip — shared `configure_spark` / `create_glue_runtime` (Dom review)

  Removed local `configure_spark()` + `init_spark`. Uses
  `utilities.glue_spark_config` with **no `extra_conf`** (previous `conf.set`
  values are shared defaults). Worker-type-aware AQE/shuffle tuning applies
  automatically.

**File changed:** `glue-jobs/uk/digital/dimension/uk_digital_dimension_deposit_limit_history.py`

**Formatting:** Quote style / layout diffs (e.g. `args['JOB_NAME']` → `args["JOB_NAME"]`) are from
repo **`ruff format`** (pre-commit; see `docs/CONTRIBUTING.md`, `.pre-commit-config.yaml`,
`pyproject.toml`). Behaviour unchanged — not a manual style rewrite.

## Validation evidence

**Compare pair:** **test SQL Server** (`BGB-BT-SQL-01` /
`[EnterpriseDataMartUnity].[Dimension].[DepositLimitHistory]`) → **DEV Redshift**
(`uk_digital.dimension.deposit_limit_history`).

**Window:** **April 2024** (`ValidFromUTC` / `valid_from`, 2024-04-01 → 2024-04-30 inclusive).

**PK:** `(account_history_log_id, player_deposit_limit_bk)`.

### Presence (composite PK) — before → after

| | Before (`valid_from` COALESCE bug) | After tip reload (2026-08-24) | After tip + history `-1` filter (2026-08-25 full reload) |
|---|---:|---:|---:|
| SQL rows (test) | 25,220 | 25,220 | 24,684 |
| DEV Redshift (April 2024) | 24,254 | 24,796 | 24,260 |
| Matched | 23,342 | **24,508** | **23,973** |
| SQL only | 1,878 | **712** | **711** |
| RS only | 912 | **288** | **287** |
| **Presence** | **89.32% FAIL** (&lt; 90%) | **96.08% PASS** (≥ 90%) | **96.00% PASS** (≥ 90%) |

`presence = matched / (matched + SQL-only + RS-only)`. Residual SQL-only is mostly expected legacy **`player_deposit_limit_bk = -1`** grain plus a small leftover. Absolute SQL/RS row counts move slightly between test mart refreshes; the gate is presence ≥ 90%.

### `customer_id_legacy` — before → after

**Before** — DEV backup schema fields (no `customer_id_legacy`; no table-name chrome).

![BEFORE — schema fields, no customer_id_legacy](evidence/customer_id_legacy_before.png)

**After** — DEV gold sample with `customer_id_legacy` populated (Export/Chart chrome only).

![AFTER — customer_id_legacy populated](evidence/customer_id_legacy_after.png)

Intersection attribute match for `customer_id_legacy` vs test SQL Server `CustomerID`: **100%**.

## Type of change

- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Post-merge ops (manual)

1. **Prod gold:** **DROP** `uk_digital.dimension.deposit_limit_history` (Glue recreates on next run — includes `customer_id_legacy`). Do not manually CREATE empty gold. **No backup.**
2. **Watermark reset (prod):** set SUCCESS row `audit_sequence_time` to `1970-01-01 00:00:00.000000` on the prod job component.
3. Run `dimension.player`, then `uk_digital_dimension_deposit_limit_history` **≥ 2 times**.
4. Re-validate **April 2024** as **test SQL Server → prod Redshift**; attach evidence in Jira DE-9556.

## Reviewer notes

- Treat every player INNER JOIN as a silent row-deleter — both enrich paths must be LEFT + sentinel.
- MERGE key is **BK only** (`player_deposit_limit_bk`); expect some residual grain asymmetry from legacy `bk = -1` rows after reload.
- `valid_from` must stay `valid_from_utc` (legacy `ValidFromUTC`) — do not reintroduce `COALESCE` with `effective_from_utc`.
- No Glue job rename — DynamoDB watermark component unchanged.
- Evidence above is **test SQL → DEV Redshift, April 2024** only; prod gold needs a separate post-merge compare.
- Large non-logic diffs in the Glue file are **ruff format** (project standard), not functional churn.
- Historical re-fetch must never key on `sgp_player_id = -1` (shared unmatched cohort).

---

# PASTE INTO BITBUCKET PR COMMENT (copy everything below this line)

## DEV validation update (2026-08-25)

**Compare pair:** test SQL Server (`BGB-BT-SQL-01` / `EnterpriseDataMartUnity`) → **DEV Redshift** (`uk_digital.dimension.deposit_limit_history`)

**Window:** April 2024 (`ValidFromUTC` / `valid_from`)

Full reload after tip fix (history fetch excludes `sgp_player_id = -1`).

### Presence (composite PK) — before → after

| | Before (`valid_from` COALESCE bug) | After tip reload (2026-08-24) | After tip + history `-1` filter (2026-08-25 full reload) |
|---|---:|---:|---:|
| SQL rows (test) | 25,220 | 25,220 | 24,684 |
| DEV Redshift (April 2024) | 24,254 | 24,796 | 24,260 |
| Matched | 23,342 | **24,508** | **23,973** |
| SQL only | 1,878 | **712** | **711** |
| RS only | 912 | **288** | **287** |
| **Presence** | **89.32% FAIL** (&lt; 90%) | **96.08% PASS** (≥ 90%) | **96.00% PASS** (≥ 90%) |

`presence = matched / (matched + SQL-only + RS-only)`. Residual SQL-only is mostly expected legacy **`player_deposit_limit_bk = -1`** grain plus a small leftover.

### Tip covered by this reload

* Historical gold lookup skips `sgp_player_id = -1` so unmatched sentinels do not share one LAG/LEAD window.

### Post-merge ops (prod)

1. Backup then **DROP** `uk_digital.dimension.deposit_limit_history` (Glue recreates on next run — includes `customer_id_legacy`). Do not manually CREATE empty gold.
2. Reset SUCCESS watermark `audit_sequence_time` to `1970-01-01 00:00:00.000000`.
3. Run `dimension.player`, then `uk_digital_dimension_deposit_limit_history` **≥ 2 times**.
4. Re-validate April 2024 as **test SQL Server → prod Redshift**; attach evidence on DE-9556.

---

# PASTE INTO BITBUCKET PR COMMENT (copy everything below this line)

## Follow-up: shared `configure_spark` (Dom review)

Replaced the local `configure_spark()` / `init_spark` bootstrap with the shared
module from `data-platform-glue-etl-common`:

```python
from utilities.glue_spark_config import configure_spark, create_glue_runtime

conf = configure_spark()
runtime = create_glue_runtime(conf)
spark, glueContext, job = runtime.spark, runtime.glue_context, runtime.job
```

Compared every previous `conf.set(...)` against the shared defaults — catalog,
Iceberg/Parquet rebase, UTC, and AQE flags are all covered. **No `extra_conf`**
needed for this job. Shared module also applies worker-type-aware AQE/shuffle
tuning (G.1X / G.2X / …), which should improve prod runtime.
