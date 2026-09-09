---
name: dimension-triage
description: >-
  Triage / ground work for Betfred dimension migration Jira tickets: read ticket
  + comments, follow every pasted URL/API/Bitbucket/attachment/mapping xlsx,
  audit related Done/Closed tickets, missing API-column ladder (ask vendor
  before Option B), layman source-pipe analysis, triage_validation.md+.html as
  one-stop, classify (incl. source-system-gap), recommend fix vs needs more info.
  Use when the user asks to triage, do ground work / groundwork for a Jira
  ticket, investigate a complex dimension mismatch, or standup on a dimension
  ticket.
---

# Dimension Triage

Workflow for investigating UK Digital (and related) **dimension migration**
issues and keeping `dimensions/{status}/de_{jira}_{name}.md` as the source of
truth (status = `in_progress` | `done`).

## When to use

- User pastes or names a Jira ticket (`DE-XXXX`, `BED-XXX`) for a dimension
- User says **ground work** / **groundwork** / **do the ground work** for a ticket
- Row-count / value mismatches between SQL Server and Redshift dimensions
- Questions about timeout / status overwrite / complex dim findings

## Prerequisites

- Atlassian MCP (`user-atlassian`) authenticated to `betfred.atlassian.net`
- **Workspace folder `Cursor/`** (this repo) — dimension artifacts live here, not in migration-data-test
- Paths (from `Cursor/` root):
  - `dimensions/{in_progress|done}/de_{jira}_{name}.md`
  - `fixes/dimensions/{in_progress|done}/de_{jira}_{name}/`
  - **`fixes/.../de_{jira}_{name}/triage_validation.md`** (mandatory on ground work)
  - `validation/reports/`
- Compare profiles: `../data-platform-migration-data-test/mappings/complex_dims/{name}.yaml`
- Glue jobs: `../data-platform-glue-etl-transactional-data-jobs/glue-jobs/.../uk_digital_dimension_*.py`
- **Git:** bare `git push` / commit → **only** `data-platform-glue-etl-transactional-data-jobs`; other repos only if the user names them
- Legacy SQL procedures: `../data-platform-legacy-enterprisedatawarehouseunity/Stored Procedures/XtrlTransform.usp_etl_table_transform_1_dimension_*.sql` (e.g. `...DepositLimitHistory.sql` for `deposit_limit_history`)

---

## Ground work (user phrase)

When the user says **ground work** / **groundwork** for a Jira ticket, run the
full triage workflow **plus** a live validation pass and write
`triage_validation.md`. Do not stop at narrative-only triage.

```
Ground work:
- [ ] 1–5 from Dimension triage (Picture, layman pipes, E2E, classify, verdict)
- [ ] 6. Scaffold fixes/.../ (notes, **delivery_checklist.md**, triage_validation.md)
        — keep checklist current every completed step (rule
        `dimension-delivery-order` § Delivery checklist)
- [ ] 7. Live data: prod (±DEV) totals + pick a real window
- [ ] 8. compare.py — declare pair (usually test SQL → prod RS for close gate;
        DEV OK for dry-run). VPN for SQL; SSO for AWS.
- [ ] 9. Field-by-field write-up in triage_validation.md (match %, vocab,
        ID spaces, date skew vs collision, excludes)
- [ ] 10. Update dimensions/de_*.md live evidence + close criteria from facts
- [ ] 11. **Follow every Jira comment/description link** (API URLs, Bitbucket,
        docs, attachments, mapping xlsx) — inventory + outcomes in
        triage_validation.md
- [ ] 11b. **Related / closed tickets audit** — for every Done/Closed linked
        issue (e.g. parent dim stand-up): why closed? which columns were named?
        verify live; do **not** inherit “leave stub/hardcoded” without a
        closed-claim audit table (rule `jira-related-ticket-verify`)
- [ ] 11c. **Missing API column ladder** (if DWH col absent on report feed):
        mapping exhaust → ask why → ask vendor/API owner → Option B only if no
        (rule `api-missing-column-ask-vendor-first`)
- [ ] 12. Keep **triage_validation.md + full `.html`** as one-stop (DE-9549
        depth — TOC, Mermaid/ASCII, Alice/Bob, boards; **no stub HTML**);
        scaffold `validation/reports/de_{jira}_{name}/` as secondary; if tip/explain:
        `de_{jira}_final_verdict.html`
- [ ] 13. If new workflow / how-to-load / historic backfill: **R&D then**
        `proposed_solution.html` — **THE PLAN** then **THEN EXECUTE**;
        **live AWS verify** (never “if missing”); **operator step-by-step** +
        **worked EXAMPLES throughout**; JDBC overrides EXAMPLE; full JSON;
        **per-hop job details block is mandatory**: SQL→S3, S3→Iceberg,
        Iceberg→Redshift, camera hop; include job/artefact name, role,
        and key runtime settings;
        **SQL partition strategy block is mandatory**: `partition_column`,
        `partition_column_type`, `num_partitions` (`1` mandatory baseline for HEAP),
        fan-out risk if omitted/mis-set, serial-vs-parallel decision,
        `fetch_size` expectation (CashBalance baseline `100000`),
        and NOLOCK usage context;
        MERGE vs UNION if gold write disputed. **One-off:** EXISTING Glue +
        NEW JSON (+ dim tip) + Jira checklist — no stricken “old SFN” text.
        **Reusable product:** DynamoDB work-queue + SFN. Betfred paste clean;
        **Jira paste must include**: jobs/artefacts per hop, NEW JSON name +
        sibling clone, research-done bullets, still-to-do list, open decisions
        (so a reader sees what was researched vs what remains);
        Task DA / L5 before Jira paste. Rule `dimension-proposed-solution`.
```

