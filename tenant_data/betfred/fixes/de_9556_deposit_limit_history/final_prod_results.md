# PASTE INTO JIRA (DE-9556) — copy everything below this line

## Prod validation — deposit_limit_history (2026-08-25)

**Compare pair:** test SQL Server (`BGB-BT-SQL-01` / `EnterpriseDataMartUnity.Dimension.DepositLimitHistory`) → **prod Redshift** (`uk_digital.dimension.deposit_limit_history`)

**Window:** April 2024 (`ValidFromUTC` / `valid_from`)  
**PK:** `(account_history_log_id, player_deposit_limit_bk)`  
**Gate:** presence ≥ 90% (`matched / (matched + SQL-only + RS-only)`)

### Presence (composite PK)

| Metric | Value |
|---|---:|
| SQL rows (test) | 24,684 |
| Prod Redshift (April 2024) | 24,774 |
| Matched | 23,973 |
| SQL only | 711 |
| RS only | 801 |
| **Presence** | **94.07% PASS** (≥ 90%) |

Residual SQL-only is mostly expected legacy **`player_deposit_limit_bk = -1`** grain plus a small leftover. Prod RS-only is higher than DEV (801 vs 287); presence still clears the gate.

### Vs DEV (same window / same test SQL)

| | DEV reload (2026-08-25) | Prod reload (2026-08-25) |
|---|---:|---:|
| Presence | **96.00% PASS** | **94.07% PASS** |
| Matched / only_sql / only_rs | 23,973 / 711 / 287 | 23,973 / 711 / 801 |
| SQL / RS rows | 24,684 / 24,260 | 24,684 / 24,774 |

### Context

Prod gold dropped and DynamoDB audit cleared via `prod-redshift_cleanup_tables`, then `prod_uk_digital_dimension_deposit_limit_history` reloaded. Fixes include LEFT JOIN + `-1` sentinel, valid-only `is_first_dl`, `customer_id_legacy`, London `is_current`, `valid_from = valid_from_utc`, history fetch excluding `sgp_player_id = -1`, and shared `configure_spark`.

### Verdict

**PASS** — prod post-reload presence gate met (April 2024, test SQL → prod Redshift). PR merged; cleanup + reload complete. Closing ticket.
