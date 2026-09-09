# Dimension docs — plain diagrams + layman source analysis

Whenever you **triage** or update
`Cursor/dimensions/{status}/de_{jira}_{name}.md`
(e.g. `dimensions/in_progress/de_9549_casino_pending_bonus.md`):

## 1. `## Picture for anyone (start here)` (mandatory)

1. Everyday metaphor or ASCII cartoon of the business thing
2. Good vs wrong
3. One plain sentence
4. Simple mermaid with everyday words (not table jargon alone)

A non-engineer should get the ticket in **~30 seconds** from this section.

## 2. `## Explain like a layman` (mandatory on triage)

Must include **all** of:

| # | Required | Fail if missing |
|---|---|---|
| 1 | **Source-pipe comparison** — how legacy SQL is filled vs how AWS/Iceberg is filled (CDC, DMS, API report, parquet, etc.) | Fail |
| 2 | **At least two named examples** (Alice / Bob style) showing who appears where and why | Fail |
| 3 | **Cheat sheet:** symptom → usually means → fix in Glue? Yes/No | Fail |
| 4 | Diagram of the two pipes (ASCII and/or mermaid) when pipes differ | Fail |

### Why this exists

Row-count gaps are often **two different fridges**, not a broken Glue JOIN.
If triage only lists Critical/Medium SQL findings and never explains the
**source pipe**, the next reader will “fix” the wrong layer.

### Reference shape (casino_pending_bonus / DE-9549)

- SQL = full Casino DB via CDC (back office)
- AWS = Playtech report API (till receipts only)
- Alice = both sides; Bob = SQL-only shelf state; Carol = both sides but GBP=0

Reuse that teaching pattern (named people + metaphor) for every complex dim.

## 3. `## End-to-end flow (platform)` (mandatory — no compromise)

Must be **pictorially clear**. Vague “source → Glue → gold” alone is a **failed triage**.

### Required contents

1. **Tables used** — every Iceberg / Redshift / DynamoDB / SQL Server object,
   what lives in it, role in plain words.
2. **Mermaid** — one node per table and per join; label join keys; tag
   `✗ C2` / `✗ M1` on the broken step; also tag **source-pipe** gaps when
   the mismatch is upstream of Glue.
3. **ASCII twin** of the same flow.
4. **Issue map** — Finding | Where on picture | Plain meaning | Status.
5. Optional but preferred: Legacy vs Glue side flow when compare semantics differ.

### Do not

- Draw only three blobs (Source / Glue / Gold) with no table names
- Hide the broken join **or** the source-pipe gap in prose only — both must
  appear **on** the diagram
- Skip ASCII when mermaid is used
- Ship triage without Picture + Explain like a layman + E2E

## 4. Schema evidence before open questions

If a finding is about a missing attribute / join / key:

1. Describe **SQL Server** target columns
2. Describe **Redshift** gold (DEV; prod when validating prod)
3. Peek **related** Redshift dims
4. Read legacy INSERT list and Glue SELECT
5. Read compare YAML omissions
6. Write the **final verdict** (fix / document / Liquibase / **not Glue — source**)

Never leave “confirm DDL?” for the user when you can run the describe.

Skill: `dimension-triage`.

## 5. Validate & close when pipes differ (`source-system-gap`)

If triage says SQL and AWS drink from **different taps**, the triage doc must
also spell out how to **close** the ticket:

1. Compare contract — BK **intersection** attributes, not full-table counts
2. `exclude_from_comparison` for accepted stubs (hardcoded GBP, etc.)
3. Close gate pair = **test SQL → prod Redshift** (DEV optional dry-run)
4. Jira Done comment with intersection % + SQL-only keys justified in
   **plain pipe language** (no Alice/Bob nicknames — rule
   `betfred-facing-no-cursor-leak`) + stubs

Do not leave “needs validation” without naming the gate. See DE-9549
§ “How to validate & close” and skill `dimension-validate` §5c.

## 6. Ground work → `triage_validation.md` (+ `.html`) — one-stop

When the user says **ground work** / **groundwork** for a Jira ticket (skill
`dimension-triage`):

1. Do Picture + Explain like a layman + E2E as above
2. Create/update `fixes/dimensions/{status}/de_{jira}_{name}/triage_validation.md`
   **and** matching **`triage_validation.html`** — these are the **primary**
   ticket home (findings, links, mapping proof, vendor ask, Option A/B, live
   counts). Keep MD and HTML in sync.