**`triage_validation.md` must include:** compare pair, window, row counts,
SQL-only / RS-only / intersection, per-field match table, sample mismatches,
layman verdict, what blocks Done, reproduce commands,
**Jira links followed** table, **Related tickets — closed-claim audit** (when
any linked issue is Done/Closed), **API access** details when comments
paste an API, and — when a DWH column is missing on an API feed — a
**Missing-column ladder** (mapping exhaust → ask vendor → Option B only if no).
Reference: `fixes/dimensions/in_progress/de_9549_casino_pending_bonus/triage_validation.md`.

**One-stop rule:** `triage_validation.md` **and** `triage_validation.html` (same
folder) are the **primary** place for everything about the ticket (findings,
links, mapping-doc proof, vendor ask, Option A/B, live counts). Keep them in
sync. The pack under `validation/reports/de_{jira}_{name}/` is **secondary**
(final_verdict teaching / Athena tip diagrams) — do not scatter the only copy
of a decision only into reports or chat.

### Full HTML detail — DE-9549 bar (HARD RULE)

`triage_validation.html` must be a **full multi-section** page (TOC, verdict,
layman pipes, Alice/Bob, tables inventory, Mermaid + ASCII, live counts,
findings/options board, closed-claim audit, links followed, blocks Done) —
same depth as
`fixes/dimensions/in_progress/de_9549_casino_pending_bonus/triage_validation.html`.

**Fail ground work** if HTML is a stub / one-pager (lesson: DE-9654 first
draft). Rules: `dimension-docs-plain-diagrams` §6,
`dimension-validation-reports` § triage HTML.

**Report pack (same ticket, all dims):** also scaffold
`validation/reports/de_{jira}_{name}/`. When ground work includes Athena tip
proof or the user asks to “explain / final verdict”, write
`de_{jira}_final_verdict.html` there (tables inventory + Mermaid/ASCII + IN/OUT
+ live examples). Rule: `dimension-validation-reports`. Reference:
`validation/reports/de_9549_casino_pending_bonus/de_9549_final_verdict.html`.

---

## Missing column on API / report feed (HARD RULE)

When gold hardcodes or omits a DWH measure and the source is **IMS / API /
webservice** (e.g. AmountGBP on casino_pending_bonus):

1. **Analyse first** — legacy tables/proc, mapping workbook (all sheets;
   unhide rows), Jira links/attachments, Iceberg column lists, closed-ticket
   audit. Write evidence in triage_validation.
2. **Ask why** the column is not on the API in the first place.
3. **Ask the API owner / vendor first** (Playtech via product owner): add the
   field, point to another feed (e.g. IMS Currency), or confirm N/A.
4. **Option B** (platform approx, e.g. **sgp_currency** +
   **sgp_currency_exchange_rate**) only **after** mapping proves absence and
   vendor will not supply the field — and document parity risk vs legacy.

