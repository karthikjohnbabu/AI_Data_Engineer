# Dimension / fact — three test places + delivery order

Locked 2026-08-26 (Prasath). Always name **which test place** when reporting.

## Three test places (mandatory model)

| # | When | Pair / engine | Purpose |
|---|---|---|---|
| **1. Athena (pre-deploy)** | After Glue tip logic is written, **before** Commit / DEV deploy | **test SQL Server** ↔ **Athena Iceberg** (tip SQL / CTAS of the *fixed* transform over catalog tables already in AWS) | Prove pairing / join / watermark logic without waiting for Glue→Redshift |
| **2. DEV Redshift** | After Commit → DEV deploy → **BACKUP then DROP** gold (if reload) → Glue ≥2× | **test SQL → DEV RS** (`uk_digital.dimension.*`) | Authoritative DEV gate (same style as deposit_limit_history). **DEV always backs up** before DROP (`dimension.{table}_bak_YYYYMMDD`) unless user skips or gold empty. |
| **3. Prod Redshift** | After PR merge + job deployed to **prod** | **test SQL → prod RS** | Final prod gate |

SQL Server is **always test** (`BGB-BT` / Unity). Never prod SQL.

### Place 1 rules (Athena)

- Iceberg sources already exist (`{env}_dp_dwh_uk_digital.*`) — you **can**
  re-implement the fixed Glue SELECT/CTE chain in Athena and compare to SQL
  Server **before** the Glue job is deployed.
- Prefer **name-only SELECTs**; ask before any CTAS/DROP dry-run table
  (`dimension-validate` temp-table rule).
- Label proxy gaps (e.g. Redshift-only enrich → Iceberg substitute).
- Place 1 is a **logic gate**, not a substitute for Place 2/3 gold.
- C1 / legacy-history-wipe: Glue/Athena ≫ SQL OK when classified; gate on
  intersection / attributes.
- **Capture tip proof** in
  `validation/reports/de_{jira}_{name}/de_{jira}_final_verdict.html`
  (tables inventory + Mermaid/ASCII + live keys + tip SQL). Rule:
  `dimension-validation-reports`. Reference: DE-9549 pack.

### Places 2 & 3

- Use `compare.py` + complex_dims profile; declare pair every time
  (`migration-compare-env-pair`).
- Place 2 after gold is loaded/reloaded; Place 3 only after user confirms
  prod deploy.

### Betfred-facing vs internal labels

- **Chat / skills / reports under `Cursor/`:** may say Place 1 / 2 / 3.
- **Jira, Bitbucket PR, standup, Slack:** **never** “Place 1/2/3” — use
  “DEV validation”, “Post-deploy prod validation”, or full pair text (rule
  `betfred-facing-no-cursor-leak`, `migration-compare-env-pair`).

---

## Delivery order (chat “what’s next”)

1. **Test place 1** — Athena Iceberg tip vs test SQL (fix not yet in DEV OK)
2. **Devil’s-advocate** (Full DA = L0–L5) → **PR** draft (refresh after Place 2).
   **Task DA (incl. L5) after every prior step.**
3. **Commit** Glue — only when user says commit
4. **Merge/push → DEV deploy**
5. **Watermark + gold reload** if full window needed — **DEV: BACKUP then DROP**
   (mandatory; see `dimension-watermark-reset`). Prod: no backup unless asked.
6. **Test place 2** — test SQL → DEV RS (authoritative DEV)
7. Refresh DA / PR evidence → merge to `main` → prod deploy (when ready)
8. **Test place 3** — test SQL → prod RS

Do **not** claim Place 2 PASS on pre-fix gold. Do **not** skip Place 1 when
Iceberg sources are enough to express the tip (e.g. session_history pairing
on `bvt_action`).

## Chat wording

List next steps with place numbers, e.g. “Place 1 Athena next; then Commit →
DEV → Place 2.”

---

## Delivery checklist — always keep current (HARD RULE)

Every dimension/fact ticket has:

```text
Cursor/fixes/dimensions/{status}/de_{jira}_{name}/delivery_checklist.md
```

(facts under `fixes/facts/…` when applicable). Scaffold at triage/ground work.

### After every completed step (same turn — do not wait)

1. **Tick** the matching row `[x]` and put evidence in **Notes** (SHA, date,
   PASS/FAIL, compare pair, Glue run id if known).
2. Append the **Permission log** when Prasath said yes / wait / blocked.
3. Refresh **Header** fields that changed (feature branch, merge SHA, Closed).
4. **Task DA** (rule `dimension-devils-advocate-unit-test`): always includes
   **L5 artefact audit** on ticket HTML/MD; confirm alignment with plan/checklist;
   **fix RED before** claiming done; log `Task DA L5 PASS|FAIL` in Notes.
5. In chat, continue from the **first unchecked** row — never invent a next
   step that contradicts the checklist.

### Process / preference changes → update rules too

When Prasath says how delivery should work going forward (gates, Jenkins
order, HUMAN OK steps, “always update checklist”, Teams bold, etc.):

1. Update this rule and/or the relevant skill **in the same turn**.
2. Mirror into the active ticket’s `delivery_checklist.md` if the ticket
   template or permission log wording needs it.
3. Do **not** leave the preference only in chat.

### Anti-patterns

- Finishing Commit / push / Place 1 / Jenkins / reload / Place 2 and only
  telling the user — checklist still unchecked
- “We’ll update the checklist later”
- Changing delivery order in chat without editing this rule
- Ground-work `triage_validation.html` as a stub one-pager (must be full
  DE-9549 depth — rules `dimension-docs-plain-diagrams`,
  `dimension-validation-reports`)
