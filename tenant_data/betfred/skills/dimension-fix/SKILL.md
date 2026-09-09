---
name: dimension-fix
description: >-
  Implement dimension migration fixes from dimensions/de_{jira}_{name}.md: inspect
  redshift_sync and related Glue/SQL, write proposed fixes only under
  fixes/{name}/, never edit production SQL directly, handle status-overwrite by
  not joining only on current status, and commit on branch
  cursor/dimension-{name}-fix-22ba. Use when the user asks to fix a dimension
  issue after triage, implement a timeout/status-overwrite fix, or produce a
  dimension patch under fixes/.
---

# Dimension Fix

Implement a **proposed fix** for a dimension after triage. Work in the workspace **`Cursor/`** folder. Source of truth is `dimensions/{status}/de_{jira}_{name}.md`. Code changes for review live under `fixes/dimensions/{status}/de_{jira}_{name}/` only (paths relative to `Cursor/` root).

## Prerequisites

- Atlassian MCP (`user-atlassian`) authenticated to `betfred.atlassian.net` (when triage/fix tied to a Jira ticket)
- **Workspace folder `Cursor/`** — dimension artifacts live here, not in migration-data-test
- Paths (from `Cursor/` root):
  - `dimensions/{in_progress|done}/de_{jira}_{name}.md`
  - `fixes/dimensions/{in_progress|done}/de_{jira}_{name}/`
  - `validation/reports/`
- Compare profiles: `../data-platform-migration-data-test/mappings/complex_dims/{name}.yaml`
- Glue jobs: `../data-platform-glue-etl-transactional-data-jobs/glue-jobs/.../uk_digital_dimension_*.py`
- Legacy SQL procedures: `../data-platform-legacy-enterprisedatawarehouseunity/Stored Procedures/XtrlTransform.usp_etl_table_transform_1_dimension_*.sql` (e.g. `...DepositLimitHistory.sql` for `deposit_limit_history`)
- AWS reads (Glue logs, Athena, Redshift): refresh SSO proactively per
  `aws-sso-proactive.mdc` — do not stop at “SSO expired”

## Hard rules

1. **Read `dimensions/de_{jira}_{name}.md` first** — do not invent scope from memory.
   Prefer the **Finding walkthroughs** (samples + diagrams + suggestions) when
   present; that is the review contract from triage.
2. **Inspect `redshift_sync` and related Glue/SQL code** before proposing changes.
3. **Write fixes only under `fixes/dimensions/{status}/de_{jira}_{name}/`** — patches, rewritten snippets, notes, sample SQL.
4. **Never edit production SQL directly** — no changes to live legacy procedures under the Enterprise Data Warehouse / Unity SQL trees as the delivery vehicle.
5. **For status-overwrite: avoid joining only on current status** — see below.
6. **Gold CREATE after DROP is Glue-only.** Never recover a dropped gold
   table with agent/Data API / console `CREATE TABLE`. The job must
   recreate (e.g. `redshift_recreate` when missing). Rule:
   `glue-gold-create-via-job-only`. Optional Liquibase/ALTER for additive
   columns while gold **exists** is separate; document under
   `fixes/{name}/*.sql` when needed.
7. **Commit on branch `cursor/dimension-{name}-fix-22ba`** — e.g. `time_out` → `cursor/dimension-time_out-fix-22ba`.
8. **Comments / docstrings in Glue `.py`** — see below (mandatory on every code fix).
9. **Ask before any temp / dry-run table CREATE/DROP in any env** (Athena, Redshift, etc.) — use the ask template in **dimension-validate**. Never auto-create shared warehouse tables.
10. **Git scope:** bare `git push` / `git commit` / "yes commit and push" → **only** `data-platform-glue-etl-transactional-data-jobs`. Do not touch `migration-data-test`, `Cursor/`, or any other sibling unless the user **explicitly names** that repo.
11. **Never create `.cursor/` under any sibling git repo** — skills/rules live only in `Cursor/.cursor/`. Do not add `.cursor/rules` or `.cursor/skills` under data-jobs, migration-data-test, etl-common, etc.
12. **Pre-deploy quality gate:** before merge to `dev` / deploy, run `ruff check`, `ruff format --check`, and `ty check` on touched Glue `.py` (line length 79). Fix failures first. See `Cursor/.cursor/rules/pre-deploy-quality-gate.mdc`.
13. **Line-number map (mandatory — every Glue tip edit):** after **any** Glue
    logic change for the dim (including small follow-ups: one column, hex,
    import), **immediately** refresh
    `fixes/{name}/what_fixed_line_nos.md` with **real `Lines ~N–M`** per
    finding (read tip file / search symbols — do not guess; do not leave
    prose-only entries). Rule: `dimension-what-fixed-line-nos`. Gate before
    commit/push. Example:
    `fixes/dimensions/in_progress/de_9567_session_history/what_fixed_line_nos.md`.