Rule: `api-missing-column-ask-vendor-first`. Do not lead the verdict with
Option B.

## Jira comment links & APIs (HARD RULE)

When a Jira ticket (or the user paste) contains **URLs, API endpoints, Bitbucket
paths, SharePoint docs, or attachment names** in comments/description:

1. **Inventory every link** into `triage_validation.md` (or the triage doc if
   validation not yet started) as a table: Link | Where | What we did | Result.
2. **Follow them** — do not only quote the comment. For each:
   - HTTP(S) API / report URL → resolve how the platform calls it (DynamoDB
     `*APIConfiguration*`, lambda TF, webservice-config, EventBridge, S3
     landing freshness). Record endpoint, reportId/body shape (**redact
     secrets**), schedule, last successful land.
   - Bitbucket → open if VPN allows; else note auth block and use the live
     AWS/config equivalent.
   - PDFs / .msg / xlsx attachments → list filename + id; summarise if
     readable; if not OCR'd, say so and who must review (e.g. Ravi).
   - Mapping workbooks → search every sheet for the missing DWH column
     (unhide rows); cite sheet + row when found or “not present”.
3. **Fail ground work / triage** if an API URL was pasted in comments and the
   validation doc has no "links followed" + "API access" section.
4. Never commit API keys, tokens, or raw secret values into Cursor docs.

This rule exists because DE-9549's CDC-vs-API diagnosis and prod API URL lived
in comments (`reportviewer/.../export`) — skipping links missed the real source
pipe.

## Related / closed Jira tickets (HARD RULE)

When triage cites a **Done / Closed** ticket (linked, “see DE-XXXX”, parent
stand-up, “accepted under DE-XXXX”):

1. **Fetch** that issue (description + all comments) via Atlassian MCP.
2. **Question closure:** What was Done for? (table exists / API daily /
   full field parity / explicit leave-column-zero?). Write 2–4 bullets.
3. **Closed-claim audit table** in `triage_validation.md`:

   | Claim we inherited | Exact quote / who | Column(s) named | Live check | Keep / supersede |

4. **Verify live** before “accepted stub” or `exclude_from_comparison`:
   Glue tip, Iceberg, Redshift, test SQL as needed.
5. **Column precision:** never expand “hardcoded / always zero / stub” from
   one measure to another without a quote naming that column.
6. **Supersede** closed comments that conflict with live evidence (same as
   Mark BonusBK=`a.code` vs Excel `template_code`).

**Fail ground work** if we defer a customer-wrong measure to a Done ticket
with no audit table, or we mis-attribute which column was stubbed.

Rule: `jira-related-ticket-verify`. Lesson: DE-9549 / DE-7392 AmountGBP vs
BonusWagering.

---

## Workflow

Copy and track:

```
Dimension triage:
- [ ] 1. Read Jira ticket (description + comments — source/API clues)
- [ ] 1b. Related Done/Closed tickets — closed-claim audit + live verify
        (rule `jira-related-ticket-verify`)
- [ ] 2. Check for duplicates
- [ ] 3. Update dimensions/de_{jira}_{name}.md
        - [ ] 3a. Picture for anyone (metaphor + good/wrong + one sentence)
        - [ ] 3a2. Explain like a layman — source pipes + named examples +
              symptom→fix-in-Glue? cheat sheet (MANDATORY)
        - [ ] 3b. End-to-end flow: tables + joins + issue markers + ASCII + issue map
              (tag source-pipe gaps on the diagram, not only JOIN bugs)
        - [ ] 3b-extra. Live schema: SQL + RS (DEV±prod) + related dims + proc + Glue + YAML — verdict, no guesses
        - [ ] 3c. Finding walkthroughs + Verdict (Glue vs source vs ops)
- [ ] 4. Classify issue type (incl. source-system-gap / ingest-api-health)
- [ ] 5. Recommend next step
- [ ] 6. If ground work / validation asked: triage_validation.md + compare
```

**Gate:** Do not mark triage done if 3a2 or 3b is missing, or if 3b only shows Source/Glue/Gold blobs with no named tables / source pipes.
**Ground-work gate:** also require `triage_validation.md` with live numbers (or explicit BLOCKED + reason, e.g. VPN).

