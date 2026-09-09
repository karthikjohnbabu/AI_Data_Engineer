# Proposed solution HTML (new workflow / load path)

## When required (HARD RULE)

Create **`proposed_solution.html`** when a ticket needs a new workflow, historic
backfill, or “how do we load this?”.

**Path:** `fixes/dimensions/{status}/de_{jira}_{name}/proposed_solution.html`  
Link from triage; tick checklist. Run devil’s-advocate **Task DA / L5** before
Jira paste (skill `dimension-devils-advocate-unit-test`).

## Audience

Layman can state the plan, name EXISTING vs NEW jobs, and know their only
ongoing role is **FAIL / SNS**. Senior-DE bar: live AWS + sibling jobs proved.

## Structure — Plan then Execute

| Box | Content |
|---|---|
| **THE PLAN** | Chain, control plane, success |
| **THEN WE EXECUTE** | Terraform → DEV one-segment proof → full queue → gold/camera |

## AWS resource claims (HARD RULE)

**Never** write “NEW if missing” / “if not there”.

Before naming a DynamoDB table, Glue job, or SFN:

1. `aws dynamodb list-tables` / `describe-table` (prod + DEV)  
2. Or cite TF that already creates it  

Then state one of:

- **NEW — confirmed absent** (date, account, what *does* exist)  
- **EXISTS — verified** (exact name)  

### Control-plane split (HARD — verify each table, do not lump)

**Listing a table ≠ knowing what it does.** For every `*JobControl*` /
control DynamoDB named in the HTML:

1. `describe-table` (keys, GSI)  
2. Sample items (job_name / component / status)  
3. Grep TF `--control_table` / `JobStatusHandler` writers  

Verified roles (prod **2026-09-08** — re-check if stale):

| Table | Writer / consumer | Purpose | Month work-queue? |
|---|---|---|---|
| `{env}-ETLJobControl` | Dims, builders, SFTP, cleanup (`JobStatusHandler`) | BAU **watermarks** (last SUCCESS / audit_sequence_time) | **NO** |
| `{env}-DataProcessingJobControl` | **`transactional_data_quality_mapping`** (etl-common TF) | CDC / mapping **watermarks** per source table (e.g. `petfre_franchisedb.playersaccounts`) | **NO** |
| `{env}-SftpJobControl` | SFTP jobs | SFTP feed watermarks | **NO** |
| `{env}-ETLHistoricBackfillControl` | Proposed SFN seed/claim | Segment PENDING→DONE queue | **YES** — **confirmed absent** → **NEW Terraform** |

Same key schema on ETLJC vs DPJC does **not** mean interchangeable. Neither
is a PENDING-segment claim queue. `proposed_solution.html` **must** state
writer + purpose for each existing table (not “JobControl = watermarks” only).

Anti-pattern: propose NEW without sampling DPJC/ETLJC; or claim DPJC can
drive sql-server-extraction months.

## Multi-window historic (HARD RULE)

Dozens of date windows → DynamoDB work-queue + SFN (concurrency bounded;
HEAP sources = 1). Human = FAILED/SNS + approvals.

**Forbidden as design:** spreadsheet / Excel as runner. Do not put those words
in Jira/Teams paste at all.

## Performance / chunk sizing (HARD RULE)

`proposed_solution.html` **must** answer before locking month vs week:

1. Live **total** + **per-chunk estimate** (avg and peak) from SQL  
2. Glue job capacity (worker_type, timeout, fetch_size, date partitions)  
3. Bottleneck named (usually HEAP/BAU, not Glue for ~1–3M rows)  
4. Verdict: e.g. **monthly OK** — or smaller grain with threshold  

DE-9654 reference (2026-09-08): pre-Jul **42.7M** / ~52 months ≈ **~0.8M/month**
avg; late months **~2.3–2.7M**; early **~0.1M**. Monthly extract is appropriate
for `sql-server-extraction` (G.2X×10, 48h timeout); SFN concurrency **1**.

Devil’s advocate L5 / Task DA must fail hand-waved “just run months” with no
numbers, and must patch the HTML when volumes are known.