14. **Shared Spark bootstrap:** do not hand-roll local `configure_spark` /
    `SparkConf`. Use
    `from utilities.glue_spark_config import configure_spark, create_glue_runtime`
    (see rule `configure-spark-shared`). Job-only knobs go in `extra_conf`
    after comparing defaults; ask before applying.
15. **Delivery order + three test places** (rule `dimension-delivery-order`):
    1. **Place 1** — Athena Iceberg tip vs test SQL (OK before DEV deploy)
    2. Devil’s-advocate → PR draft
    3. **Commit** Glue (only when user says commit)
    4. Merge/push → DEV deploy
    5. Watermark + gold reload if full window needed
    6. **Place 2** — test SQL → DEV RS (authoritative DEV)
    7. Refresh DA/PR → main → prod deploy
    8. **Place 3** — test SQL → prod RS  
    Write `fixes/{name}/devils_advocate_unit_test.md`.
16. **No manual Glue job parameter overrides.** Wrong `--catalog_name` /
    workers / etc. → fix in `tf/*.tf` (or script) → Jenkins apply. Never
    console Default-parameter edits or `start-job-run --arguments` as the
    fix. Rule: `glue-no-manual-job-param-overrides`. With shared
    `configure_spark`, TF `--catalog_name` must be **`awsdatacatalog`**.
If triage classified the issue as **needs more info**, stop and say so — do not invent a fix.

---

## Comments and docstrings (Glue `.py` fixes)

When editing a Glue job (or proposing patches that will land in one):

### Module docstring (required)

Follow the pattern in `uk_digital_dimension_timeout.py`:

```text
UK Digital — Dimension: <Name>
==============================
What the job does (one short paragraph) and the Redshift target dim.

Source
------
Tables involved (Iceberg + any Redshift enrich), one line each.

Loading strategy
----------------
Incremental / full, watermark column, DynamoDB, redshift_sync, plus any
behaviour that is easy to re-break (LEFT vs INNER, valid-only windows,
timezone for is_current, MERGE key).

Target
------
Redshift: uk_digital.dimension.<table>
  - MERGE / grain keys

Schedule
--------
EventBridge / Step Functions note if known.
```

Name the dimension explicitly in the title line. List every table the job
reads or writes.

### Function docstrings and inline comments

| Prefer | Rule |
|---|---|
| **Function docstring** | Put the full why for that helper (join type, sentinel, window order). Keep Args/Returns. |
| **Inline `#` / SQL `--`** | **Default: none.** Do **not** add comments that only explain a migration fix, ticket finding, or “do not use X” (including inside SQL f-strings). |
| **Long narrative `#` comments** | Do **not** — use the module / function docstring or `fixes/{name}/notes.md`. |

**Forbidden examples:** `-- Legacy ValidFromUTC; do not use effective_from_utc.`, `# Fixed in DE-9556: …`, ticket history / April metrics next to code.

Rare exception (max 1–2 lines) only if a future reader would otherwise reintroduce a silent bug — e.g. “do not renumber here — valid-only later”. Prefer the function docstring.

---

## Workflow

```
Dimension fix:
- [ ] 1. Read dimensions/de_{jira}_{name}.md
- [ ] 2. Inspect redshift_sync + Glue/SQL
- [ ] 3. Draft fix under fixes/{name}/ only
- [ ] 4. Apply status-overwrite / join rules
- [ ] 5. Write/update fixes/{name}/what_fixed_line_nos.md
      (**every** finding has `Lines ~N–M`; refresh after small tip edits too)
- [ ] 6. Commit on cursor/dimension-{name}-fix-22ba
```

### 1. Read `dimensions/de_{jira}_{name}.md` first

From the doc, capture:

- Source tables and destinations
- Known issue + classification (especially `status-overwrite`)
- Validation window and acceptable match rate
- Linked Jira ticket

If the file is missing, run **dimension-triage** (or ask the user) before fixing.

### 2. Inspect `redshift_sync` and related Glue/SQL

Read enough to understand current behaviour — do not edit these in place as the fix delivery:

| Area | Typical paths |
|---|---|
| Sync utility | `data-platform-glue-etl-common/src/utilities/redshift_sync.py` (+ `docs/utilities/redshift_sync.md`) |
| Glue job | `data-platform-glue-etl-transactional-data-jobs/glue-jobs/**/uk_digital_dimension_{name}.py` (or closest match) |
| Legacy SQL | EDW / Unity procedures (e.g. `usp_etl_table_transform_1_dmdimension_*`) — **read only** |
| Comparison | `mappings/complex_dims/{name}.yaml` |

Note: grain keys, upsert keys, `is_current` expiry logic, watermark / lookback, and any join that uses **current** player status / reason.

### 3. Write fixes only under `fixes/{name}/`

Create:

