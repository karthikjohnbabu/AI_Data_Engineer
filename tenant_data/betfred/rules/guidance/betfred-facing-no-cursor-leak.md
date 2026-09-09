# Betfred-facing vs Cursor-private (HARD RULE)

## Cursor folder = private reference only

Everything under the workspace folder **`Cursor/`** is for **Prasath’s local
reference** (notes, triage, `dimensions/`, `fixes/` including
`fixes/stand_up/{year}/{Month}/daily_standup_*.md`, `validation/`, evidence
drafts, skills, rules). It is **not** a Betfred source of truth and must **not**
be treated as something to sync into Jira, Confluence, Bitbucket, or team chat.

Daily standup archive files are written for personal history only — still never
cite `fixes/stand_up/…` in team-facing standup text.

## Never put Cursor anywhere in Betfred artefacts (code included)

Applies to **every** Betfred git repo (`data-platform-*`), **Jira**,
**Bitbucket PRs**, **Confluence**, standup/Slack/Teams, Terraform, JSON
configs, Glue scripts, SQL, commit messages, and PR bodies.

**Forbidden strings / references (case-insensitive where relevant):**

- `Cursor`, `cursor`, `.cursor`, `Cursor/`, `.cursor/skills`, “Cursor folder”
- Local paths: `fixes/…`, `dimensions/…`, `validation/…`, `Genie/` (if renamed)
- Agent/router/product names (Auto, MCP, “AI created this ticket”)
- Any path under the private workspace that is not a normal repo path
- **Internal validation labels:** `Place 1`, `Place 2`, `Place 3`, “test place”
  numbering — **Jira / PR / standup / Slack only**; use team-facing wording below
- **Triage teaching nicknames / metaphors** (private docs only): `Alice`,
  `Bob`, `Carol`, “shelf-only”, “two fridges”, “till receipts”, and similar
  story labels from layman triage — **never** in Jira / PR / Teams unless the
  same sentence spells out the real meaning (who / which system / why). A
  reader opening only the ticket must understand it with **zero** local docs.

**Ambiguous “cursor” (HARD):** even when you mean Glue
`--cursor_timestamp` / S3 LastModified pagination, **do not** write bare
“cursor” or “arrange with cursor” in Jira / Teams / PR paste. Say
**S3 LastModified pagination resume** (or name the full arg only in
technical repo docs, not team paste).

**Also never hedge AWS:** no “NEW if missing” in team paste — verify with
`describe-table` / `list-tables` first (devil’s-advocate **L5** /
`dimension-proposed-solution`).

**In code and comments:** do not add inline comments, docstrings, README lines,
or commit messages that mention Cursor, local triage folders, or IDE tooling.
Use Jira keys (`DE-XXXX`) or neutral prose only.

## Jira / Teams / PR — self-contained only (HARD RULE)

Anyone reading **only** the ticket (or Teams thread) must get the point.
Do **not** paste private shorthand that depends on `triage_validation`, chat,
or teaching metaphors.

| Forbidden in Jira (unless fully expanded in-line) | Write instead (example) |
|---|---|
| “Bob / shelf-only rows” | “Rows that exist only on SQL (CDC full Casino history) and never on the Playtech report API — expected, not a Glue bug” |
| “Alice / Carol” | “Keys present on both systems” / name the attribute |
| “source-system-gap” alone | One sentence: SQL = CDC; AWS = Playtech API; full counts will not match |
| “Place 2 PASS” | “**DEV validation** PASS — test SQL → DEV Redshift …” |
| Internal checklist jargon | Plain status + numbers + next wait (e.g. Playtech reply) |

**In Jira / team chat:**

- Do **not** mention local draft paths (e.g. `fixes/deposit_limit_history/pr.md`)
- Do **not** say work was done “in Cursor” — team uses **Claude**; no toolchain ads
- Do **not** update Jira **just because** a private note file changed — only when
  the user asks, or a skill requires a **named** ticket update for migration
  outcome (findings, DEV status), still with zero Cursor/local paths
- **Fail** a Jira update if a colleague would need the private triage doc to
  decode a nickname or metaphor

## Teams / Slack / standup paste — bold, not grey code boxes

When drafting text Prasath will **copy into Teams, Slack, standup, or email**
to colleagues (meeting asks, short status, Playtech questions):

- Use **bold** for table names, columns, report names, job names
  (e.g. **Casino.ExchangeRate**, **AmountGBP**, **DER_Bonus_Actions**).
- Do **not** wrap those names in backticks (`` `like this` ``) — Teams/Slack
  render that as a grey “code chip” / out-box highlight. Prasath wants
  bold emphasis only.
- Keep messages short for Teams; save long tables for Confluence / docs /
  private notes.

**Still OK to use backticks:** IDE chat with Prasath for navigation, Glue/Python
code, Bitbucket PR technical bodies, and repo markdown where code fences are
normal.

**Creating Jira tickets:** see `no-jira-create` — never create unless the user
explicitly asks in the same message.

## What to say instead (standup / Jira / PR)

| Private (Cursor only) | Betfred-facing wording |
|---|---|
| `fixes/…/pr.md` ready | “PR description draft ready” / “raising PR to main” |
| `dimensions/de_9556_deposit_limit_history.md` | Ticket / dimension name only (e.g. DE-9556, deposit_limit_history) |
| Evidence under `fixes/…/evidence/` | “before/after screenshots ready to attach” |
| Validated via local compare | “DEV compare passed (April window…)” with metrics only |
| Place 1 (Athena pre-DEV) | “Pre-DEV logic check: test SQL → Athena Iceberg” |
| Place 2 (DEV gate) | “DEV validation: test SQL → DEV Redshift” |
| Place 3 (prod gate) | “Post-deploy prod validation: test SQL → prod Redshift” |
| Alice / Bob / Carol / shelf | Spell out pipes + “SQL-only keys expected because …” |
| `source-system-gap` alone | “Different source pipes: CDC vs report API; gate on shared keys” |

## Still OK privately (chat with Prasath in Cursor)

Referencing `Cursor/fixes/…` paths **in this IDE chat** for navigation is fine.
Do not carry those phrases into copy-paste standup, Jira comments, or the
Bitbucket body the user will paste for the team.

## Skills / rules location (unchanged)

Skills and rules stay only under `Cursor/.cursor/` — never under sibling git
repos. That is an agent constraint, not something to mention to Betfred.
