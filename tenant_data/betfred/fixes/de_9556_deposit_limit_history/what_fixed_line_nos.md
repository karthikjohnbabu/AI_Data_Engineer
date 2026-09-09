# DE-9556 — what fixed (line numbers)

Personal reference for `uk_digital_dimension_deposit_limit_history.py` in
`data-platform-glue-etl-transactional-data-jobs`. Ignore quote/`ruff` churn;
these are the Jira logic spots.

Line numbers are as of the tip used for the PR (file ~1115 lines). Re-check
if the file is reformatted again.

## 1. Sentinels + London “now” (Critical / Medium timezone)

**Lines ~71–79**

- `ACCOUNT_HISTORY_LOG_ID_DEFAULT = -1`
- `PLAYER_ID_DEFAULT = -1`
- `CUSTOMER_ID_LEGACY_DEFAULT = -1`
- `IS_CURRENT_NOW_EXPR` =
  `from_utc_timestamp(current_timestamp(), 'Europe/London')`

## 2. `valid_from` = `valid_from_utc` only + `account_history_log_id = -1`

**Lines ~283–286** (in `fetch_deposit_limits`)

- `{ACCOUNT_HISTORY_LOG_ID_DEFAULT} AS account_history_log_id`
- `pdl.valid_from_utc AS valid_from`
- No `COALESCE` with `effective_from_utc` (April presence fix)

Also fixed at **-1** again on final select: **~782**.

## 3. Player enrich LEFT JOIN + `customer_id_legacy` (Critical)

**First enrich — `enrich_with_player_data` ~384–399**

- `join(..., "left")`
- `coalesce(sgp_player_id, PLAYER_ID_DEFAULT)`
- `coalesce(customer_id_legacy, CUSTOMER_ID_LEGACY_DEFAULT)`
- Fetches `customer_id_legacy` in columns list ~356

**Final enrich — ~851–882**

- Same LEFT + sentinel pattern on `account_number`

## 4. `is_first_dl` on valid rows only (Critical FirstTime_DL)

**Lines ~633–657** (`categorise_deposit_limit_actions`)

- Split invalid / valid
- `ROW_NUMBER()` only on valid subset → `is_first_dl`

## 5. `is_current` / `limit_in_place_currently` use London time

**Lines ~824–846**

- Compare `valid_from` / lead window to `{IS_CURRENT_NOW_EXPR}`

## 6. Historical fetch excludes sentinel `-1` (bot HIGH)

**`fetch_historical_records`** — filter driving batch to real
`sgp_player_id` before gold lookup (not `PLAYER_ID_DEFAULT` / -1).

Prevents every unmatched account’s gold rows being LAG/LEAD-windowed as one
`account_number`. Unmatched current events still write; they skip
sentinel-keyed history re-pull.

## Quick map

| Jira finding | Lines (approx.) |
|---|---|
| INNER → LEFT + `-1` | enrich + final prepare |
| `customer_id_legacy` | enrich + final prepare |
| `is_first_dl` valid-only | `categorise_deposit_limit_actions` |
| London `is_current` | `IS_CURRENT_NOW_EXPR` + final SQL |
| `valid_from` / April presence | `fetch_deposit_limits` |
| `account_history_log_id = -1` | constants + selects |
| No history lookup on `sgp_player_id=-1` | `fetch_historical_records` |

Docstring summary: module header Loading strategy.
