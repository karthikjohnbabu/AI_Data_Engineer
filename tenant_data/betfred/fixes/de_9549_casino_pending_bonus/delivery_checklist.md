# Dimension delivery checklist — DE-9549 `casino_pending_bonus`

One checklist per dimension — tick when **done**. Agent: continue from first
unchecked row. Steps marked **HUMAN OK** need an explicit yes from Prasath
before the agent runs them.

**Agent maintenance (locked 2026-09-08):** after every completed step in the
same turn — tick `[x]`, note evidence, append Permission log. Preference or
process change → update `dimension-delivery-order` (and related skills) too.

## Header

| Field | Value |
|---|---|
| **Jira** | [DE-9549](https://betfred.atlassian.net/browse/DE-9549) |
| **Dimension** | `casino_pending_bonus` |
| **Glue job** | `uk_digital_dimension_casino_pending_bonus` |
| **Compare profile** | `mappings/complex_dims/casino_pending_bonus.yaml` |
| **Triage one-stop** | `fixes/.../triage_validation.md` + `.html` |
| **Feature branch** | `feature/de-9549-dimension-casino-pending-bonus` — merged to `origin/dev` (`1a66585f`, 2026-09-08) |
| **Gate contract** | BK `pending_bonus_bk` overlap; Alice fields; exclude wagering/status/type/DLM; AmountGBP = Playtech first |
| **Started** | 2026-09-03 |
| **Closed** | |

**Open residual:** Bob source-system-gap; AmountGBP ask Playtech (Option B only if no); C2 wagering; player_bk ID space.

---

## Phase 0 — Triage & scope

| Done | Step | Notes |
|:---:|---|---|
| [x] | Jira + related Done audit (DE-7392) | Closed-claim audit in triage_validation |
| [x] | Ground work one-stop | triage_validation.md/.html |
| [x] | Mapping xlsx + AmountGBP ladder | No AmountGBP; ask Playtech first |
| [x] | Compare YAML excludes | `amount_gbp`, `bonus_wagering` |

---

## Phase 1 — Fix tip + Place 1 Athena (pre-DEV)

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [x] | Glue tip: `bonus_bk` ← `template_code` | — | Line ~104; docstring; ruff clean |
| [x] | `what_fixed_line_nos.md` | — | 2026-09-08 |
| [x] | Place 1 Athena tip vs Iceberg (BonusBK / template) | — | **PASS** 2026-09-08 — 0/313569 code=template; see `place1_athena_template_code.md` |
| [ ] | Devil’s advocate refresh (after Place 1) | — | Optional before commit |
| [x] | **Commit** Glue tip | **HUMAN OK** | `66c28e57` on feature branch |
| [x] | **Push** branch / merge to `dev` | **HUMAN OK** | Feature pushed; `origin/dev` @ `1a66585f` (2026-09-08) |

---

## Phase 2 — DEV deploy + Place 2 validation

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [x] | Jenkins DEV plan/apply (if needed) | **HUMAN OK** | **DONE** 2026-09-08 — apply complete |
| [x] | DEV gold reload (**BACKUP** then DROP + watermark) | **HUMAN OK** | bak `casino_pending_bonus_bak_20260909` 53968=53968; DROP; epoch on SUCCESS `2026-08-19 13:47:01.503572` |
| [x] | Run DEV Glue job ≥2× (defaults only) | **HUMAN OK** | `jr_f2af…` SUCCEEDED; `jr_4ff2…` SUCCEEDED; gold 53968; **all** bonus_bk changed vs bak |
| [x] | Place 2: test SQL → DEV RS + BK intersection | — | **2026-09-09** BK overlap 53968/53968 (100%); **bonus_bk 100% PASS** (tip). player_bk/dates diverge (known ID-space / pipe — not this tip). ~51s method. |
| [ ] | Refresh DA / PR draft evidence | — | **Paused** — wait Playtech AmountGBP reply |
| [x] | Jira: DEV validation comment | — | Posted 2026-09-09 on DE-9549 |

---

## Phase 3 — PR to `main`

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [ ] | Draft `pr.md` / raise PR | **HUMAN OK** | After Playtech AmountGBP reply (or defer GBP) |
| [ ] | Review + merge | **HUMAN OK** | |

---

## Phase 4 — Prod

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [ ] | Prod cleanup / reload | **HUMAN OK** | Four params only on cleanup job |
| [ ] | Prod Glue ≥2× | **HUMAN OK** | |
| [ ] | Place 3: test SQL → prod RS + BK overlap | — | After prod gold ready |
| [ ] | Jira Done comment | **HUMAN OK** | |

---

## Phase 5 — Close

| Done | Step | **Human?** | Notes |
|:---:|---|---|---|
| [ ] | Move docs → `done/` | — | |
| [ ] | Update catalog | — | |

---

## Permission log

| When | Action | Prasath said |
|---|---|---|
| 2026-09-08 | Carry on Phase 1 + 2; ask before human steps | Yes — Place 1 OK; ask before commit/push/deploy/reload |
| 2026-09-08 | Place 1 Athena template_code tip | **PASS** (313569 tip; 0 code=template) |
| 2026-09-08 | Phase 2 commit + push + merge `dev` | **Yes** — done (`1a66585f` on `origin/dev`) |
| 2026-09-08 | Jenkins DEV apply + gold reload + Glue ≥2× | **WAITING** on Jenkins apply, then reload |
| 2026-09-08 | Always update checklist + rules when done | Locked into `dimension-delivery-order` + this file |
| 2026-09-08 | Pause Phase 2 / Playtech AmountGBP | Wait — parallel work DE-9654 ground work |
| 2026-09-09 | DEV always BACKUP before DROP | Locked into watermark skill + Phase 2 rules |
| 2026-09-09 | Phase 2 reload + Glue ≥2× | **Yes** — bak 53968; DROP; epoch; 2× SUCCEEDED; all bonus_bk flipped vs bak |
| 2026-09-09 | Place 2 BK intersection | Done — 100% BK overlap; bonus_bk 100%; player_bk/dates known residual |
| 2026-09-09 | Jira DEV validation + pause PR | Posted; rewritten (no Alice/Bob jargon); **wait Playtech AmountGBP** before PR |
| 2026-09-09 | Jira self-contained wording | Locked into `betfred-facing-no-cursor-leak` + `dimension-validate` |