### 1. Read a Jira ticket for a dimension

1. Fetch the issue via Atlassian MCP (`getJiraIssue` or JQL search).
2. Extract:
   - Dimension name (from summary / description / Glue job name)
   - Legacy SQL procedure vs Glue job
   - Severity table / findings
   - Acceptance criteria or open questions
   - **Comments** — especially source/API/CDC explanations, ops “API down”,
     API version switches, Playtech/vendor docs (these often beat the findings table)
3. Normalize the dim name: lowercase, underscores (e.g. `Timeout` → `time_out`,
   `DepositLimitHistory` → `deposit_limit_history`).
4. **Doc path (mandatory):** `dimensions/{status}/de_{jira}_{dim_name}.md`
   - `{status}` = `in_progress` or `done` only
   - Jira key lowercased, hyphen → underscore: `DE-9556` → `de_9556`
   - Examples:
     - `dimensions/done/de_9556_deposit_limit_history.md`
     - `dimensions/in_progress/de_9549_casino_pending_bonus.md`
   - **Fixes folder:** `fixes/dimensions/{status}/de_{jira}_{dim_name}/` (same status + prefix)
   - **Validation reports:** `validation/reports/de_{jira}_{dim_name}_*`
5. If the ticket is vague, stop after step 5 with **needs more info** — do not invent findings.

### 2. Check for duplicates

Before writing new findings, search for existing coverage:

| Place | What to look for |
|---|---|
| `dimensions/*.md` | Same dimension / same root cause |
| `mappings/complex_dims/*.yaml` | Existing comparison profile |
| Jira (JQL) | Same dimension name, same Glue job, linked parents |
| `docs/findings/` | Prior migration write-ups |

If a duplicate exists:

- Link the older ticket / doc in `dimensions/de_{jira}_{name}.md`
- Do **not** create a second conflicting source of truth
- Prefer updating the existing doc over starting a new narrative

### 3. Update `dimensions/{status}/de_{jira}_{name}.md`

Create or edit `dimensions/{status}/de_{jira}_{name}.md` as the source of
truth (e.g. `dimensions/in_progress/de_9549_casino_pending_bonus.md`).
Never create the real triage content as a flat `dimensions/de_*.md` or bare
`dimensions/{name}.md` — status folder + ticket prefix are required. A flat
stub that only links to the status file is OK for discoverability.

**Mandatory shape going forward** (reference: `dimensions/in_progress/de_9549_casino_pending_bonus.md`):

```markdown
# DE-XXXX — `{name}`

## Picture for anyone (start here)   ← MANDATORY
(metaphor + good vs wrong + one sentence + simple mermaid)

## Explain like a layman   ← MANDATORY
(source-pipe table + Alice/Bob named examples + symptom cheat sheet)

## End-to-end flow (platform)   ← MANDATORY — NO COMPROMISE
(tables + joins + source-pipe gaps tagged + ASCII + issue map)

## Finding walkthroughs / Verdict — can we resolve?
(Glue? / source? / ops? — pick now?)
```

### 3a2. Explain like a layman (mandatory — see rule `dimension-docs-plain-diagrams`)

Every triage doc must teach the mismatch the way you would to a non-engineer.

**Required contents:**

1. **Two pipes table** — Legacy SQL fill path vs AWS fill path  
   (CDC / DMS / API report / S3 / Iceberg / …). Say what each pipe **includes**
   and **excludes** in plain words.
2. **Named examples** (≥2) — e.g. Alice (both sides), Bob (SQL-only), Carol
   (both sides but a column wrong). Show a tiny “has them? Yes/No” table per person.
3. **Symptom cheat sheet** — “SQL has more rows” → usually source gap → Glue? No.
4. **Pipe diagram** — ASCII and/or mermaid of the two fridges when they differ.

**Reference teaching pattern (DE-9549):**

| Metaphor | SQL | AWS |
|---|---|---|
| Shop vouchers | Full back office (CDC) | Till receipt printer (Playtech report API) |

| Person | Story | SQL | AWS |
|---|---|---|---|
| Alice | Issued → accepted → redeemed | Yes | Yes |
| Bob | Waiting approval / on shelf / auto-cleanup | Yes | No — never on report |
| Carol | Actioned, but money column | Yes (£10) | Yes but GBP=0 (hardcoded) |

