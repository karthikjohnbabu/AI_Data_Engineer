---
name: dimension-validate
description: >-
  Validate dimension migration fixes: read dimensions/de_{jira}_{name}.md plus
  fixes/{name}/, support 1-day / 1-week / 1-month windows, run compare.py with
  the right gate (incl. source-system-gap = BK intersection not full counts),
  calculate match rate, document business justification for any delta, and
  write a report under validation/reports/. Use when the user asks to validate
  a dimension fix, measure match rate, close a ticket via test SQL → prod RS,
  or produce a validation report.
---

# Dimension Validate

Prove whether a proposed dimension fix (or current gold vs legacy) meets the bar in `dimensions/de_{jira}_{name}.md`. Work in the workspace **`Cursor/`** folder. Deliverable is a written report under `validation/reports/` — not a silent pass/fail. Run `compare.py` from `../data-platform-migration-data-test/` (profiles in that repo's `mappings/`).

**Report pack (all tickets):** every validation lands under
`validation/reports/de_{jira}_{dim_name}/`. When explaining the issue, Athena
tip proof, or close readiness, also write/refresh
`de_{jira}_final_verdict.html` (diagrams + table inventory + IN/OUT + live
examples). Rule: `dimension-validation-reports`. Reference pack:
`validation/reports/de_9549_casino_pending_bonus/`.

## Prerequisites

- Atlassian MCP (`user-atlassian`) authenticated to `betfred.atlassian.net` (when validation tied to a Jira ticket)
- **Workspace folder `Cursor/`** — dimension artifacts live here, not in migration-data-test
- Paths (from `Cursor/` root): `dimensions/de_{jira}_{name}.md`, `fixes/{name}/`, `validation/reports/`
- Compare profiles: `../data-platform-migration-data-test/mappings/complex_dims/{name}.yaml`
- Env pairs in `../data-platform-migration-data-test/`: `.env` (active), `.env.dev` (**test SQL → DEV Redshift**), `.env.prod` (**test SQL → prod Redshift**; no prod SQL)
- Glue jobs: `../data-platform-glue-etl-transactional-data-jobs/glue-jobs/.../uk_digital_dimension_*.py`
- **Git:** bare `git push` / commit → **only** `data-platform-glue-etl-transactional-data-jobs`; other repos only if the user names them
- Legacy SQL procedures: `../data-platform-legacy-enterprisedatawarehouseunity/Stored Procedures/XtrlTransform.usp_etl_table_transform_1_dimension_*.sql` (e.g. `...DepositLimitHistory.sql` for `deposit_limit_history`)
- **AWS SSO:** if STS / Redshift Data API / Athena fails on expired token, run
  `aws sso login --profile <dev|prod>` for the compare pair, then retry — rule
  `aws-sso-proactive.mdc`. Export `AWS_PROFILE` so shell does not override `.env`.

## Hard rules

0. **Declare the compare pair before every run / result** (rules
   `migration-compare-env-pair`, `dimension-delivery-order`). In **chat** you
   may also say Place 1 / 2 / 3; in **Jira / PR / standup** use team-facing
   labels only (never “Place 3”). Pairs:
   1. *test SQL → Athena Iceberg tip* (Place 1 — pre-commit / pre-DEV)
   2. *test SQL → DEV Redshift* (Place 2 — after DEV gold ready)
   3. *test SQL → prod Redshift* (Place 3 — after prod deploy)
   Never prod SQL (`BGB-BP`). Ask if unclear; repeat the **pair** when quoting
   match rates.
0b. **Parity method** (rule `legacy-parity-verification`, from DE-9558):
   - Prefer live outputs over eyeballing Glue vs proc.
   - Watch **surrogate ID vs business key** literals — silent wrong answers.
   - Before trusting a DEV run: `GROUP BY DATE_TRUNC('minute', ds_ts_processed)`
     — one stamp ⇒ empty-table rebuild (insert-only path).
   - Separate **correctness** (logic OK) from **repair** (existing rows need
     backfill/reload); say so in the report / PR.
   - Escalate to Athena re-implement + checksum when key-space / CTE logic is
     the risk; keep `compare.py` for presence/attribute gates.
1. **Read the fix file + dimension spec first** (`fixes/{name}/` + `dimensions/de_{jira}_{name}.md`).
2. **Support validation windows: 1 day, 1 week, 1 month** — pick explicitly; default to the window in the dimension spec when set.
3. **Generate the same query for SQL Server test and Redshift/Iceberg** — same grain, filters, and metrics; only dialect/table names differ.
4. **Calculate match rate** and compare to the acceptable threshold in the spec.
5. **Document business justification for any delta** — never leave unexplained gaps.
5a. **Post-deploy prod validation (mandatory BK gate):** after merge + prod Glue
   runs, always run **business key overlap from test SQL Server → prod
   Redshift** — same BK grain and attribute checks used at DEV validation.
   Prod smoke alone (row count, null %, ticket-specific filters) is **not**
   sufficient to close a ticket. Record intersection %, SQL-only, warehouse-only,
   attribute match on shared keys, and count-mismatch justification when SQL
   rows ≠ warehouse rows. Write to `final_prod_results.md` and Jira.
5b. **Legacy DELETE+reinsert ≠ full-history baseline** (DE-9567 session_history
    and any dim whose SQL proc **DELETE**s all prior rows for entities in the
    batch, then INSERT only the current window):
    - SQL Server **does not accumulate true history** for returning players.
    - Glue MERGE/UPSERT **keeps** older gold rows → **Glue row counts will
      legitimately exceed SQL’s**. That is **not a Glue bug**.
    - **Do not** use full-table / long-window presence vs SQL as the deploy
      gate, and **do not** FAIL solely because `only_rs` / RS count ≫ SQL.
    - Prefer: short busy windows, **intersection** attribute checks
      (same keys on both sides — e.g. duration / `logoutdate` for pairing),
      or “sessions created in window” — document the caveat in every report.
    - **RED ALERT** (SQL=0 & RS>0) still applies for a *window that should
      have SQL rows*; do not confuse that with “Glue has more history than
      SQL for a returning player.”
5c. **`source-system-gap` / different pipes (e.g. DE-9549 casino_pending_bonus):**
    When legacy SQL is fed by **CDC of a full operational DB** and AWS/Iceberg
    is fed by a **narrower API/report** (or vice versa):
    - **Do not** FAIL (or block Done) on full-table row-count equality alone —
      but **do** investigate when intersection attributes are near 0% (may be
      ID-space / vocabulary / false BK pairing — see DE-9549 triage_validation).
    - **Gate = BK intersection attribute match** on columns that *should*
      match for shared keys. Document SQL-only / RS-only in **private**
      reports with Alice/Bob/Carol if useful; in **Jira** spell out pipes
      (no nicknames — see § Jira comments).
    - Put accepted hardcoded / stub measures in
      `exclude_from_comparison` (e.g. `amount_gbp`, `bonus_wagering`)
      **only after** a closed-claim audit on any Done ticket that supposedly
      authorised the stub — quote the **exact column**; verify live that the
      stub is still intentional (rule `jira-related-ticket-verify`). Do not
      expand “always zero” from wagering to GBP without a named quote.
    - If the column is missing on an **API** feed: exhaust mapping + ask
      vendor first; **Option B** (SGP FX etc.) only after vendor says no
      (rule `api-missing-column-ask-vendor-first`). Record the ladder in
      `triage_validation.md` / **full** `.html` (DE-9549 depth, not stub;
      rule `dimension-validation-reports`), not only in chat.
    - Watch **DLM windows** on dims that bulk-stamp `date_last_modified` —
      prefer `start_date` / Iceberg-keyed intersection when DLM is write-time.
    - Close ticket only when: (1) intersection attributes PASS on agreed
      fields, (2) population gap justified, (3) prod pair used for final gate,
      (4) ops/API health called out if relevant.
    - Still run `compare.py` — change the **contract**, not the tool.
    - Write results into `fixes/.../triage_validation.md` on ground work.
    - Reference: `fixes/dimensions/in_progress/de_9549_casino_pending_bonus/triage_validation.md`
6. **Write a validation report under `validation/reports/`**.
   Put each ticket under its own folder:
   `validation/reports/de_{jira}_{dim_name}/…`
   Examples:
   `validation/reports/de_9549_casino_pending_bonus/prod_2026-08/`,
   `validation/reports/de_9556_deposit_limit_history/de_9556_deposit_limit_history_1month_2024-04-01_2024-04-30.md`.
   On **ground work**, also copy the analysis into
   `fixes/dimensions/{status}/de_{jira}_{name}/triage_validation.md`.
   Status folders are **`in_progress`** or **`done` only** (no `to_do` / `blocked`).
   **Also** write/refresh **`de_{jira}_final_verdict.html`** in that folder when
   the user wants a verdict / Athena tip walkthrough / close readiness
   (rule `dimension-validation-reports`; DE-9549 reference). Supporting
   business-justification / how-to-close / field-map HTML stay in the same dir.
7. **Do NOT mark PASS if both sides use current-status joins.** Agreement between two current-status-biased pipelines (e.g. legacy Timeout and unfixed gold) is a **false PASS** — shared under-count, not correctness.
8. **Require an event-level reference query in every `status-overwrite` report.** Include the SQL (and count/match vs gold) under `validation/reports/.../queries/` (or equivalent). No event-level reference → result is at most **AWAITING / FAIL**, never PASS.
9. **Primary oracle for `time_out` = Iceberg event-level Timeout** (same window; history ⋈ reason on the **event**; player attrs only). Legacy SQL Server Timeout is **secondary** and current-status biased — never the deploy gate. PASS = gold vs this set ≥ threshold (from `dimensions/done/de_9668_time_out.md`, typically ≥ 90%) with justified residuals.
10. **Never DROP / CREATE / ALTER gold Redshift tables from Glue `.py` jobs** — if validation needs a new column, DBA runs manual drop/recreate using `fixes/{name}/*.sql`, then Glue full reload. Do not add `DROP TABLE` / `CREATE TABLE` / `ALTER TABLE` for gold targets in Python.
11. **Ask before creating any temp / dry-run table in any env** — see below.

Do not treat zero tolerance tooling output as automatic failure when the dimension spec allows e.g. ≥ 90% and classifies remaining gap as `status-overwrite` / `source-system-gap` / `accepted-noise` / `hardcoded-measure` — but only after the correct oracle / intersection gate above.

---

## Ask before temp / dry-run tables (any env)

**Hard rule:** Before `CREATE` / `CTAS` / `DROP` of any table — including clearly named dry-run or temp tables — **stop and ask the user first**. Do not auto-run.

Ask with this detail so they can check with the team:

```text
I need to create a temporary/dry-run table:

- Env / account: …
- Engine: Athena Iceberg | Redshift | …
- Database / schema: e.g. prod_dp_dwh_uk_digital
- Table name: e.g. deposit_limit_history_dry_run_de9556
- Operation: DROP IF EXISTS + CREATE TABLE … AS …
- Why: …
- Cleanup: DROP after compare? yes/no

OK to proceed?
```

Applies to **sandbox / dev / test / prod**. “Temp” or `*_dry_run_*` in the name does not skip the ask.
Name-only dry-run SELECTs (no new table) do not need this ask.

---

## Jira comments (Betfred-facing — self-contained)

When updating Jira via MCP or drafting paste text for the user.
Rule: `betfred-facing-no-cursor-leak` (**Jira / Teams / PR — self-contained**).

### Hard rules (fail the comment if broken)

- **Never** “Place 1/2/3”, Cursor paths, agent names.
- **Never** triage nicknames alone: **Alice / Bob / Carol**, “shelf-only”,
  “two fridges”, “till receipts”, or “Bob rows” — a colleague reading **only**
  Jira will not have the private teaching doc.
- **Always** name **compare pair**, **window** (or full-table), and numbers.
- If pipes differ: **one plain sentence** naming both sources (e.g. SQL =
  Casino CDC; AWS = Playtech report API) and what that means for counts.
- Justify SQL-only / RS-only keys in **system language**, not story names.
- For **Teams / Slack** paste: **bold** table/column names — **no backticks**.

| Stage | Jira heading (examples) |
|---|---|
| After DEV gold | **DEV validation** |
| After prod deploy + reload | **Post-deploy prod validation** |
| Pre-DEV Athena tip | **Pre-DEV logic check** (optional; often skip Jira until DEV) |

**Private reports** (`validation/reports/…`, triage HTML) may still use
Alice/Bob/Carol for teaching. **Jira must not** — translate before posting.

**Prod comment skeleton:**

```markdown
## Post-deploy prod validation

**Compare:** test SQL Server (BGB-BT / Unity `<table>`) → prod Redshift `uk_digital.dimension.<table>`

**Window:** YYYY-MM-DD → YYYY-MM-DD (inclusive) — or full-table when dim has no date grain
**Business key:** `<bk_column>` (must match DEV validation grain)

| Check | Result |
| --- | --- |
| Prod total rows | … |
| Ticket smoke (e.g. 0 OK%) | … |
| SQL BKs in scope | … |
| **BK intersection (SQL → prod)** | **… / … (…%)** |
| SQL-only BKs | **0** (or justified in one sentence naming why) |
| Attribute match on shared BKs | e.g. event_name 100%, account_number 100% |
| Count mismatch note | If SQL rows ≠ prod rows — one-line justification |

**Verdict: PASS** — aligned with DEV validation (same BK gate + metrics).
```

**Different source pipes addendum** (e.g. casino_pending_bonus — CDC vs API):

```markdown
## Post-deploy prod validation

**Compare:** test SQL Server (…) → prod Redshift …
**Gate:** match attributes on shared business keys — do **not** require
SQL total row count == Redshift (different source pipes).
**Source pipes:** SQL = full Casino pending-bonus history via CDC;
AWS gold = Playtech report API only. Keys that exist only on SQL are
expected and are not a Glue failure.
**Excludes:** only after closed-claim audit — e.g. bonus_wagering (named
zero in Done ticket + live) may stay excluded; do **not** auto-exclude
amount_gbp just because a sibling measure was stubbed.

| Check | Result |
| --- | --- |
| BK intersection | … / … (…%) |
| SQL-only keys | … — expected (CDC history not on Playtech report) |
| RS-only keys | … |
| Attribute match on shared BKs | … |

**Verdict: PASS** for migration scope. Population gap vs SQL is by design.
Stub measures remain excluded.
```

Add reload context (cleanup job + Glue run) in one short bullet block if relevant.

---

## Workflow

```
Dimension validate:
- [ ] 1. Read fix + dimensions/de_{jira}_{name}.md
- [ ] 2. Choose window (1 day | 1 week | 1 month)
- [ ] 3. Generate paired queries (SQL Server + Redshift/Iceberg)
- [ ] 4. Run or instruct run; calculate match rate
- [ ] 5. BK overlap + justify every material delta (counts + intersection)
- [ ] 6. Write validation/reports/{...}.md
- [ ] 7. Post-deploy: repeat BK gate test SQL → prod Redshift → final_prod_results.md + Jira
```

### 1. Read the fix file + dimension spec

Required inputs:

| Input | Purpose |
|---|---|
| `dimensions/de_{jira}_{name}.md` | Tables, grain, known issues, acceptable match rate, preferred window |
| `fixes/{name}/` | Proposed change under test (`README.md`, patches, notes) |
| `mappings/complex_dims/{name}.yaml` | PK / column map when available |

Capture before querying:

- SQL Server test table / view
- Redshift gold (and Iceberg curated/silver sources if validating upstream)
- Grain / PK columns
- Date column for the window
- Acceptable match rate (e.g. ≥ 90%)
- Classification of known issues

If the fix folder is missing, validate **current** gold vs legacy and say so in the report.

### 2. Validation windows

Support exactly these sizes (calendar-aligned unless the user gives exact timestamps):

| Window | Meaning | Example |
|---|---|---|
| **1 day** | Single calendar day | `2026-04-15` |
| **1 week** | 7 consecutive days | `2026-04-01` → `2026-04-07` |
| **1 month** | One calendar month | April 2026 |

Defaults:

- Prefer the window named in `dimensions/de_{jira}_{name}.md` (e.g. April → **1 month**)
- If unspecified, ask once; otherwise use **1 week** as a safe middle ground
- Always record the exact `[start, end)` or inclusive bounds used

### 3. Generate the same query for SQL Server test and Redshift/Iceberg

Produce **one logical query**, two dialects.

Logical shape (adapt columns from the spec):

```text
SELECT
  <grain_keys>,
  <compared_attributes>
FROM <dimension_table>
WHERE <date_col> >= @start
  AND <date_col> <  @end   -- or inclusive end; be consistent on both sides
```

Then emit:

1. **SQL Server (test)** — bracketed names, legacy column names  
2. **Redshift (gold)** — quoted `"db"."schema"."table"`, snake_case  
3. **Iceberg / Athena (optional)** — when validating upstream curated/silver vs gold; same grain and window

Rules:

- Same grain keys after column mapping
- Same date predicate semantics (watch `datetime` vs `date` vs int date ids)
- Same filters (e.g. reason = Timeout at **event** level if that is the fix)
- Prefer count + key-set compare first; attribute compare second

Store the paired SQL in the report and optionally under:

`validation/reports/{name}_{window}_{yyyymmdd}/queries/`

### 4. Calculate match rate

Primary metric (row grain):

```text
matched_keys   = keys present on both sides with equal compared attributes
            (or keys present on both sides if count-only stage)
union_keys     = distinct keys on SQL Server ∪ distinct keys on Redshift
match_rate     = matched_keys / union_keys
```

Also report:

| Metric | Definition |
|---|---|
| `sql_count` | Rows in window on SQL Server |
| `rs_count` | Rows in window on Redshift |
| `only_sql` | Keys only on SQL Server |
| `only_rs` | Keys only on Redshift |
| `attr_mismatch` | Same key, different attribute values |
| `match_rate` | As above |
| `threshold` | From `dimensions/de_{jira}_{name}.md` (e.g. 0.90) |
| `pass` | `match_rate >= threshold` **and** every material delta justified |

If using the migration CLI / datacompy, map its outputs into these fields — do not invent a second conflicting score.

### 4c. DE-9567 / `session_history` — SQL is not a history oracle

Read `dimensions/in_progress/de_9567_session_history.md` (C1) before scoring:

| Do | Don’t |
|---|---|
| Treat Glue **> SQL** row counts as **expected** when players re-appear | FAIL because presence < 90% on a long window solely due to SQL wipe |
| Gate on **pairing quality** (matched `player_bk`+`logindate` → logout/duration) | Use SQL full history as reconciliation baseline |
| State in the report: “SQL DELETE/reinsert — not a true historical baseline” | “Fix Glue to match SQL row counts” |

Same pattern: if triage labelled `accepted-noise` / legacy history-wipe, apply this
section — not only session_history.

For **`deposit_limit_history`** ([DE-9556](https://betfred.atlassian.net/browse/DE-9556)), do **not** PASS on presence alone. Read `dimensions/done/de_9556_deposit_limit_history.md` and enforce:

1. **Presence gate:** `matched_keys / union_keys ≥ 90%` on PK `(account_history_log_id, player_deposit_limit_bk)`.
2. **Attribute gate (intersection):** report **separate** match rates for at least:
   - `FirstTime_DL` / `first_time_dl` (and `is_first_dl` if on gold)
   - `Daily_DL` / `daily_dl` — apply float tolerance **abs &lt; 1e-4** before calling a mismatch
   - `CustomerID` / `customer_id_legacy` — populated parity **or** documented IMPLEMENT / SIGN-OFF / DEFER (mapping omission ≠ PASS)
3. **Hard example (pre-fix):** April 2024 presence **~89.3%** with raw all-column attr-equal **~56%** = **FAIL / Needs review**, never PASS.
4. **Post-fix DEV example (2026-08-24):** after `valid_from = valid_from_utc` + reload, April presence **96.08%** PASS (matched 24,508 / union 25,508); `customer_id_legacy` **100%** on intersection.
5. **Classify residuals:** INNER candidate (BK never in gold), grain/sentinel (`log_id=-1` / `BK=-1`), first-DL, timezone/current flag, float noise, other — see `validation/reports/de_9556_deposit_limit_history/de_9556_deposit_limit_history_mismatch_sample_2024-04.md`.
6. Report template for this dim must show **two scores**: `presence_match_rate` and per-attribute rates (plus CustomerID decision). Deploy recommendation stays **Needs review** until both gates and CustomerID are clear.

Other dimensions keep the generic §4 rules unless their `dimensions/de_{jira}_{name}.md` adds a similar split.

### 4c. Post-reload DEV evidence (going forward — every dim)

After DBA DDL + watermark reset + Glue reload on **DEV**, always run `compare.py` and capture **PR-ready evidence** under `fixes/{name}/evidence/` (and fold into `fixes/{name}/pr.md` via `dimension-pr`):

1. **Presence (composite PK) before → after** — one table:
   - **Before:** last compare against gold that still had the bug (or pre-reload backup window).
   - **After:** same window against reloaded tip gold.
   - Columns: SQL rows, RS rows, matched, only_sql, only_rs, **presence %**, PASS/FAIL vs threshold.
2. **New / fixed column screenshots** (e.g. `customer_id_legacy`):
   - **Before (schema / missing column):** fields view only (Field / Type /
     NL / CMP) — **no** table-name title bar. Full column list for the
     backup/pre-DDL table (omit the new column, e.g. no `customer_id_legacy`).
   - **After (populated values):** data grid + the **Export/Chart** side of
     `evidence/results_chrome_reference.png` only — **no** `Result 1 (N)` /
     table-icon label on the left. Do not stretch the toolbar strip.
   - Save as `fixes/{name}/evidence/{column}_before.png` + `{column}_after.png`.
   - **Look and feel (mandatory):** must look like a real SQL-client result
     grid the engineer captured — **not** a coloured markdown/AI table.
     **Palette (use these greys — keep grid lines subtle, not loud):**
     - column header row: `#2c3943`
     - base / even rows + grid/chrome lines: `#2f343c`
     - alternating dark rows: `#252a31`
     Style references under `fixes/deposit_limit_history/evidence/`.
   - **Crop (mandatory):** keep the **data view only** — chrome + column header
     + populated rows. **Cut all empty panel / blank space below the last
     record.** Image bottom edge sits a few pixels under the last data row.
     Never ship a tall 16:9 frame with a void under the grid. If a capture or
     generated stand-in has trailing empty space, crop it before putting it in
     `evidence/` or `pr.md`.
   - **Font (Redshift Query Editor):** use **Open Sans** (Cloudscape / QE v2
     primary). Bundled under `evidence/fonts/OpenSans-{Regular,SemiBold,Bold}.ttf`.
     Headers: SemiBold; body: Regular. Do **not** use Arial/Menlo for result
     grids — it reads differently from Redshift. Fallback if missing: Helvetica
     Neue (Amazon Ember stack), never a monospace coding font.
   - **No stretched text / chrome:** redraw title / `Result 1 (N)` with a
     normal font — never paste a horizontally scaled strip. No blue underlines
     or blue grid outlines (scrub blue pixels).      On Results / schema title chrome, place the real table icon from
     `evidence/table_icon_reference.png` immediately before
     `deposit_limit_history` / `Result 1 (N)` (uniform scale only; ~22px tall,
     vertically centre-aligned with the label in the chrome bar).
     **Test** before saying done: zero blue pixels; title/label glyph aspect
     sane; table icon present; tight crop.
3. **Update Jira (mandatory at this stage)** — when DEV validate PASSes and
   you are preparing / drafting the PR to `main`, update the ticket in the
   style of [DE-9555](https://betfred.atlassian.net/browse/DE-9555):
   - Description **Findings** table (include new UTC / window findings)
   - Comment: **Fixes implemented**
   - Comment: **Additional Findings** + presence before/after
   - **Remind the user** aloud: Jira is due now before Bitbucket PR to main.
   - **Wording:** never “Place 1/2/3” in Jira — use § **Jira comments** below.
3b. **Prod final evidence** — after test SQL → **prod** Redshift compare
   PASSes the presence gate, write
   `fixes/{name}/final_prod_results.md` as **Jira-paste ready** (heading
   `PASTE INTO JIRA (DE-XXXX) — copy everything below this line`; Betfred-
   facing body only; **no Place numbering**). Tell the user to paste into a
   Jira comment and close the ticket when appropriate. See
   `dimension-watermark-reset`.
4. Do **not** treat Athena dry-run as this evidence — authoritative side is DEV Redshift gold vs SQL Server.
5. Tell the user when evidence is ready for `pr.md` / Bitbucket (images must be **attached or pasted** into the Bitbucket description; Cursor-local paths alone will not render for reviewers).

### 5. Document business justification for any delta

Every non-empty `only_sql`, `only_rs`, or `attr_mismatch` bucket needs a justification, or an explicit **open** with the next probe.

Common justified classes (align with dimension-triage):

| Class | When it is acceptable |
|---|---|
| `status-overwrite` | History dropped/kept differently after Timeout → Self Exclude (etc.) |
| `timing-skew` | Live systems compared at different moments |
| `key-strategy` | Unpairable keys; totals still coherent |
| `accepted-noise` | Below residual allowance after root cause explained |
| `fix-verified` | Delta gone after applying `fixes/{name}/` |
| `bug` | Unjustified; fix required |

Do not mark **pass** if unjustified `bug` deltas remain above noise.

### 6. Write a validation report under `validation/reports/`

Path convention (ticket folder first — rule `dimension-validation-reports`):

```text
validation/reports/de_{jira}_{dim_name}/
  de_{jira}_final_verdict.html          # when tip / explain / close readiness
  de_{jira}_*_business_justification*   # after compare with deltas
  de_{jira}_how_to_close_ticket_*       # when closing
  {window}_{start}_{end}.md             # compare run notes
  athena_verdict/ | queries/ | samples/ # raw evidence
```

Examples:

- `validation/reports/de_9549_casino_pending_bonus/de_9549_final_verdict.html`
- `validation/reports/de_9668_time_out/de_9668_time_out_1month_2024-04-01_2024-05-01.md`

`final_verdict.html` must include: TOC, verdict banner, compare pair, layman
picture, IN/OUT, **tables inventory**, Mermaid + ASCII E2E with findings
tagged on the diagram, named examples, live keys, tip SQL, decision board.
See rule `dimension-validation-reports` and DE-9549 reference HTML.

Optional artifacts beside the report:

```text
validation/reports/de_{jira}_{dim_name}/{window}_{start}_{end}/
  queries/sqlserver.sql
  queries/redshift.sql
  queries/iceberg.sql          # optional
  samples/only_sql.csv         # optional small samples
  samples/only_rs.csv
```

---

## Report template

```markdown
# Validation: {name}

- Dimension spec: `dimensions/de_{jira}_{name}.md`
- Fix under test: `fixes/{name}/` | none (baseline)
- Window: 1 day | 1 week | 1 month
- Bounds: {start} → {end}
- Threshold: ≥ {pct}%
- Branch / commit: …

## Summary
- presence_match_rate: {x}%
- attribute rates (intersection): first_time_dl / daily_dl (tolerant) / …
- CustomerID: populated | sign-off | open
- Result: PASS | FAIL | NEEDS REVIEW | PASS WITH JUSTIFIED DELTA
- One-line verdict: …
- (deposit_limit_history / DE-9556: PASS only if presence ≥ 90% **and** attribute + CustomerID gates in dimensions doc)

## Counts
| Side | Count |
|---|---|
| SQL Server (test) | |
| Redshift (gold) | |
| Iceberg (if used) | |
| only_sql | |
| only_rs | |
| attr_mismatch | |
| matched | |

## Queries
### Logical
### SQL Server
### Redshift
### Iceberg (optional)

## Match rate calculation
Show the formula and numbers used.

## Deltas and business justification
| Bucket | Keys (sample) | Class | Justification |
|---|---|---|---|
| only_sql | … | status-overwrite | … |

## Conclusion
- Meets threshold? Yes/No
- Remaining risk
- Recommended next step
```

---

## Three test places (do all three over the ticket life)

| Place | When | How |
|---|---|---|
| **1. Athena** | Tip written; **Glue not yet in DEV** (or anytime for logic re-check) | Re-implement fixed transform over Iceberg (`bvt_action`, etc.) in Athena; compare to test SQL. Name-only SELECT preferred; ask before CTAS. Label proxies. |
| **2. DEV RS** | After Commit → DEV deploy → gold ready / reload | `compare.py` test SQL → DEV Redshift — **authoritative DEV** (deposit_limit_history style) |
| **3. Prod RS** | After PR + prod deploy | `compare.py` test SQL → prod Redshift — **final** |

Place 1 is valid precisely because Iceberg curated tables already exist — you do
not need the Glue job deployed to exercise tip pairing/joins. Place 1 ≠ Place 2.

Delivery order: rule `dimension-delivery-order`.

---

## Athena dry-run vs authoritative compare (DE-9556 lesson)

**Authoritative validation** is always:

| Side | System | How |
|---|---|---|
| Legacy | SQL Server (test) | `compare.py` / ODBC |
| Gold | Redshift `uk_digital.dimension.*` | `compare.py` / Redshift Data API |

Athena is **not** a substitute for Redshift gold. Athena queries **Iceberg** in the Glue Catalog (e.g. `prod_dp_dwh_uk_digital`). Redshift `dimension.player` (~12M rows) is **not** an Athena table.

### What went wrong / what we tried

1. Wanted a tip-logic dry-run **without** deploying Glue to Redshift.
2. Rebuilt `deposit_limit_history` shape in Athena from Iceberg `sgp_player_deposit_limit` + `sgp_deposit_limit_type`.
3. Player enrich in Glue uses Redshift `dimension.player`. In Athena we used Iceberg **`sgp_player` as a proxy** — not the Redshift dim. `customer_id_legacy` was hard-coded `-1` in the dry-run SQL.
4. Pulling ~12M player rows (or huge inline VALUES) into Athena/client → **413 / too large**. Parquet side-table path was incomplete.
5. One ad-hoc Athena presence run (~87.7%) was **approximate only**.

### Rules going forward

- Do **not** try to “compare Redshift in Athena” — they are different stores.
- Do **not** inline 12M player rows into Athena SQL or pull them to the laptop.
- **Athena can join 12M in place** — CTAS / SELECT that LEFT JOINs Iceberg
  `sgp_player` inside Athena is fine. Use `athena_unload: true` on the compare
  profile so the (smaller) result window comes back as Parquet (~180x faster),
  not row-by-row through the API. See `docs/athena-unload.md` and
  `mappings/complex_dims/deposit_limit_history_dry_run_athena.yaml`.
- Athena dry-run (Iceberg + proxies) is **Place 1** — useful pre-DEV logic
  gate; still not a substitute for Place 2 (DEV gold) or Place 3 (prod gold).
- Prefer delivery order (`dimension-delivery-order`): Place 1 Athena → DA/PR →
  Commit → DEV → watermark → Place 2 test→DEV RS → … → Place 3 test→prod RS.
  Fold presence before/after + screenshots into `fixes/{name}/evidence/` and
  `pr.md` after Place 2 (see §4c and `dimension-pr`).

### Recommended Athena dry-run flow (Place 1)

1. Port tip Glue logic to Athena SQL over Iceberg sources (same grain/window
   as the compare profile where possible).
2. **Ask the user first** (temp-table rule) before any CTAS; name-only SELECT
   does not need the ask.
3. If CTAS approved: write under `fixes/{name}/` (e.g. `dry_run_iceberg_*.sql`)
   + optional `mappings/complex_dims/{name}_dry_run_athena.yaml` with
   `athena_unload: true`.
4. `compare.py` Place 1 (or ad-hoc Athena vs SQL counts/checksums); report as
   Place 1; then Place 2 after DEV gold.
5. Ask before `DROP` cleanup of any dry-run table.

---

## Done checklist

- [ ] Read `dimensions/de_{jira}_{name}.md` + `fixes/{name}/`
- [ ] Window is one of: 1 day, 1 week, 1 month (bounds recorded)
- [ ] Paired queries generated for SQL Server test and Redshift/Iceberg
- [ ] For `session_history` / DE-9567 (or any `legacy-history-wipe`): did **not**
      FAIL solely because Glue ≫ SQL row counts; intersection / pairing gate used;
      C1 caveat stated in the report
- [ ] Match rate calculated and compared to threshold
- [ ] For `deposit_limit_history` / DE-9556: presence **and** attribute gates (+ CustomerID decision) both evaluated; float tol on `daily_dl`
- [ ] After DEV reload: **presence before/after** table captured for `pr.md`
- [ ] After DEV reload: **before/after screenshots** for any new column under `fixes/{name}/evidence/` — **DBeaver-dark / Redshift QE look**, **cropped to data view only** (no empty space below last row); see §4c + `style_reference_dbeaver_dark.png`
- [ ] **Jira updated** (DE-9555 style) when DEV PASSes and PR to `main` is next — remind the user
- [ ] Every material delta has a business justification (or marked open)
- [ ] Report written under `validation/reports/`
- [ ] If Place 1 Athena used: labelled Place 1 / proxy; not used as Place 2 PASS
- [ ] Place 2 (test→DEV RS) and Place 3 (test→prod RS) planned/done at the right stage
- [ ] User approved any CREATE/DROP of temp or dry-run tables (any env) before running
- [ ] `fixes/.../delivery_checklist.md` updated for Place 1/2/3 / reload steps
      completed this session (rule `dimension-delivery-order`)