3. Run live compare (declare pair; usually test SQL → prod RS) and document
   **row counts + field-by-field** match rates, vocab clashes, ID spaces
4. Point the narrative `dimensions/de_*.md` live evidence at that file
5. Report pack under `validation/reports/` is **secondary** (teaching /
   final_verdict) — do not leave decisions only there or only in chat

Do not finish ground work with only a narrative `.md` and no validation file.

### `triage_validation.html` — full DE-9549 detail (HARD RULE)

**Every** ground-work / triage ticket gets a **full multi-section** HTML
one-stop — same depth as
`fixes/dimensions/in_progress/de_9549_casino_pending_bonus/triage_validation.html`.

**Forbidden:** stub / one-pager HTML (verdict + one table only). That failed
DE-9654 first pass — do not repeat.

**Required in HTML (all tickets, adapt section titles to ticket type):**

1. Shared CSS shell + Mermaid CDN (copy DE-9549 head styles)
2. **TOC** with in-page anchors (Jump list)
3. **Verdict banner** (one screen)
4. **Picture for anyone** + good vs wrong
5. **Explain like a layman** — source-pipe table, Alice/Bob/Carol, cheat sheet
6. **End-to-end** — numbered tables inventory, Mermaid **and** ASCII, issue map
7. **Live counts / examples** — compare pair declared; real numbers
8. **Ship vs leave** / options board (or Critical/Medium board when findings)
9. **Related Done tickets** — closed-claim audit (when any linked Done exists)
10. **Jira links followed** table
11. **What blocks Done** / how to close + next
12. Reproduce SQL / Teams paste when useful

Keep `triage_validation.md` content-complete too — HTML is not a summary of a
richer MD; they stay twins. Fail ground work if HTML is stub-only.

Reference: DE-9549 `triage_validation.html`. Historic-backfill example after
expansion: DE-9654 `triage_validation.html`.

When the ticket needs a **new workflow or load arrangement**, also write
`proposed_solution.html` after R&D (rule `dimension-proposed-solution`) —
**Plan→Execute**, **live AWS verify** (never “if missing”), DynamoDB
work-queue + SFN for multi-window, **L5 artefact audit** before Jira paste. Do not
stop at triage evidence alone.


## 7. Jira comment links / APIs

Ground work `triage_validation.md` must include a **Jira links followed**
table whenever comments paste URLs or API endpoints. See rule
`jira-comment-links-follow` and skill `dimension-triage`.

## 7b. Related / closed Jira tickets

If the ticket inherits “Done” behaviour from another key (parent stand-up,
“leave hardcoded”, linked DE): **question why that ticket closed**, map
claims to **exact columns**, verify live, and write a **closed-claim audit**
in `triage_validation.md`. **Done ≠ still correct.** Rule:
`jira-related-ticket-verify`. Lesson: DE-7392 BonusWagering vs AmountGBP.

## 7c. Missing column on API feed — ask vendor before Option B

If a DWH column is missing on an IMS/API report path (e.g. AmountGBP):

1. Exhaust mapping workbook + Jira links + schema (prove not found)
2. Ask **why** it is not on the API
3. Ask the **vendor / API owner first** (add field / alternate feed / N/A)
4. **Option B** (e.g. SGP FX) only if they say no — document as approximation

Rule: `api-missing-column-ask-vendor-first`. Put the ladder in triage_validation
(not only chat).

## 8. Validation report pack + `final_verdict.html` (secondary)

Every `DE-*` dim/fact may use the **DE-9549 report pack** under
`validation/reports/de_{jira}_{name}/` — **supporting** teaching / tip proof.
**Primary** decisions and evidence stay in `triage_validation.md` / `.html`.

When the user asks for a **final verdict**, Athena tip walkthrough, “explain
the issue properly”, or close readiness:

1. Write/refresh **`de_{jira}_final_verdict.html`** with TOC, layman picture,
   IN/OUT, **tables inventory**, Mermaid + ASCII E2E (findings tagged on the
   diagram), Alice/Bob examples, live keys, tip SQL, decision board.
2. Keep supporting HTML/MD (business justification, how-to-close, field map)
   in the **same** folder.
3. Mirror any new verdict into triage_validation one-stop docs.

Full checklist: rule `dimension-validation-reports`.  
Reference: `validation/reports/de_9549_casino_pending_bonus/de_9549_final_verdict.html`.