**Comments dig (mandatory):** Read Jira **comments**, not only the findings table.
Authors often explain source/API gaps there (CDC vs report, API down, API switch).
Put a short timeline in the doc when comments change the diagnosis.
**Also follow every URL/attachment** per § Jira comment links & APIs — paste of an
API endpoint in comments is an instruction to verify platform access and document it.

**Fail triage if:** you only list Critical/Medium SQL findings and never say
whether the row-count gap is a **Glue join bug** or a **different source pipe**.

### 3b-extra. Schema / code evidence (mandatory — no asking the user to guess)

Before any open question like “does gold have column X?” or “LEFT vs INNER?”,
**you** must check and write the evidence into `dimensions/de_{jira}_{name}.md`:

| Check | How |
|---|---|
| SQL Server gold/dim columns | `INFORMATION_SCHEMA` on test Unity/Mart for the legacy table |
| Redshift gold columns | Data API / compare — **DEV and prod** if both matter. Use **`REDSHIFT_USER` from `.env`** (e.g. `powerbi_user`) — **not** bare IAM SSO admin, which often lacks `dimension` schema grants and returns empty `information_schema` / permission denied |
| Related Redshift dims | e.g. `dimension.player` identity columns (`player_bk`, `sgp_player_id`, …) |
| Legacy proc INSERT/SELECT list | Unity proc file or `sys.sql_modules` |
| Glue tip SELECT / JOIN list | Tip `.py` |
| Compare YAML mapping | What is compared vs omitted |
| TF `--primary_keys` | Matching `.tf` |

Then **finalise the verdict** in the doc (fix / document / Liquibase-first).  
**Do not** leave “Needs Redshift column confirm?” or ask the user to choose
skip-vs-Liquibase when a live describe answers it.

If Liquibase is required, say so with the **checked** missing column list —
still ask before applying Liquibase/prod DDL.

### End-to-end flow — non-negotiable checklist

On every triage, the E2E section **must** include all of:

| # | Required | Fail if missing |
|---|---|---|
| 1 | **Tables used** table (name, system, what’s in it, role in plain words) | Fail |
| 2 | **Mermaid** with one subgraph/node per table and per join; join keys labelled | Fail |
| 3 | **Issue markers** on the broken step (`✗ C2`, `✗ M1`, …) **and** on source-pipe gaps when the mismatch is upstream of Glue | Fail |
| 4 | **ASCII twin** of the same flow | Fail |
| 5 | **Issue map** Finding → where on picture → plain meaning → status | Fail |
| 6 | Legacy vs Glue / SQL-pipe vs AWS-pipe side flow when compare semantics differ | Strongly preferred |

Read the Glue tip (and legacy proc if needed) so join keys and INNER/LEFT are
**accurate**, not guessed. Tag every open Critical/Medium onto the picture.
Also tag “Bob never arrives” style gaps on the **ingest/API** node when comments
or evidence say so.

Reference implementations:
- Layman + source pipes: `dimensions/in_progress/de_9549_casino_pending_bonus.md`
- Join-heavy E2E: `dimensions/in_progress/de_9567_session_history.md` (if present)

### Picture for anyone — rules (see also rule `dimension-docs-plain-diagrams`)

A non-engineer should understand the ticket in **~30 seconds** from this section alone:

| Required | Example |
|---|---|
| ASCII picture of one business unit | login → logout = one session |
| Good vs wrong (ASCII or tiny table) | wrong MAX logout vs next logout |
| One plain sentence | “Glue each login to the right logout…” |
| Simple mermaid | nodes like “Player logs in”, not `bvt_action` |

**Do not** open a new `dimensions/de_{jira}_{name}.md` with only a severity table and no picture.
If an old doc (e.g. `deposit_limit_history.md`) lacks Picture / E2E join map, add
both the next time you touch that dim.

Also keep a compact findings table if useful, but **do not stop at the table** —
walk each Critical and Medium so the user can review without reading Glue/SQL.

End every triage `dimensions/de_{jira}_{name}.md` with a **## Verdict — can we resolve?**
section:

