---
name: dimension-pr
description: >-
  Draft the final Bitbucket PR description as markdown under fixes/{dim}/pr.md
  for manual copy-paste into the Glue repo GUI. Includes Jira migration
  findings by severity (Critical, Medium, Enhancement). Use when the user
  says create a PR or draft PR text for a dimension fix.
---

# Dimension PR (manual copy-paste)

Write **`Cursor/fixes/dimensions/{status}/de_{jira}_{dim_name}/pr.md`** — the user copies title + body into
Bitbucket. **Do not call Bitbucket API** unless they explicitly ask later.

`pr.md` under `Cursor/fixes/` is **personal reference / paste draft only**.
Do not tell the Betfred team (Jira, standup, PR comments outside the pasted
body) that the draft “lives in Cursor” or cite `fixes/…/pr.md`. The pasted
Bitbucket body itself must also avoid Cursor tooling names (Betfred uses Claude).

**Repo:** `data-platform-glue-etl-transactional-data-jobs` only. Compare /
validation tooling stays local — never include `data-platform-migration-data-test`
in the PR draft.

**Local evidence pack** (not pasted into Bitbucket): ensure
`validation/reports/de_{jira}_{name}/de_{jira}_final_verdict.html` exists when
Athena tip / explain-issue work was done (rule `dimension-validation-reports`).
Do not cite that path in the PR body.

**Git:** bare `git push` / `git commit` → that Glue (data-jobs) repo only.
Do not push or commit sibling repos unless the user explicitly names them.

## Before raising to `main` (process — not in pr.md)

Delivery order (rule `dimension-delivery-order`) — do **not** paste into `pr.md`:

1. **Place 1** — Athena Iceberg tip vs test SQL (pre-DEV)
2. **Devil’s advocate** + **AI Code Review** → draft this **PR**
3. **Commit** → DEV deploy → watermark/reload if needed
4. **Place 2** — test SQL → DEV RS; fold evidence into PR / Jira
5. Merge to `main` → prod deploy → **Place 3** — test SQL → prod RS

Gates:

- Compare / job evidence on DEV (job ≥ 2× when already deployed)
- No open **RED ALERT / HIGH / MEDIUM** in
  `fixes/dimensions/{status}/de_{jira}_{name}/devils_advocate_unit_test.md`