### SQL Server extract partition strategy (HARD RULE)

When the source is SQL Server (especially HEAP / no NCI), `proposed_solution.html`
must include an explicit partition strategy block for `sql-server-extraction`:

1. `partition_column` and `partition_column_type` (usually `BalanceDate` / `date`)
2. `num_partitions` with a justified value (`1` is the mandatory baseline for HEAP historic)
3. Expected fan-out if mis-set (e.g. date range may explode into day-level scans)
4. Concurrency rule (serial only unless DBA approves parallelism)
5. `fetch_size` expectation and where it comes from (job default vs override; CashBalance baseline `100000`)
6. NOLOCK usage context for read-only historic pull

If this block is missing, or if the doc says “use defaults” without proving the
date-partition behaviour, fail Task DA / L5 and patch before Jira paste.

## Betfred-facing paste (HARD RULE)

Jira / Teams sections: **no** Cursor, `.cursor`, local paths, Place 1/2/3,
agent names, bare **cursor**. For arrange pagination say **S3 LastModified
pagination resume** (technical appendix may name Glue `--cursor_timestamp`).

Bold job/table names in Teams paste; no grey backticks.

### Jira paste must show research + work left (HARD RULE)

The main Jira / Teams paste in `proposed_solution*.html` is not only the
approach — it must make clear **what was researched** and **what still needs
building / deciding**. Required content:

1. **Jobs / artefacts per hop** — name the EXISTING Glue job (and NEW tip /
   NEW JSON) for SQL→S3, S3→Iceberg, Iceberg→Redshift, and camera when used.
2. **NEW mapping / config** — exact JSON name (e.g. `cash_balance_legacy.json`)
   and sibling pattern cloned from (e.g. `self_exclusion.json`).
3. **Research done** — short evidence bullets (live get-job / get-table /
   volumes / S3 path state), never “if missing”.
4. **Still to do** — build/ops list (ship JSON, tip dim, DEV proof year,
   camera, validate, prod).
5. **Open decisions** — named owners (e.g. Andrew: cutoff, JDBC, BAU, S1 vs S2).

Fail L5 / Task DA if the Jira paste only has problem + volumes + “open”
with no hop jobs / JSON / researched-vs-todo split.

## One-off vs platform product (HARD)

If the ticket is a **one-off** historic load (single dim, not a reusable
backfill product):

- Prefer **EXISTING** Glue (`sql-server-extraction`, `arrange-parquet`, dim) +
  **NEW mapping JSON** (+ small dim initial_load tip when gold needs it)
- Prefer **one extract** for the full pre-cutoff window when Glue timeout
  allows (CashBalance: 48h / ~42.7M) — **must** set `num_partitions=1` (or
  low) for date partitions so the job does not default to one JDBC partition
  per day on a HEAP. If splitting for BAU/resume: prefer **yearly** (~5)
  over monthly (~26); still `num_partitions=1` per year window
- **Not** Glue interactive / notebook / ad-hoc COPY for prod gold
- Progress = **ticket/Confluence checklist** (SQL→S3 / S3→Iceberg /
  Iceberg→Redshift + counts) — not a NEW historic control DynamoDB
- Serial by **operator** only when multiple windows are needed
- Still require: volumes, JDBC overrides EXAMPLE (incl. `num_partitions`),
  full JSON EXAMPLE, named Iceberg→Redshift path, BAU/HEAP note,
  **operator step-by-step**, **min test list**, **worked EXAMPLES**,
  **§ Quick test / pre-flight** (Glue/AWS/SQL checks the operator can run
  to prove EXISTING jobs/tables are there and a small extract is doable —
  with live-verified expect values, never “if missing”)
- **Do not** put stricken / “dropped SFN” history in `proposed_solution.html`
- **MERGE vs UNION:** date-gated MERGE; blind UNION only if keys disjoint

Do **not** force NEW SFN + work-queue DynamoDB on every historic ticket.
Use the full control-plane design when the team wants a **reusable** historic
product across many tables.

## Hop naming (HARD RULE — never invent letter codes)

Name hops by **data path**, not A→B / Extract / Arrange / Gold.

