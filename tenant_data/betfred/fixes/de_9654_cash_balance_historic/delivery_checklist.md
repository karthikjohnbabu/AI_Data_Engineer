# Dimension delivery checklist — DE-9654 `cash_balance` (historic)

One checklist per ticket — tick when **done**. **HUMAN OK** needs Prasath yes.

## Header

| Field | Value |
|---|---|
| **Jira** | [DE-9654](https://betfred.atlassian.net/browse/DE-9654) |
| **Dimension** | `cash_balance` (historic) |
| **Glue job (live)** | `uk_digital_dimension_cash_balance` |
| **Extract job** | `{env}-sql-server-extraction` |
| **Arrange job** | `{env}-arrange-parquet-processing` |
| **Compare profile** | `mappings/complex_dims/cash_balance.yaml` |
| **Solution** | `fixes/.../proposed_solution.html` (one-off; EXAMPLES) |
| **Gate contract** | Pre-cutoff history; BK `(player_bk, balance_date)`; date-gated MERGE |
| **Blocked by** | Andrew: cutoff, JDBC, BAU/index, vCashBalance PlayerBK |
| **Started** | 2026-09-08 |
| **Closed** | |

---

## Phase 0 — Triage & solution

| Done | Step | Notes |
|:---:|---|---|
| [x] | Ground work / live counts | Pre-Jul 42.7M; CDC from 2025-06-16 |
| [x] | `proposed_solution.html` | **Chooser** → S1 hybrid / S2 one-shot (both kept) |
| [x] | `proposed_solution_1.html` | **Year-by-year to RS** (A→B→C per year; camera last) |
| [x] | `proposed_solution_2.html` | One-shot + Quick test |
| [ ] | Run Quick test Q1–Q11 yourself | Tick on ticket; includes real DEV/PROD S3 paths |
| [ ] | Andrew picks S1 vs S2 (+ cutoff / JDBC / BAU) | Open |

---

## Phase 1 — Prerequisites

| Done | Step | Notes |
|:---:|---|---|
| [ ] | DE-9554 camera tip OK in prod | Before historic seed |
| [ ] | Compare YAML PK → `player_bk, balance_date` | Before validate |

---

## Phase 2 — Build + DEV runbook

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [ ] | Add `cash_balance_legacy.json` | — | etl-customer |
| [ ] | Tip cash_balance dim initial_load MERGE | — | Date gate `< cutoff` |
| [ ] | Jenkins DEV apply | **HUMAN OK** | |
| [ ] | DEV proof 2024 then year-by-year loop (A→B→C ×5) | **HUMAN OK** | `partition_column=BalanceDate`, `partition_column_type=date`, `num_partitions=1`, serial only |
| [ ] | Arrange + Athena ≈ SQL | — | |
| [ ] | Initial_load gold + camera ≥2× | **HUMAN OK** | Watch 120m dim timeout |
| [ ] | Min tests T1–T6 | — | See proposed_solution §6 |

---

## Phase 3 — Prod

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [ ] | Prod extract → arrange → gold → camera | **HUMAN OK** | Same runbook |
| [ ] | Post-deploy validation + Jira | **HUMAN OK** | Self-contained |

---

## Permission log

| When | Action | Prasath said |
|---|---|---|
| 2026-09-09 | Finalise solution: MERGE vs UNION, operator steps, EXAMPLES | Yes — strip over-engineered; no strike; more EXAMPLES |
| 2026-09-09 | Rules: one-off Content MUST (no SFN/DDB EXAMPLES required) | Locked |
| 2026-09-09 | Add SQL partition/perf guardrails to S1 + rule + skill | Done (date partition strategy now mandatory) |
| 2026-09-09 | Jira paste: hop jobs + JSON + researched vs to-do | S1 + rule + skill updated |
