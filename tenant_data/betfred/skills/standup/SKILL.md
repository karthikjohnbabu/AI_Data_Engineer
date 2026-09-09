---
name: standup
description: >-
  Produce a short daily standup status for Prasath (yesterday / today / blockers)
  from active dimension tickets, DEV/PR state, and Cursor fixes. Use when the
  user asks for standup, status update for standup, or when the daily 9am
  standup loop fires.
---

# Standup (9am)

Write a **copy-paste standup blurb** for Prasath — ~45–90 seconds speaking
time — **and** save it under the personal standup archive (below).

Keep **all sections** (Overview through Blockers). Change **layout only** —
see Output shape below.

## When

- User asks for standup / status for standup
- Daily loop tick: `AGENT_LOOP_TICK_standup` (weekdays 09:00 Europe/London)
- Loop script: `weekday_9am_loop.py` in this skill folder (local IDE session)
- User says “update standup” after a milestone (commit, meeting decision, compare)

### Schedule behaviour (1 + 2)

1. **09:00** — fires on weekdays while the Cursor loop process is alive
   (locked screen is fine if the Mac is not in deep sleep).
2. **Catch-up** — if 09:00 was missed (asleep / locked / delayed wake), the
   next time the loop is awake **before 14:00** it fires immediately (once
   per day). State file: `.standup_last_fired` beside the loop script.
3. Needs **Cursor open** with the loop running. Quitting Cursor stops it.
4. No VPN / Teams automation.

## Archive file (every run — mandatory)

After drafting the blurb, **create or overwrite** today’s file:

```text
Cursor/fixes/stand_up/{YYYY}/{Month}/daily_standup_{YYYY-MM-DD}.md
```

Examples:

- `fixes/stand_up/2026/August/daily_standup_2026-08-25.md`
- Month folder = full English month name (`January` … `December`), Europe/London date

File contents:

1. `# Daily standup — <Weekday DD Mon YYYY>` (title, large)
2. One-line italic note: personal reference only
3. `## Standup — <Weekday DD Mon>` (subtitle)
4. Each section: `### <Section name>` header, then bullets inside a
   ` ```text ` fence (terminal / monospace body)
5. Do **not** wrap the whole blurb in one outer fence

If the file already exists for today, **update** it with the latest blurb (do not
append duplicates). Create parent folders as needed. This archive is
**Prasath-only** — never mention `fixes/stand_up/…` in Jira, Bitbucket, or the
spoken standup (see `betfred-facing-no-cursor-leak`).

## Sources (read quickly, do not dig forever)

Use these **privately** to draft the blurb — do **not** name these paths in
the spoken/copy-paste standup (see rule `betfred-facing-no-cursor-leak`):

1. Active Jira (Atlassian MCP) — assignee Prasath, recent `DE-*` dimension tickets
2. Local dimension notes / fix drafts / PR paste draft (personal reference only)
3. **`fixes/.../delivery_checklist.md`** for each active dim — first unchecked
   row = today’s work; do not invent status that contradicts it
4. Prior day file under `fixes/stand_up/…` if useful for “Yesterday”
5. Glue branch tip if needed: `data-platform-glue-etl-transactional-data-jobs` only
6. Meeting decisions from the day (DELETE vs MERGE, Liquibase, etc.)

## Output shape (exact) — follow every day

Show the blurb in chat **and** write the archive file.

**Visual layout:** section names = markdown `###` headers (larger). Bullet
lines = inside ` ```text ` fences (terminal / monospace font in preview and
chat). Hyphen bullets, one line each.

**Archive file skeleton:**

```markdown
# Daily standup — <Weekday DD Mon YYYY>

*Personal reference only — do not cite this path in team standup.*

## Standup — <Weekday DD Mon>

### Overview

```text
- …
```

### Yesterday

```text
- …
```

### Today

```text
- …
```

### Important bits

```text
- …
```

### Questions

```text
- …
```

### Blockers

```text
- None
```
```

**Chat:** use the same structure (rendered headers + monospace blocks). For
Teams/standup speech, copy bullet lines from the `text` fences only.

### Content rules (mandatory pattern)

1. **Overview first** — ticket + dim + outcome in plain language (max 2 bullets).
2. **Important bits** — shared utilities / patterns (one short clause per bullet).
3. **Questions** — clear yes/no or A/B; `- None` if none.
4. British spelling; tickets (`DE-XXXX`) + dim names.
5. Max ~10–12 bullets total across all sections.
6. Betfred-facing: **never** Cursor, skills, `fixes/…`, or personal paths.
7. **Never** “Place 1”, “Place 2”, or “Place 3” in standup — say **DEV validation**
   or **Post-deploy prod validation** with the compare pair (rule
   `betfred-facing-no-cursor-leak`).
8. If PR-to-main is next, say so in **Today** — no local draft paths.
9. **Teams / Slack paste:** emphasise table/column/report names with **bold**,
   not backticks (no grey code chips). Rule: `betfred-facing-no-cursor-leak`.

Saving under `fixes/stand_up/…` is required for your archive only.
