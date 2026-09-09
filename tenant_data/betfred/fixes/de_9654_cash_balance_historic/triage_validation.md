# DE-9654 — triage validation (one-stop)

**Primary ticket home** for historic CashBalance feasibility. Keep in sync with
**full** `triage_validation.html` (DE-9549 depth — not a stub). Workflow design:
[`proposed_solution.html`](proposed_solution.html) (AWS-verified NEW
`ETLHistoricBackfillControl` + SFN; L5 artefact audit-clean Jira §14). Narrative twin:
`dimensions/in_progress/de_9654_cash_balance_historic.md`.

| Field | Value |
|---|---|
| **Jira** | [DE-9654](https://betfred.atlassian.net/browse/DE-9654) |
| **Related Done** | [DE-9554](https://betfred.atlassian.net/browse/DE-9554) |
| **Sibling** | [DE-9655](https://betfred.atlassian.net/browse/DE-9655) historic label history |
| **Ground work date** | 2026-09-08 |
| **Classification** | `historic-backfill` / `curated-gap` |
| **Jira status** | Blocked (waiting extract walkthrough + DE-9554 prod delta sign-off) |

---

## Layman verdict

AWS cannot rebuild **pre–mid-June 2025** cash-balance history from CDC. SQL mart
has **~43M** rows before July 2025 on a **HEAP**. Feasible path: **chunked SQL
extract** of `Dimension.CashBalance` / `vCashBalance` via
`prod-sql-server-extraction`, merge like self_exclusion, then gold validation.
Do **not** start by dumping Sharp audit into Iceberg (already 6.6B CDC rows).

---

## Compare pair (counts only — no full `compare.py` yet)

**test SQL Server** (`BGB-BT-SQL-01`, Unity) ↔ **prod Athena** (Iceberg) +
**prod Redshift** (`uk_digital.dimension.cash_balance`).

Window: full table / natural history (feasibility, not attribute gate).

---

## Row counts

| System | Object | Rows | Min date | Max date | Notes |
|---|---|---|---|---|---|
| SQL | `Dimension.CashBalance` | 103,767,561 | 2021-03-04 | 2026-09-08 | HEAP ~2.7 GB |
| SQL | Pre 2025-07-01 | **42,706,989** | — | — | Andrew’s ask |
| SQL | From 2025-07-01 | 61,060,572 | — | — | |
| Athena | `petfre_franchisedb.player_balances` | 6,582,111,383 | 2025-06-16 | 2026-09-08 | Glue source |
| Athena | Pre Jul (raw) | 225,733,535 | — | — | Only ~2 weeks before Jul |
| Athena | `sgp_player_balance` | 12,834,679 | 2025-10-03 | 2026-09-08 | Current-balance curated; **not** dim input |
| Redshift | `dimension.cash_balance` | 1,981,755 | 2026-08-26 | 2026-09-01 | Post DE-9554 tip window |

**Count mismatch — justification:** SQL ≫ Redshift is **expected** until historic
load + gold rebuild. Not a Glue tip bug for DE-9654.

**BK overlap:** not run yet (deferred until merge design + sample month load).

---

## Field / grain map (for later compare)

| SQL (`vCashBalance`) | Redshift | Notes |
|---|---|---|
| `PlayerBK` | `player_bk` | Base table has `PlayerID` only |
| `Balance` | `balance` | SQL money; RS decimal |
| `BalanceDate` | `balance_date` | SQL = load stamp; RS = event day (DE-9554) |

Profile: `mappings/complex_dims/cash_balance.yaml` (today `pk: player_bk` only —
**revisit** for historic multi-day validation; likely need `player_bk + balance_date`).

---

## Jira links followed

| Link | Where | What we did | Result |
|---|---|---|---|
| DE-9554 | Description / link | Full fetch + Done comments | Logic Done; historic spun to DE-9654 |
| `prod-sql-server-extraction` console URL | Resources | Mapped to etl-common TF + `sql_server_to_s3_parquet.py` | Correct tool |
| `prod_uk_digital_silver_player_disabled_history` | Description | Located silver job | Pattern reference |
| `prod_uk_digital_dimension_self_exclusion` | Description | Reads `dimension_self_exclusion_legacy` from migration parquet | **Best template** for Option A |
| Andrew Bowker comment | 2026-09-08 | Pre-Jul count + index check | 42.7M; HEAP |

---

## Related tickets — closed-claim audit

| Claim | Who | Column / topic | Live verify | Verdict |
|---|---|---|---|---|
| Change-only grain fixed | Ben / DE-9554 | `filter_changed_records` | Tip + gold dates recent only | PASS for logic |
| Need DMS/extract prior to July | Andy Lamb | Historic depth | Iceberg min 2025-06-16; SQL from 2021 | PASS — still needed |
| Done means historic loaded | Resolution | — | Gold 1.98M rows Aug only | **FAIL inherit** — use DE-9654 |
| 1-day BalanceDate offset explained | Ben 2026-09-02 | `BalanceDate` | Documented | PASS — compare caveat |

---

## Missing-column / API ladder

N/A — this is SQL mart / CDC historic, not an IMS report missing column.

---

## Feasibility board

| Option | Feasible? | When to use |
|---|---|---|
| **A. Extract `CashBalance` / `vCashBalance`** | **Yes** (with chunking / off-peak) | Default for DE-9654 |
| **B. Backfill Sharp audit → Iceberg** | Risky / large | Only if reporting must match event-time pre-2025 |
| **C. Hybrid A + Glue rebuild from CDC floor** | **Preferred end state** | After cutoff agreed |

### Ship vs leave

| Ship in DE-9654 | Leave / out of scope |
|---|---|
| Chunked SQL extract + merge + runbook | Re-open DE-9554 tip logic |
| Hybrid gold rebuild ≥ 2025-06-16 | Sharp audit dump as first move |
| BK validation after load | “Fix” 1-day BalanceDate by shifting SQL |

### Can vs cannot

| Can | Cannot |
|---|---|
| Load ~42.7M pre-Jul via DynamoDB queue + SFN (concurrency 1) | Rebuild 2021–mid-2025 from CDC alone |
| Reuse self_exclusion / DE-9655 pattern | Expect full SQL=RS counts before merge |

---

## Validation log

| When | Pair | What | Result |
|---|---|---|---|
| 2026-09-08 | test SQL | Pre-Jul / totals / indexes | 42.7M pre-Jul; HEAP |
| 2026-09-08 | prod Athena | player_balances / sgp_player_balance | CDC from 2025-06-16 |
| 2026-09-08 | prod RS | cash_balance aggregates | 1.98M; Aug 26–Sep 1 only |
| — | test SQL → RS BK | Attribute overlap | Not yet |

---

## What blocks Done

1. Nathan / Andrew extract walkthrough + BAU approval for HEAP scan  
2. Documented cutoff date (Jul 1 vs Jun 16)  
3. Merge target design (legacy Iceberg vs direct Redshift)  
4. DEV proof month  
5. Prod chunked load + gold validation + runbook  

**Close gate:** history present for cutoff + **test SQL → prod Redshift** BK
overlap on `(player_bk, balance_date)` + runbook on Jira.

---

## Reproduce commands (safe reads)

```sql
-- test SQL
SELECT COUNT(*) AS total_rows,
       SUM(CASE WHEN BalanceDate < '2025-07-01' THEN 1 ELSE 0 END) AS pre_jul
FROM EnterpriseDataMartUnity.Dimension.CashBalance WITH (NOLOCK);
```

```sql
-- Athena (prod)
SELECT COUNT(*) AS c, MIN(_cdc.ts) AS min_cdc, MAX(_cdc.ts) AS max_cdc
FROM petfre_franchisedb.player_balances;
```

```sql
-- Redshift (prod)
SELECT COUNT(*), MIN(balance_date), MAX(balance_date)
FROM dimension.cash_balance;
```