| Hop (plain) | Meaning |
|---|---|
| **SQL→S3** | Extract job → parquet on S3 |
| **S3→Iceberg** | arrange-parquet + mapping JSON → curated Iceberg |
| **Iceberg→Redshift** | Dim/builder MERGE (or agreed path) → gold |

For **reusable** historic products that use a work-queue DynamoDB, hop attrs
may be stored as `hop_sql_s3_*` / `hop_s3_iceberg_*` / `hop_iceberg_redshift_*`
(status, rows_in/out, run_id, at). For **one-off** tickets, the same hop
**names** appear on the Jira checklist — no DynamoDB item required.

**Forbidden in proposed_solution / triage / Jira / Teams / rules:** `A→B`, `B→C`, `C→D`,
`Hop 1/2/3`, `hop_ab_*`, `hop_extract_*`, `hop_arrange_*`, `hop_gold_*`, or vague
“Extract / Arrange / Gold seed” as the hop **identity** (job names like
`sql-server-extraction` / `arrange-parquet-processing` are fine when naming the Glue job).

## Content MUST

### Always (every historic proposed_solution)

- Glossary; EXISTING vs NEW (AWS-verified — never “if missing”)
- **Per-hop job details block** (mandatory) covering:
  - SQL→S3, S3→Iceberg, Iceberg→Redshift, and post-seed camera hop
  - Job/artefact name, what it does, and key runtime settings
  - At minimum for SQL Server loads: worker type/count, timeout,
    `partition_column`, `partition_column_type`, `num_partitions`,
    `fetch_size`, serial-vs-parallel rule, and NOLOCK context
- **Volumes + chunk verdict** (avg/peak; Glue fit; bottleneck named)
- **Operator step-by-step** (what YOU do vs ENG)
- **§ Quick test / pre-flight** — numbered Q-checks (Glue get-job, sibling
  legacy Iceberg, ETLJobControl purpose, SQL COUNT); copy/paste EXAMPLE;
  optional tiny DEV extract probe; live-verified EXPECT column
- **Worked EXAMPLES throughout** — at least: one proof extract window with
  overrides + expected row count; full JSON; gold MERGE tip; Jira checklist
  rows; MERGE-vs-UNION with a colliding-key EXAMPLE
- IN→OUT; diagrams ≥2; risks / edge cases; Jira + Teams paste
  (`betfred-facing-no-cursor-leak` — self-contained)
- **No** strikethrough “old design” sections; no SFN/DDB nostalgia

### Extra only when building a **reusable** historic product

- Work-queue DynamoDB: per-hop PASS + row counts; filled EXAMPLE item
- SFN: PENDING Limit=1 → claim → one Glue start (job defaults) → wait →
  hop_* → loop; concurrency 1 for HEAP; FAIL watch

## Anti-patterns (fail)

- “If missing”
- Spreadsheet-first (or spreadsheet in team paste)
- Claiming ETLJobControl **or DataProcessingJobControl** is the month queue
- Naming a JobControl table without describe + sample + writer
- **“Clone self_exclusion” with no full JSON EXAMPLE / field rationale**
- Letter/vague hop names (`A→B`, `hop_ab_*`, `hop_extract_*`, “Extract hop”)
- Bare “cursor” in Jira/Teams
- SQL→S3 EXAMPLE missing Mart/partition overrides when TF defaults differ
- Stub HTML / no operator steps / no worked EXAMPLES / no Quick test section
- Strikethrough “over-engineered” history left in the HTML
- Blind UNION as the gold write without a date gate + collision EXAMPLE
- Requiring DynamoDB/SFN EXAMPLES on a **one-off** ticket
- “NEW if missing” instead of live get-job / get-table / describe-table
- Jira paste with only problem/volumes/open and **no** hop jobs, NEW JSON,
  researched-vs-todo split

## Skills

`dimension-triage` item 13 · devil’s-advocate Task DA / L5 before paste ·
`betfred-facing-no-cursor-leak`

## Reference

DE-9654 `proposed_solution.html` (post L5 artefact audit fixes)