- `fixes/dimensions/{status}/de_{jira}_{name}/ai_code_review.md` done before finalising Bitbucket paste
- **Update the Jira ticket** (mandatory — same stage as “ready for PR to
  main”). Follow the style of [DE-9555](https://betfred.atlassian.net/browse/DE-9555):
  1. Refresh the description **Findings** table (issues + any new findings)
  2. Comment: **Fixes implemented** (what changed, mechanisms)
  3. Comment: **Additional Findings** when DEV validation surfaced more
     (e.g. UTC / `valid_from`) plus presence before/after evidence
  4. Note DEV reload / watermark / DDL ops and that PR to `main` is next
- Attach evidence in Jira (presence BA, column screenshots)
- Sync branch with latest `main`
- PROD Terraform plan reviewed in Jenkins (if `.tf` changed)
- Watermark migration plan if Glue job renamed

**Remind the user** at this stage: “DEV validated and PR-ready — update Jira
now (DE-XXXX) before / as you raise the Bitbucket PR.”

## Workflow

1. Read `dimensions/{status}/de_{jira}_{name}.md`, Jira ticket, `fixes/dimensions/{status}/de_{jira}_{name}/`
2. Run `git log main..HEAD` and `git diff main...HEAD --stat` on Glue branch
3. Ensure `fixes/dimensions/{status}/de_{jira}_{name}/what_fixed_line_nos.md` exists and matches tip
   line numbers — **every finding has `Lines ~N–M`** (rule
   `dimension-what-fixed-line-nos`; refresh even after small tip commits)
4. Write `fixes/dimensions/{status}/de_{jira}_{name}/pr.md` as **final paste draft**
   — do **not** paste `what_fixed_line_nos.md` into Bitbucket unless asked;
   use it to keep Description / reviewer notes accurate
5. When the PR is **already open** and validation / tip / ops change: **do not**
   rewrite the whole description for the user — append a
   **`# PASTE INTO BITBUCKET PR COMMENT`** block at the bottom of `pr.md`
   (see below). User copies that block only into the Bitbucket Activity
   comment box (the PN text box). Also fold the same facts into the main
   body above the line so a full re-paste stays consistent.

## PR already open — Activity comment delta (mandatory pattern)

Whenever the user needs to update an open PR (new DEV compare, tip fix,
post-merge ops change, reviewer reply material):

1. Keep / refresh the full description in the top of `pr.md`
2. Append **exactly** this structure at the bottom (nothing instructional
   after the marker — the body under it must be 100% paste-ready):

```markdown
---

# PASTE INTO BITBUCKET PR COMMENT (copy everything below this line)

## DEV validation update (YYYY-MM-DD)

**Compare pair:** test SQL Server (…) → DEV|prod Redshift (…)
**Window:** …

(presence table / tip note / post-merge ops / whatever changed)

```

3. Tell the user in chat: **copy everything under that heading into the PR
   Activity comment box** — do not dump the full PR body again unless they
   ask to replace the description
4. Do **not** include Cursor paths, skill names, or “see pr.md” in the paste
   block (Betfred-facing). For any side **Teams / Slack** note about the PR:
   **bold** names, **no backticks** (rule `betfred-facing-no-cursor-leak`).
   Bitbucket body may still use code fences for SQL/diffs.

Replace any older `UPDATE THIS IN BITBUCKET…` / numbered “what to change”
sections with this single paste block.
## pr.md layout

```markdown
**PR title:** `feature/de-XXXX dimension <name>`

**Source branch:** `<branch>` → **main**

---

Copy everything below into the Bitbucket PR description.

---

# DE-XXXX — Dimension <Name> migration fix
(short summary)
Linked Jira ticket: [DE-XXXX](...)
Fixes #DE-XXXX

## Context
SQL Procedure: ...
Glue Job: ...

## Migration findings
| Severity | Issue | Description / impact | Addressed in this PR |
(table from Jira — Critical, Medium, Enhancement; mark Yes/No/Out of scope)

## Description
### Changes
* `hash` — subject
  (paragraph: mechanism + what the fix guarantees)

**File changed:** ...

## DEV validation evidence (required before merge to main)
### Presence (composite PK) — before → after
| | Before fix / pre-reload | After tip reload |
|---|---:|---:|
| SQL rows | | |
| Redshift (window) | | |
| Matched | | |
| SQL only | | |
| RS only | | |
| **Presence** | **x% FAIL/PASS** | **y% PASS** |

Window, env (DEV), and PK columns named above the table.

### New column / key — before → after screenshots
(e.g. `customer_id_legacy`): embed **before** and **after** PNGs only.
Screenshots must look like Redshift Query Editor: **Open Sans**
(`evidence/fonts/`), greys header `#2c3943`, base `#2f343c`, dark rows
`#252a31`. **Before:** fields grid only (no table-name chrome). **After:**
data grid + Export/Chart strip only (no `Result 1` label). **Crop tightly.**
Paste into Bitbucket when raising the PR.

## Type of change
(checkboxes)

## Post-merge ops (manual)

Use this **fixed four-step shape** in every `pr.md` unless the ticket needs
extra lines (upstream job order, repair caveat, new column name). **Do not**
invent Jenkins/Liquibase/generic backfill prose — stay concrete like DE-9556 /
DE-9567.

```markdown
## Post-merge ops (manual)

1. **Prod gold:** **DROP** `uk_digital.dimension.<table>` (Glue recreates on next run — <optional: new columns / mechanism, e.g. includes `customer_id_legacy` via `redshift_recreate`>). Do not manually CREATE empty gold. **No backup.**
2. **Watermark reset (prod):** set SUCCESS row `audit_sequence_time` to `1970-01-01 00:00:00.000000` on the prod job component (`<prod_job_name>#<component>` — re-scan `prod-ETLJobControl` before update).
3. <Optional ticket-specific upstream runs, e.g. `Run prod_uk_digital_dimension_player`, then> Run `<prod_glue_job>` **≥ 2 times** (defaults only — no console parameter overrides).
  4. Re-validate as **test SQL Server → prod Redshift** — **BK overlap mandatory**
     (intersection %, SQL-only, attribute match on shared keys) plus ticket smoke;
     attach evidence in Jira DE-XXXX (heading: **Post-deploy prod validation** — not “Place 3”).
     Write `final_prod_results.md`.

**Note:** <Only when needed — e.g. old gold wrong until full reload; coordinate reporting before prod DROP. Omit if nothing ticket-specific.>
```

**Defaults (do not repeat in every PR unless relevant):**

| Item | Standard |
|---|---|
| Prod gold reload | **DROP only** — Glue recreates; **no backup** |
| Manual CREATE | **Never** — rule `glue-gold-create-via-job-only` |
| Watermark | Epoch on **SUCCESS** row only (not NODATA) |
| Glue runs | **≥ 2×**, deployed **defaults** only |
| Prod compare | test SQL → **prod** Redshift — **BK overlap required** (not smoke-only); same window/grain as DEV gate (Jira: **Post-deploy prod validation** — never “Place 3”) |

**Ticket-specific extras (add only when true):**

- Upstream job before target (e.g. `dimension.player` before
  `deposit_limit_history` — session_history reads Iceberg, usually **no**
  player dim first).
- New gold column name in step 1 parenthetical.
- Repair / reporting coordination **Note** when old pairing/logic leaves
  dormant rows wrong until full reload.
- `prod-redshift_cleanup_tables` params — document in
  `prod_redshift_and_watermark_reset.md`, not a vague cleanup paragraph in
  `pr.md` unless the team uses cleanup job for that dim.

## Reviewer notes
(INNER JOIN, MERGE key, watermark pitfalls)
```

When later updates are needed on an **already-open** PR, append the
`# PASTE INTO BITBUCKET PR COMMENT` block (see Workflow step 5) instead of
only editing the body silently.
## Include in pr.md

- Jira link + `Fixes #DE-XXXX`
- **Migration findings** table with severities from Jira (Critical / Medium /
  Enhancement) and an “Addressed in this PR” column
- Commit bullets with **mechanism** detail (why the bug happened, not one-liners)
- **DEV validation evidence** (mandatory when raising to `main` after reload):
  1. **Presence (composite PK) before/after** table for the agreed window
  2. **Before/after screenshots** of any new gold column (e.g. `customer_id_legacy`)
     — PNG under `fixes/{dim}/evidence/`; **DBeaver-dark SQL-client look**,
     **cropped to data view only** (no blank panel under the last row; see
     `style_reference_dbeaver_dark.png`); never coloured mock tables.
     Tell the user to **paste/attach** into Bitbucket (local paths do not render)
  3. One-line note if residual `only_*` is expected (e.g. legacy `bk = -1`)
  4. State the **compare pair** (test SQL → DEV RS or test SQL → prod RS) and window
  5. If evidence came from a **full reload / empty table**, say so — that run did
     not exercise the incremental update path (rule `legacy-parity-verification`)
  6. If dormant rows stay wrong until the next source event, name **backfill /
     reload** under post-merge ops (correctness ≠ repair)
- Type of change checkboxes
- Post-merge ops when gold reload / DDL / watermark reset needed
- Reviewer notes

## Exclude from pr.md

- `data-platform-migration-data-test` / compare profile PRs
- **Deployment & Testing Prerequisites** block (process gate, not PR body)
- Author Checklist / Reviewer Checklist from template (unless user asks)
- Any mention of **Cursor**, local `Cursor/` / `fixes/` workspace paths, or
  agent/skill names (Betfred uses Claude — paste body must look like normal
  engineer notes). Evidence **filenames** in an Attachments section are OK;
  “see Cursor/fixes/…” is not
- `Co-Authored-By` unless user requests
- Full attribute-diff noise / sum-check FAIL walls — keep the PR focused on
  **presence BA** + **new-column screenshots** unless the user asks for more
- Coloured AI/SVG “result” tables, highlighted new-column cells, title banners
  on evidence images — evidence must look engineer-captured, not generated
- Tall screenshots with empty space below the last data row

## Style

- British spelling
- Always include presence **before and after** once DEV reload compare exists
- Evidence screenshots: dark SQL-client grid only — greys `#2c3943` /
  `#2f343c` / `#252a31`, **tight crop to data view**
- Struck-through rows for ticket items explicitly out of scope
- Check only Type of change boxes that apply

## Related skills

- `dimension-fix` — implement fix
- `dimension-watermark-reset` — DynamoDB reload watermark
- `dimension-validate` — local compare after deploy; captures evidence for this PR
