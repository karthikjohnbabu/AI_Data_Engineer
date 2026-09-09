# Dimension delivery checklist — DE-9655 `player_customer_label_history` (historic backfill)

One checklist per dimension — tick when **done**. Agent: continue from first unchecked row.

## Header

| Field | Value |
|---|---|
| **Jira** | [DE-9655](https://betfred.atlassian.net/browse/DE-9655) |
| **Dimension** | `player_customer_label_history` |
| **Glue job** | `uk_digital_dimension_player_customer_label_history` |
| **Compare profile** | `mappings/complex_dims/player_customer_label_history.yaml` |
| **Triage doc** | `dimensions/in_progress/de_9655_player_customer_label_history.md` |
| **Feature branch** | TBD — may be **ops-only** (no Glue code change) |
| **Validation window** | Full history + spot windows pre/post Jul 2025 |
| **Gate contract** | Curated pre-Jul 2025 present; BK overlap; `is_current` one per player |
| **Blocked by** | DE-9563 prod delta proof + Nathan/Andrew historic extract walkthrough |
| **Started** | 2026-09-02 |
| **Closed** | |

**Ticket scope:** DMS / SQL extract → merge **curated** `sgp_player_customer_label` — not dimension Glue logic (see DE-9563).

---

## Phase 0 — Triage & scope

| Done | Step | Notes |
|:---:|---|---|
| [x] | Jira read; linked DE-9563 | Historic gap before Jul 2025 |
| [x] | Triage doc — Picture + E2E + verdict | `dimensions/in_progress/de_9655_*.md` |
| [x] | Compare YAML scoped | PK: `player_bk`, `customer_label_bk`, `start_date` |
| [ ] | Confirm Jul 2025 cutoff definition with Ben/Andrew | Open question |
| [ ] | Walkthrough scheduled (Nathan / Andrew) | Per Jira |

---

## Phase 1 — Prerequisites (DE-9563 prod delta)

| Done | Step | Notes |
|:---:|---|---|
| [ ] | Prod: find post-deploy label **change** event | Player with new label after DE-9563 deploy |
| [ ] | Verify old row expired (`is_current='N'`, `end_date` set) | Incremental path proof |
| [ ] | Document in Jira DE-9655 or DE-9563 comment | Unblocks historic work |

**Prod health (2026-09-02):** 4.36M rows, ~all `is_current='Y'` — expect **gold reload** after curated backfill.

---

## Phase 2 — Historic curated load

| Done | Step | Notes |
|:---:|---|---|
| [ ] | Review `prod-sql-server-extraction` job + storage/index impact | Jira resource link |
| [ ] | Extract `PlayerCustomerLabel` pre-Jul 2025 → S3 | Path: `sql-server-extraction/PlayerCustomerLabel` |
| [ ] | Run migration processor with `migration-config/reload/sgp_player_customer_label.json` | `ds_platform=EDW` |
| [ ] | Validate curated: counts, `MIN`/`MAX(date_last_modified)`, overlap with SGP CDC | Athena / Glue catalog |
| [ ] | Document repeatable runbook | Acceptance criteria |

---

## Phase 3 — Gold reload & DEV validation

| Done | Step | Notes |
|:---:|---|---|
| [ ] | **Gold reload decision** | **Yes** — full history after curated backfill |
| [ ] | DEV: merge curated + DROP gold + epoch watermark | `dimension-watermark-reset` skill |
| [ ] | DEV Glue dimension job **≥ 2×** | Defaults only |
| [ ] | DEV validation — test SQL → DEV RS + **BK overlap** | `compare.py` or manual |
| [ ] | `devils_advocate_unit_test.md` | If Glue changes; else validation report |

---

## Phase 4 — Prod

| Done | Step | Notes |
|:---:|---|---|
| [ ] | Prod curated merge (if not promoted from DEV) | Coordinate with Ben |
| [ ] | `prod-redshift_cleanup_tables` or DROP + epoch | `player_customer_label_history` |
| [ ] | Prod Glue **≥ 2×** | |
| [ ] | Post-deploy prod validation + **BK overlap** | `final_prod_results.md` + Jira |
| [ ] | Jira Done | |

---

## Phase 5 — Close

| Done | Step | Notes |
|:---:|---|---|
| [ ] | Move docs `in_progress/` → `done/` | |
| [ ] | Update `catalog.md` lesson (historic backfill pattern) | |
