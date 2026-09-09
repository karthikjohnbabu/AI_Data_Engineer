# Dimension fix — line-number map (mandatory)

Whenever a dimension/fact Glue job is changed for a ticket (DE-XXXX) — **including
small follow-ups** (one column, one import, one constant) — create or
**refresh** immediately:

```text
Cursor/fixes/{dim_name}/what_fixed_line_nos.md
```

Example: `fixes/dimensions/in_progress/de_9567_session_history/what_fixed_line_nos.md`.

## Purpose

Quick map: **which lines implement which Jira finding**, separate from ruff
noise. Personal reference — not for Bitbucket paste unless asked
(`betfred-facing-no-cursor-leak`).

## When to write / update (no exceptions)

Refresh **before** saying done / commit / push / “what’s next”, whenever any of:

- New Glue logic lands (`dimension-fix`)
- **Any** later tip change on that job (even a single column / hex / import)
- After `ruff format` or edits that shift lines
- Before drafting / refreshing `pr.md`

**Never** leave a finding as prose-only (“final select — hex…”) without
**`Lines ~N–M`**. If the map is stale vs tip, it is incomplete.

## Required contents

1. Ticket id(s) and Glue job path
2. Tip commit / date note (line numbers tip-relative; may drift)
3. **One section per finding** (Critical / Medium / Enhancement / meeting
   decision) with **`Lines ~N–M`** (and call-site line if separate)
4. **Quick map** table: finding → lines — every cell must have a line range
5. Optional: docstring-only / ruff-only callouts

## How to get numbers (do not guess)

1. Read the tip file (or `nl -ba` / editor line numbers)
2. Search symbols: `delete_from_redshift`, `hex(`, `data_fetch_delay`,
   `configure_spark`, `LEFT JOIN`, finding-specific names
3. Prefer `git diff main...HEAD` + current file — never copy old ranges
   after a new commit without re-checking

## Template skeleton

```markdown
# DE-XXXX — what fixed (line numbers)

Personal reference for `glue-jobs/.../uk_digital_dimension_<name>.py`.
Ignore quote/ruff churn. Lines as of tip <sha> (YYYY-MM-DD).

## 1. <Finding short name>
**Lines ~N–M** — …

## Quick map
| Jira finding | Lines (approx.) |
|---|---|
| … | ~N–M |
```

## Gate

Before commit/push of Glue changes: map file exists, **every discussed
finding has line numbers**, quick map has no blank/prose-only cells.