```
fixes/{name}/
  README.md                 # what / why / how to validate
  glue_patch.md             # proposed Glue changes (diff or full replacement snippet)
  sql_patch.md              # proposed SQL changes for review only — never applied here
  notes.md                  # optional: join diagrams, sample keys, open risks
  what_fixed_line_nos.md    # mandatory once Glue tip has the fix — Jira → line map
```

Allowed content under `fixes/{name}/`:

- Proposed Glue Python snippets or unified diffs
- Proposed SQL **for review / comparison**
- Validation queries and expected match-rate checks
- Before/after explanation tied to `dimensions/de_{jira}_{name}.md`
- **`what_fixed_line_nos.md`** — finding → line ranges in the real Glue job
  (refresh after format shifts lines)

Disallowed:

- Editing production Glue job files as the primary deliverable (unless the user explicitly overrides)
- Editing production / legacy SQL procedures in-repo as the fix
- Changing live sync utilities without an explicit user request

### 4. Status-overwrite rule

When classification is `status-overwrite` (e.g. Timeout → Self Exclude):

- **Avoid joining only on current status**
- Do **not** require the player's *current* disable reason to equal `Timeout` in order to see historical timeout events
- Prefer joining disable **history** (and reason on the history row / historical key) so past Timeout periods remain visible after a later Self Exclude overwrite
- Keep the dimension filter on reason = Timeout at the **event** level, not the **current player** level

Bad (current-status only):

```text
player ⋈ current_disable_reason = 'Timeout' ⋈ history_on_current_reason
```

Good (history-preserving):

```text
history ⋈ reason_on_event = 'Timeout'  (player attrs joined without requiring current reason = Timeout)
```

### 5. Commit / push (repo scope)

**Default when user says `git push` / commit without naming a repo:** only
`data-platform-glue-etl-transactional-data-jobs`. Never commit or push
`migration-data-test`, `Cursor/`, or other siblings unless named explicitly.

Artifact-only commits under `Cursor/` (branch `cursor/dimension-{name}-fix-22ba`)
happen **only** when the user asks to commit Cursor/fixes artifacts (or names that path):

1. Create/checkout: `cursor/dimension-{name}-fix-22ba` (in the repo they named)
2. Stage only `fixes/{name}/` (and `dimensions/de_{jira}_{name}.md` if updated for the fix notes)
3. Commit with a message like:

```text
fix:/BED-XXX: propose {name} dimension fix under fixes/{name}
```

4. Do not force-push; do not commit secrets; do not touch production SQL paths.

---

## README.md template for `fixes/{name}/`

```markdown
# Fix: {name}

- Source of truth: `dimensions/de_{jira}_{name}.md`
- Classification: …
- Branch: `cursor/dimension-{name}-fix-22ba`
- Jira: …

## Problem
## Proposed change
## Files in this folder
- …
- `what_fixed_line_nos.md` — Jira findings → Glue line ranges (mandatory)
- Window: …
- Acceptable match rate: …
## Out of scope
- No production SQL edits
- No DROP / CREATE / ALTER of gold Redshift tables from Glue `.py` (manual DBA + `fixes/{name}/*.sql` only)
```

---

## Done checklist

- [ ] Read `dimensions/de_{jira}_{name}.md` first
- [ ] Inspected `redshift_sync` + related Glue/SQL (read-only for production SQL)
- [ ] All proposed changes live under `fixes/{name}/`
- [ ] `fixes/{name}/what_fixed_line_nos.md` written/refreshed — **every**
      discussed finding has `Lines ~N–M` (no prose-only cells); tip SHA/date
      noted; refreshed after small follow-ups too
- [ ] Status-overwrite: not joining only on current status
- [ ] No DROP/CREATE/ALTER gold table DDL added to Glue `.py`
- [ ] Module docstring follows timeout.py pattern (dim name, sources, load, target)
- [ ] Function docstrings carry the why; inline comments only if required, max 1–2 lines
- [ ] Pre-deploy quality: `ruff check` + `ruff format --check` + `ty check` on touched Glue `.py`
- [ ] Next-steps chat uses delivery order + **three test places**
      (Place 1 Athena → … → Place 2 DEV RS → … → Place 3 prod RS)
- [ ] `fixes/.../delivery_checklist.md` ticked for steps done this session
      (rule `dimension-delivery-order` § Delivery checklist)

## After local Glue fix — next steps (chat order)

```
1. Place 1 — Athena Iceberg tip vs test SQL (no DEV deploy needed)
2. Devil’s-advocate unit-test gate → then PR draft
3. Commit Glue file (say the word)
4. Merge/push → DEV deploy
5. Watermark reset + gold reload if full compare window needed
6. Place 2 — test SQL → DEV RS (authoritative; like deposit_limit_history)
7. Refresh PR / merge to main → prod deploy
8. Place 3 — test SQL → prod RS
```