```markdown
## Verdict — can we resolve?

| Finding | Resolvable in Glue? | Blocked by / dependency | Pick now? |
|---|---|---|---|
| C1 … | Yes / No / Document-only | e.g. source missing in Iceberg | Yes / Later / Skip |
…

**Overall:** which findings are unblocked for this ticket vs defer / pick another dim.
```

If a finding depends on a missing Iceberg/source table, mark **No / blocked** and
tell the user they can still pick the other findings (or another ticket).

### Closing `source-system-gap` tickets (no Glue fix)

When primary class is **`source-system-gap`** (different pipes — DE-9549 pattern):

1. Write the **compare contract** into the triage doc (intersection gate,
   excludes for stubs, Alice/Bob/Carol justification).
2. Point validation at skill `dimension-validate` §5c — still use `compare.py`.
3. Close gate = **test SQL → prod Redshift** BK intersection attributes PASS
   + population gap accepted in Jira — **not** SQL count == RS count.
4. Triage doc must include § “How to validate & close” before calling the
   ticket Done-ready.

Update rules:

- Plain English first; diagrams second; code citations only when proving a tip check
- Record source tables, SQL Server test + Redshift gold targets
- Record known issues with issue-type label (see below)
- Record validation window and acceptable match rate when known
- Give **suggestions** per finding (fix / document / strike / validate next)
- Scaffold `fixes/{name}/README.md` at triage time (proposal only — no Glue edit yet)
- Use placeholder `BED-XXX` / `DE-XXXX` only if the real key is unknown; replace when known

### 4. Classify issue type

Pick **one primary** type (add secondary only if clearly distinct):

| Type | Meaning | Typical signal |
|---|---|---|
| `status-overwrite` | Player/entity current status changes (e.g. Timeout → Self Exclude); history no longer qualifies for this dim the same way | Row-count gap after status change; job filters on current reason |
| `join-logic` | Wrong join / INNER vs LEFT / key derived from nullable outer join | Silent row loss; totals low; counts drop without errors |
| `source-system-gap` | Legacy SQL and AWS are fed by **different pipes** (e.g. CDC full DB vs API report) so populations differ by design | Comments say CDC vs report/API; SQL has states AWS never receives |
| `ingest-api-health` | Report/API/job not running, or **API version switch** changed fields/coverage | Ops comments “API not in prod”; sudden gap after cutover |
| `swiss-layer` | Intermediate silver/swiss table shape or naming differs from expected source | Table rename, grain change, missing history rows upstream |
| `watermark-drift` | Incremental watermark / lookback buffer differs from legacy | Late-arriving rows missing on one side |
| `is-current-expiry` | `is_current` not flipped for expired rows (especially outside incremental batch) | Stale `Y` after `disable_until` passed |
| `key-strategy` | Surrogate vs business key mismatch; hard to pair rows in comparison | High “unmatched” with similar totals |
| `timing-skew` | Systems compared at different moments while live data moves | Gaps shrink/grow between runs; not reproducible |
| `hardcoded-measure` | Job deliberately stubs a measure (e.g. `amount_gbp = 0`) | Every row zero — **but** only treat as “accepted leave-as-is” after closed-claim audit on the linked Done ticket names **this exact column**; verify live (DE-7392 named BonusWagering, not AmountGBP) |
| `accepted-noise` | Explained difference; not a bug | Documented ≤ gap under match-rate threshold |
| `legacy-history-wipe` | SQL proc DELETE+reinsert for entities in batch — SQL is **not** a full-history baseline; Glue UPSERT will have **more** rows | Glue ≫ SQL counts; must not FAIL validate on that alone (DE-9567 C1) |
| `unknown` | Cannot classify yet | Conflicting evidence |

State the classification explicitly, e.g. `Primary: source-system-gap`.

### 5. Recommend next step: fix or needs more info

Choose **exactly one**:

**A. Fix** — when root cause is clear and actionable:

- Name the file/job to change
- Name the concrete change (e.g. “expiry re-check must scan whole target table”)
- Point at acceptance (e.g. April window ≥ 90% match)

**B. Needs more info** — when blocked:

- List the missing evidence (sample keys, window, which side is authoritative)
- List the smallest query / comparison to run next
- Do not propose a code fix yet

Output a short triage summary **and** point the user at the enriched
`dimensions/de_{jira}_{name}.md` walkthrough:

