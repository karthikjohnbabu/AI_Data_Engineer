# Dimension delivery checklist — DE-9570 `vip_hospitality_costing`

One checklist per dimension — tick when **done**. Agent: continue from first unchecked row.

## Header

| Field | Value |
|---|---|
| **Jira** | [DE-9570](https://betfred.atlassian.net/browse/DE-9570) |
| **Dimension** | `vip_hospitality_costing` |
| **Glue job** | `uk_digital_dimension_vip_hospitality_costing` |
| **Compare profile** | `mappings/complex_dims/vip_hospitality_costing.yaml` (aggregate) |
| **Triage doc** | `dimensions/done/de_9570_vip_hospitality_costing.md` |
| **Feature branch** | `feature/de-9570-dimension-vip-hospitality-costing` *(create when fixing)* |
| **Validation window** | TBD (e.g. April 2024) |
| **Gate contract** | Event-level aggregates; 0 `OK%` rows in gold after fix |
| **Started** | 2026-09-01 |
| **Closed** | 2026-09-02 |

**Remaining finding (Sowmiya confirmed):** Critical — `account_number NOT LIKE 'OK%'` in Glue.

---

## Phase 0 — Triage & scope

| Done | Step | Notes |
|:---:|---|---|
| [x] | Jira read; findings classified | 3 Critical (1 open), 2 Medium struck, enhancements |
| [x] | Triage doc — Picture + E2E + verdict | 2026-09-01 DEV schema corrected |
| [x] | Compare YAML scoped | Aggregate by `event_name` + `event_date` |
| [x] | Sowmiya cross-check | FullName, AccountNumber, trim = resolved in DEV |
| [x] | Open finding: **OK% exclusion only** | Not in tip code; 0 OK% rows in DEV gold today |

---

## Phase 1 — Fix & pre-DEV logic

| Done | Step | Notes |
|:---:|---|---|
| [x] | **Branch:** `feature/de-9570-dimension-vip-hospitality-costing` from `main` | 2026-09-01 |
| [x] | Add `AND account_number NOT LIKE 'OK%'` to Iceberg read (sibling: CDD job) | ~L124 |
| [x] | `what_fixed_line_nos.md` | |
| [x] | ruff + ty on touched `.py` | ruff check + format pass |
| [x] | Place 1 Athena (optional — small filter change) | **Waived** |
| [x] | Devil’s advocate + `pr.md` draft | Light ticket |
| [x] | AI code review | **APPROVE** — `ai_code_review.md` |

---

## Phase 2 — DEV deploy & validation

### Gold reload decision (record before Jenkins)

| Reload needed? | When | DE-9570 (this ticket) |
|:---:|---|---|
| **No** | Forward-only filter on read; gold already clean; MERGE-only job | **No DROP** — DEV **0** `OK%`; **prod verified 2026-09-01: 1,311 rows, 0 `OK%`** |
| **Yes** | Logic changes existing rows, DELETE+INSERT grain, wrong data already in gold, or compare needs full window | e.g. session_history C1 |

| Done | Step | Notes |
|:---:|---|---|
| [x] | **Gold reload decision** documented | **No DROP** for DEV (see above) |
| [x] | **Commit** `713f8ccf` on `feature/de-9570-dimension-vip-hospitality-costing` | 2026-09-01 |
| [x] | Merge feature → **`dev`** + push | `origin/dev` @ `eeace866` |
| [x] | **Jenkins** `dev` — Terraform **plan** → review → **apply** | 2026-09-01 |
| [x] | Run DEV Glue job **≥ 1×** (defaults only) | Jenkins apply complete |
| [x] | **Smoke:** `COUNT(*) WHERE account_number LIKE 'OK%'` → **0** | 1,311 rows, 0 OK% |
| [x] | Job SUCCESS in Glue logs | |
| [x] | DEV validation (`compare.py`) — optional this ticket | BK overlap + smoke; compare profile `sgp_player_id` gap |
| [x] | Refresh `pr.md` + **`devils_advocate_unit_test.md`** (Validation results + count justification) | 2026-09-02 |
| [x] | Jira: **DEV validation** comment | Posted 2026-09-01 |

**Gate:** Do not raise PR to `main` until Jenkins apply + Glue smoke PASS (or accepted risk in Notes).

---

## Phase 3 — PR to `main`

| Done | Step | Notes |
|:---:|---|---|
| [x] | PR feature → `main` with `pr.md` | PR #764 |
| [x] | Review + merge | `89d0b317` |
| [x] | Prod TF plan reviewed | |

---

## Phase 4 — Prod deploy & reload

| Done | Step | Notes |
|:---:|---|---|
| [x] | **Prod reload decision** | No cleanup — 1,311 rows, **0 `OK%`** |
| [x] | Jenkins `main` apply | 2026-09-02 |
| [x] | `prod-redshift_cleanup_tables` (4 params) — **only if** bad rows or full reload needed | Skipped |
| [x] | Prod Glue **≥ 2×** (defaults) | 09:40 + 15:11 SUCCEEDED |
| [x] | Post-deploy prod validation | PASS — see `final_prod_results.md` |
| [ ] | Jira comment + `final_prod_results.md` | Draft below |

---

## Phase 5 — Close

| Done | Step | Notes |
|:---:|---|---|
| [ ] | Jira Done | |
| [x] | Move docs to `done/` | 2026-09-02 |
| [ ] | **Next ticket** | e.g. DE-9566 `racing_event_info` |
