**PR title:** `feature:/DE-9567: UK Digital dimension session_history migration fix`

**Source branch:** `feature/de-9567-dimension-session-history` → **main**

---

Copy everything below into the Bitbucket PR description.

---

# DE-9567 — Dimension Session History migration fix

Pair BVT login/logout events into sessions and load `uk_digital.dimension.session_history`, matching legacy SQL behaviour for pairing, watermark buffer, and per-player DELETE+INSERT.

Linked Jira ticket: [DE-9567](https://betfred.atlassian.net/browse/DE-9567)  
Fixes #DE-9567

## Context

**SQL procedure:** `XtrlTransform.usp_etl_table_transform_1_dimension_sessionhistory`  
**Glue job:** `uk_digital_dimension_session_history.py`  
**Gold:** `uk_digital.dimension.session_history`  
**Sources:** Iceberg `bvt_action`, `bvt_action_type`, `sgp_player`

## Migration findings

| Severity | Issue | Description / impact | Addressed in this PR |
| --- | --- | --- | --- |
| Critical | C1 — SQL DELETE+INSERT history shape | Legacy deletes all session rows for touched players and re-inserts only the current window; SQL mart is not a full historical archive. Glue must mirror DELETE+INSERT, not accumulate orphan sessions via MERGE-only. | **Yes** — `delete_from_redshift` on batch `player_bk` values, then `redshift_sync` MERGE on `bvt_action_id`. |
| Critical | C2 — Wrong logout pairing | Glue paired each login to the **latest** subsequent logout; SQL pairs to the **next** logout before the next login. Overstated session duration for multi-session players. | **Yes** — `pair_logins_to_logouts`: `lead(Login)` + bounded join + `min(Logout)`. |
| Critical | C3 — Player key on gold | Legacy exposes platform player id (`PlayerID` via `Sharp.Player`); gold lacked `sgp_player_id`. | **Yes** — `sgp_player_id` hex-encoded from Iceberg `sgp_player` (same join as legacy). Grain remains `bvt_action_id` / login event. |
| Medium | M1 — No 2-hour watermark buffer | SQL subtracts 2 hours from audit sequence; Glue had no equivalent lag buffer on `bvt_action.date_stamp`. | **Yes** — `data_fetch_delay_in_minutes=120` on `get_last_success_time`. |
| Medium | M2 — Watermark advance semantics | SQL uses `MAX(LoginDate)` on target; Glue uses DynamoDB SUCCESS watermark. | **Accepted** — platform-standard job control retained; documented. |
| Medium | M3 — Late-arriving logout | Neither side fully closes sessions when logout arrives much later. | **Improved** — pairing fix + buffer; small residual edge cases possible. |
| Medium | M4 — MERGE primary key | Risk if MERGE keyed on `player_bk` alone (one session overwrites another). | **Confirmed** — Terraform `--primary_keys` = `bvt_action_id` (login action id). |
| ~~Enhancement~~ | Empty-result guard | Avoid unnecessary Redshift round-trip. | Out of scope (existing behaviour). |
| ~~Enhancement~~ | `bvt_action_id` as natural key | Stable login grain. | Already present. |
| ~~Enhancement~~ | Non-destructive UPSERT vs SQL wipe | Documented under C1. | Addressed via C1 DELETE path. |

## Description

### Changes

* **C2 — Session pairing** — Each login is paired with the earliest logout strictly after that login and strictly before the next login for the same player (`pair_logins_to_logouts`). Fixes overstated durations when multiple sessions exist in one batch.

* **C1 — SQL-style per-player wipe** — For every `player_bk` with login/logout events in the incremental batch, delete existing gold rows for that player, then insert this run’s paired sessions. Matches legacy `DELETE` + `INSERT` in `usp_etl_table_transform_1_dimension_sessionhistory`.

* **M1 — 2-hour lookback** — Watermark minus 120 minutes on `date_stamp` filter, aligned with legacy `DATEADD(HOUR, -2, …)` audit buffer.

* **C3 — `sgp_player_id` on gold** — INNER join `sgp_player` on `player_bk`; `hex(sgp_player_id)` for Redshift `VARCHAR` (source is `VARBINARY` in Iceberg).

* **Shared Spark bootstrap** — `configure_spark` / `create_glue_runtime` from common library (Iceberg catalog, AQE, UTC).

* **Terraform** — `--catalog_name` = `awsdatacatalog` (required for shared `configure_spark`); `max_concurrent_runs = 1` (required for `delete_from_redshift` staging — same as `time_spent`).

* **Gold missing after intentional DROP** — `check_target_table_exists` (re-raises non–missing-relation errors); `redshift_recreate` when gold absent (CREATE + load from frame). Skip `delete_from_redshift` when table does not exist. No manual external CREATE.

**Files changed:**

* `glue-jobs/uk/digital/dimension/uk_digital_dimension_session_history.py`
* `tf/uk_digital_dimension_session_history.tf` (`catalog_name` only)

## DEV validation evidence (required before merge to main)

**Compare pair:** test SQL Server (BGB-BT / Unity `Dimension.SessionHistory`) → **DEV Redshift** `uk_digital.dimension.session_history`  
**Window:** 2024-04-01 → 2024-04-30 (inclusive)  
**Join key:** `player_bk` + `logindate`  
**Reload note:** DEV gold was DROPped + watermark reset to epoch; job took **recreate** path (`ds_tsprocessed` single timestamp for full table). Validates correct pairing and load shape; incremental MERGE-only path continues on scheduled runs once gold exists.

### Presence and attributes — April 2024 (after tip reload)

| Check | Result |
| --- | --- |
| SQL rows (window) | 688,609 |
| SQL-only (`player_bk` + `logindate`) | **0** |
| Intersection rows | 688,609 |
| `logoutdate` match on intersection | **99.71%** (686,593 / 688,609) |
| Null logout % (SQL / RS) | ~89.5% / ~87.6% (legacy-consistent) |

**Gate:** SQL keys present in gold + high logout match on intersection. **Not** equal total row counts (see Reviewer notes).

**Place 1 (pre-DEV):** Athena Iceberg tip vs test SQL on same window — ~99.74% logout match on intersection (pairing logic gate before deploy).

### New column — `sgp_player_id`

Populated on gold after tip deploy (hex platform player id). Attach Redshift column screenshot to Jira if prod gold requires Liquibase `ALTER` before first prod run.

## Type of change

- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature
- [ ] Breaking change
- [x] Documentation update (job module docstring)
- [ ] Infrastructure / Terraform

## Testing evidence

- [x] Deployed to **DEV** via Jenkins (`dev` branch)
- [x] Glue job `dev_uk_digital_dimension_session_history` run successfully after watermark reset + gold DROP (defaults only)
- [x] Compare: test SQL → DEV Redshift, April 2024 — 0 SQL-only; 99.71% `logoutdate` on intersection
- [ ] PROD Terraform plan reviewed (pending — single TF line: `catalog_name`)
- [ ] Prod compare (Place 3) after prod deploy

## Post-merge ops (manual)

1. **Prod gold:** **DROP** `uk_digital.dimension.session_history` (Glue recreates on next run via `redshift_recreate` — includes `sgp_player_id`). Do not manually CREATE empty gold. No backup.
2. **Watermark reset (prod):** set SUCCESS row `audit_sequence_time` to `1970-01-01 00:00:00.000000` on the prod job component (`prod_uk_digital_dimension_session_history#prod_uk_digital_dimension_session_history#session_history` — re-scan `prod-ETLJobControl` before update).
3. Run `prod_uk_digital_dimension_session_history` **≥ 2 times** (defaults only — no console parameter overrides).
4. Re-validate **April 2024** as **test SQL Server → prod Redshift**; attach evidence in Jira DE-9567.

**Note:** Existing prod gold built with old logout pairing keeps wrong durations for players with no further BVT activity until a full reload (steps 1–3). Coordinate with reporting before prod DROP (no backup).

## Reviewer notes

* **Validation contract:** RS row counts for a month can be **much higher** than SQL (April: ~7.8M vs ~689k) because legacy DELETE+INSERT does not retain full per-player history while a full Iceberg-driven reload can. **Do not fail on total counts.** Gate = **0 SQL-only** on `(player_bk, logindate)` + **~99%+** `logoutdate` on intersection.

* **INNER JOIN** `sgp_player` — logins for players missing from `sgp_player` are dropped silently; acceptable if master is complete.

* **DELETE scope** — only `player_bk` values in the current batch; players with no new events since watermark are untouched (same as incremental SQL scope).

* **MERGE key** `bvt_action_id` — one row per login event; safe for multiple sessions per player.

* **Catalog** — must stay `awsdatacatalog` with shared `configure_spark`; `AwsDataCatalog` fails at runtime.

* **No manual Glue parameter overrides** — fix is in TF + script; run with deployed defaults only.

## Commits (feature branch)

* `fe041c86` — C2 pairing, M1 −2h watermark, C1 DELETE+INSERT, shared `configure_spark`
* `a75be320` — `sgp_player_id` on gold (hex)
* `b6240a19` — TF `catalog_name` → `awsdatacatalog`
* `964ee475` — `redshift_recreate` when gold missing
* *(latest)* — AI review: `max_concurrent_runs = 1`; safer `check_target_table_exists`

## AI code review follow-up (PR #757)

Addressed **REQUEST CHANGES** from `dp-ai-code-review`:

* **`max_concurrent_runs = 1`** — `delete_from_redshift` uses fixed staging table `staging_delete_session_history`; serialise runs (documented on `time_spent`).
* **`check_target_table_exists`** — only `"does not exist"` → missing gold; connection/permission errors fail the job instead of calling `redshift_recreate`.

**Accepted parity (no code change):** per-player DELETE from batch `player_logs_df` + INNER JOIN `sgp_player` on insert; logout-only players wiped without reinsert — matches `usp_etl_table_transform_1_dimension_sessionhistory` (`#PlayerLogs` DELETE, `#Output` INSERT).

---

# PASTE INTO BITBUCKET PR COMMENT (copy everything below this line)

**AI review follow-up (pushed to feature branch + merged to `dev`):**

1. **`max_concurrent_runs = 1`** in `uk_digital_dimension_session_history.tf` — `delete_from_redshift` staging is not safe with overlapping runs (same pattern as `time_spent`).
2. **`check_target_table_exists`** — re-raise unless error is missing relation; avoids misrouting transient Redshift errors to `redshift_recreate`.

**Legacy parity (unchanged, documented):** DELETE scope = all `player_bk` in `#PlayerLogs` / batch logs; INSERT only after INNER JOIN `Sharp.Player` / `sgp_player`. Logout-only touches still delete gold without reinsert — matches legacy proc.

Please re-run Jenkins PR build or comment `/ai-review` when convenient.