```markdown
## Triage summary
- Dimension: …
- Ticket: …
- Duplicate of: none | …
- Classification: …
- Next step: fix | needs more info
- Action: …
- Doc: dimensions/de_{jira}_{name}.md (**Picture for anyone** + plain English + diagrams per finding)
```

---

## Defaults for `time_out`

If triaging timeout / `time_out` and the doc is thin, prefer these known defaults unless the ticket contradicts them:

- Sources: `sgp_player`, `sgp_player_disable_reason`, `silver_player_disabled_history`
- Destinations: SQL Server `Dimension.Timeout` (test) + Redshift `uk_digital.dimension.timeout` (gold)
- Common class: `status-overwrite` (Timeout → Self Exclude)
- Validation window: one month (April)
- Acceptable match rate: ≥ 90%

---

## Standup update

When the user asks for a **standup update** on a dimension ticket (e.g. DE-9556):

Keep it spoken-length (~30–45 seconds). Prefer this shape:

1. **Ticket + % done** — e.g. “DE-9556 Deposit Limit History — ~60%”
2. **Finding counts** — “3 Critical, 2 Medium” (from Jira / `dimensions/de_{jira}_{name}.md`)
3. **What you fixed / found** — one short beat per item, plain English:
   - name the bug (`is_first_dl`, INNER→LEFT player enrich, …)
   - say what you discovered if it was a surprise (e.g. CustomerID — I thought
     it wasn’t on the job at all; found it already comes from player dim as
     `customer_id_legacy`, so we wire that through on the LEFT join)
4. **Today / tomorrow** — finish DEV today; prod tomorrow (or whatever is true)

Do **not** dump commit hashes, PR markdown, or full validation tables in standup.
Do **not** mention Cursor paths (`fixes/…`, `dimensions/…`), “Cursor”, or
local draft locations — Betfred-facing only (see rule
`betfred-facing-no-cursor-leak`). Say “PR description draft ready” if needed.
Do **not** use Alice/Bob/Carol or “shelf-only” in standup/Jira — spell out
CDC vs API (or the real pipes) so the ticket stands alone.

**Teams / Slack / meeting asks:** short paste; emphasise names with **bold** —
never backticks (no grey code chips). Same for Playtech questions.

Example (DE-9556 style):

> DE-9556 Deposit Limit History — about 60%. Ticket had 3 Critical and 2 Medium.
> Fixed `is_first_dl` so it only ranks valid rows, and switched player enrich from
> INNER to LEFT join with -1 sentinel so we don’t drop safer-gambling events.
> On CustomerID I thought it was missing entirely — turns out it already comes
> through as `customer_id_legacy` from the player dimension, so we pull that on
> the LEFT join. Also fixed UK-local `is_current` and cleaned dead Iceberg refs.
> Finishing DEV today (PR, deploy, reload, validate); aiming prod tomorrow.

---

## Anti-patterns

- **Do not** skip Jira comment URLs / API endpoints / Bitbucket links — inventory and follow them (DE-9549 reportviewer lesson)

- **Do not** call ground work done without `fixes/.../triage_validation.md` (live counts + field table) — narrative triage alone is not enough

- Do not treat every row-count mismatch as a Glue bug — **classify the source pipe first**
- Do not aim for 100% match when `source-system-gap`, status-overwrite, or timing-skew is in play
- Do not edit Glue/SQL until classification and next step are stated
- Do not create a second `dimensions/*.md` for the same dimension
- **Do not** ship a triage doc without **Picture for anyone**
- **Do not** ship triage without **Explain like a layman** (named examples + pipes + cheat sheet)
- **Do not** ship E2E flow without **named tables, labelled joins, and issue markers** (no compromise)
- **Do not** put Alice/Bob/Carol / “shelf-only” in **Jira** comments — private
  triage teaching only; translate to plain source-pipe language
  (`betfred-facing-no-cursor-leak`)
- **Do not** skip Jira **comments** when diagnosing mismatches (API/CDC clues live there)
- **Do not** ask the user to guess schema (column exists? Liquibase?) — **check** SQL + Redshift (+ related dims) and finalise the verdict in the doc
- **Do not DROP / CREATE / ALTER gold Redshift dimension tables from Glue `.py` files** — manual DBA / Liquibase only; reference DDL under `fixes/{name}/`
