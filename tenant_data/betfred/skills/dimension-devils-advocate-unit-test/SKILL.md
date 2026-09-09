---
name: dimension-devils-advocate-unit-test
description: >-
  Unit-style gate for Glue dim/fact fixes: Jira proof, L0–L4, L5 artefact audit,
  validation with BK overlap and count-mismatch justification. Task DA +
  L5 artefact audit after every completed step; full DA before PR. Use when devil's
  advocate, unit test, bot-proof, PR-ready, or after any ticket task.
---

# Dimension / fact — devil’s advocate unit test (gate + continuous Task DA)

**Fits delivery order** (rule `dimension-delivery-order`):

1. **Place 1** — Athena Iceberg tip vs test SQL (before DEV OK)
2. **This skill** → then PR draft (`dimension-pr`)
3. Commit (user says the word)
4. Merge/push → DEV deploy → watermark/reload if needed
5. **Place 2** — test SQL → DEV RS (refresh this write-up + PR evidence)
6. Prod deploy → **Place 3** — test SQL → prod RS

Prefer Place 1 evidence before first Commit when Iceberg can express the tip.

## Two modes (both mandatory when their trigger fires)

| Mode | When | Depth |
|---|---|---|
| **Task DA** | **After every completed task** (same turn) | Alignment + **L5 artefact audit** (always) + checklist vs plan |
| **Full DA** | PR-ready / bot-proof / unit test / before Commit / after Place 2 refresh | L0–L4 + **L5 artefact audit** + validation results |

Goals (Full DA), in order:

1. **Jira** — every Critical/Medium finding FIXED (with proof) or scoped out.
2. **Business knowledge** — wider Betfred use-case / domain logic (not only the
   ticket) so safer-gambling, money, identity, sessions, etc. are not missed.
3. **L1 section M + L4 AI code review** — same agentic Glue↔TF pass as Jenkins
   `dp-ai-code-review` (see below). **Not optional** if tip or TF changed.
4. **L5 artefact audit** — senior-DE live AWS + sibling-job + Betfred-paste
   audit (**this skill**, section below). **Not optional.**
5. **Board list** — extra issues after Jira + AI review + L5, by severity.
6. **Validation** — compare / presence checks; **RED ALERT** on inverted
   emptiness (see below). Respect `legacy-history-wipe` (Glue ≫ SQL OK).
7. **Block PR / commit / deploy** until gates pass or Prasath accepts risk in writing.

**Do not** name this skill / Cursor paths in Betfred-facing PR or Jira text.
**Jira / standup:** never “Place 1/2/3” — use **DEV validation** /
**Post-deploy prod validation** with the full compare pair
(`betfred-facing-no-cursor-leak`). Never Alice/Bob/Carol or “shelf-only”
alone — spell out source pipes so the ticket stands alone.

---

## Task DA — after every completed task (HARD RULE)

Trigger examples: finished `triage_validation` HTML, `proposed_solution`,
Glue/TF edit, checklist step, Jira/Teams paste draft, delivery-order step.

Same turn, before telling the user “done”:

```
Task DA:
- [ ] 1. What just changed? (files / claim)
- [ ] 2. Still aligned with THE PLAN / delivery_checklist / delivery-order?
- [ ] 3. Run L5 artefact audit (this skill) on ticket HTML/MD — live AWS if
        resources named; **for each JobControl: describe + sample + writer**
        (DPJC ≠ ETLJC); Betfred paste leak; sibling jobs; no “if missing”
- [ ] 4. L5 PASS? If RED/HIGH/MEDIUM → fix artefacts **and patch
        proposed_solution.html / triage same turn**
- [ ] 5. Log one line on delivery_checklist Notes / Permission log
        (Task DA L5 PASS|FAIL · date)
```

Do **not** skip Task DA because “Full DA will run later”. Continuous alignment
is the point.

---

## Knowledge layers (all required for Full DA)

| Layer | What | Where |
|---|---|---|
| **L0 — Betfred business / use cases** | Domain criticality, finished-ticket lessons | [business-use-cases.md](business-use-cases.md) + [catalog.md](catalog.md) |
| **L1 — Platform risk patterns** | Sentinel, INNER, Liquibase, MERGE, watermark, TZ, Spark | [knowledge-base.md](knowledge-base.md) |
| **L2 — Local dim/fact + report corpus** | Per-table business logic, compare grain, findings | **Local corpus** below |
| **L3 — Ticket under review** | Jira findings + related Done tickets audited + `dimensions/de_{jira}_{name}.md` | Atlassian + local triage |
| **L4 — PR bot (mandatory)** | Full `dimension-ai-code-review` skill — diff + CLAUDE.md + rubric + agentic siblings | Skill `dimension-ai-code-review` → `fixes/{dim}/ai_code_review.md` |
| **L5 — artefact audit (mandatory)** | Live AWS + sibling jobs + Betfred-paste + control-plane | **This skill** → board in DA doc |

Order: **L3** → **L0+L2** → **L1 (incl. §M)** → **L4** → **L5** → **validation / RED ALERT**.

### L4 — same as Jenkins `dp-ai-code-review` (run before DEV / PR)

When Glue or TF changes on the branch:

1. Run skill **`dimension-ai-code-review`** completely (not a summary).
2. Output: `fixes/{dim}/ai_code_review.md` with checklist + issues + recommendation.
3. **REQUEST CHANGES** with any open HIGH/MEDIUM ⇒ **block** merge to `dev`, PR,
   and prod until fixed or risk accepted in writing.
4. Re-run L4 after every fix that touches Glue/TF.

### L5 — artefact audit (always in Task DA and Full DA)

Think like a **15-year data engineer** who owns Glue / DynamoDB / Step Functions.
Ruthless. Prefer live AWS + sibling jobs over prose that “sounds right”.

**Scope:** every `.html` / `.md` under the ticket
`fixes/dimensions/{status}/de_{jira}_{name}/` plus narrative
`dimensions/.../de_{jira}_*.md` when present.

**Standards:**

1. **Verify AWS** before naming resources (`list-tables` / `describe-table`
   prod + DEV). Never “NEW if missing”. Say **NEW — confirmed absent YYYY-MM-DD**
   or **EXISTS — verified**.
2. **Control planes (HARD — do not lump JobControl tables):** for **each**
   DynamoDB control table named in artefacts or proposed as reuse:
   - `describe-table` (keys, GSI, item count)
   - Sample items (`job_name`, `component`, `status`, `audit_sequence_time`)
   - Grep TF `--control_table` / `JobStatusHandler` writers
   - Classify: watermark vs work-queue; state **who writes it**
   - Document in `proposed_solution.html` (and triage inventory) — see L1 KB
     § “DynamoDB control tables”
   - **Known (2026-09-08):** `ETLJobControl` = BAU dim/builder watermarks;
     `DataProcessingJobControl` = **transactional_data_quality_mapping** CDC
     watermarks (same schema, different writer — **not** a month extract queue);
     `SftpJobControl` = SFTP; `ETLHistoricBackfillControl` **absent** → NEW if
     proposing historic segment automation
3. **Betfred paste** (`betfred-facing-no-cursor-leak`): no Cursor / bare
   “cursor” / Place 1/2/3 / local paths. Pagination → **S3 LastModified
   pagination resume**.
4. **Sibling jobs:** open real TF + scripts (extract, arrange, migration-config
   clone). Flag missing runtime overrides (e.g. Mart Unity + BalanceDate vs
   Warehouse + TransactionBK defaults).
5. Permanent dim defaults → Terraform only; runtime-override extract jobs may
   be started by SFN with per-segment args.
6. Human role after automation = FAILED/SNS + approvals only.
7. **Performance / fine-tuning (HARD):** for every bulk extract or multi-window
   plan, think like a DE who has burned a warehouse overnight:
   - Live row counts per chunk (not “~60 months” alone) — early/late samples
   - Is proposed grain OK for the Glue job (workers, timeout, JDBC fetch)?
   - Source risk (HEAP / indexes / BAU) vs Glue capacity — name the bottleneck
   - Concurrency bound; off-peak; DEV proof wall-clock before full queue
   - Escalate chunk size only with measured thresholds
   - Document verdict in `proposed_solution.html` (e.g. monthly OK @ ~0.8M avg,
     peak ~2.5–3M — see KB § Historic extract performance)
   - Patch the HTML same turn if volumes/grain were hand-waved
8. **Observability of the load (HARD):**
   - **One-off:** Jira/Confluence checklist with hop names SQL→S3 /
     S3→Iceberg / Iceberg→Redshift + rows in/out per window. Operator serial.
     **No** DynamoDB EXAMPLE required. Fail if HTML still argues SFN/DDB or
     leaves stricken “over-engineered” text.
   - **Reusable product:** work-queue table with per-hop PASS/FAIL + rows
     in/out (`hop_sql_s3_*` / `hop_s3_iceberg_*` / `hop_iceberg_redshift_*`).
     Overall DONE only when all three hops PASS. Jira paste includes EXAMPLE
     DynamoDB item. Fail thin “status=SUCCESS” without hop counts.
   - Never letter-code hop names (A→B / Extract / Arrange / Gold as IDs).
9. **NEW mapping JSON (HARD):** full commit-ready EXAMPLE + why each key —
   not “clone sibling” alone. Patch `proposed_solution.html` § config same turn.
10. **Worked EXAMPLES (HARD):** proof window with expected counts; JDBC
    overrides; MERGE-vs-UNION colliding-key EXAMPLE when write path disputed;
    operator steps filled with concrete months (e.g. 2024-05).

**Method:** list files → live AWS (incl. control-table deep-dive) → **volume /
grain performance check** → **hop observability + JSON completeness** → grep
leaks → EXISTING/NEW vs AWS+TF → Module EXAMPLES vs job args → board →
PASS/FAIL. **Patch proposed_solution same turn** on any RED.

**After L5 / Task DA on a proposed_solution ticket (HARD):** if control-plane
facts were wrong, incomplete, or lumped — **patch `proposed_solution.html`
(and triage inventory) in the same turn**, then re-check paste sections.
Do not leave “I’ll update the HTML later.”

**L5 FAIL / RED** ⇒ block Task “done”, Jira paste, and Full DA PASS.

---

## Local corpus (dim/fact aware)

| Source | Path |
|---|---|
| Triage / business walkthrough | `Cursor/dimensions/de_{jira}_{name}.md` |
| Fix notes | `Cursor/fixes/{name}/` |
| Compare profile | `migration-data-test/mappings/complex_dims/{name}.yaml` or `facts/` |
| Glue / TF | data-jobs `glue-jobs/**` + `tf/uk_digital_*{name}*` |
| Legacy proc | Unity `Stored Procedures/…*{Name}*.sql` |
| Migration findings | `migration-data-test/docs/findings/` |
| Prior unit-test write-ups | `Cursor/fixes/*/devils_advocate_unit_test.md` |

Build a **business-logic card** (L0): consumers, grain, must-never-be-wrong,
silent-failure modes, domain.

---

## RED ALERT — empty SQL Server vs populated Redshift

**Mandatory** on every pre-deploy validation window (declare compare pair).

| Condition | Severity | Action |
|---|---|---|
| **SQL Server row count = 0** for the window **and** Redshift **> 0** | **RED ALERT** | Stop; tell Prasath first line; block deploy/push |
| Redshift = 0 and SQL Server > 0 | **HIGH** (or RED if safer-gambling/money) | Block until explained / reload |
| Both 0 | **WARN** | Check window/filters/env pair |
| RS ≫ SQL because legacy **DELETE+reinsert** (e.g. session_history C1) | **Not RED** | Expected; gate on intersection / attributes; document |

Refresh SSO proactively (`aws-sso-proactive`).

---

## Board list (after Jira FIXED)

Extras beyond the ticket: **RED ALERT / HIGH / MEDIUM / LOW**, mark **Board?**
for RED + HIGH. Include open **L5 artefact audit** findings. Chat one-line board candidates.

---

## Workflow (Full DA — all gates)

```
Devil’s advocate unit test (after Compare; before PR → Commit → DEV):
- [ ] 0. Dim/fact + DE-XXXX; load L0 + catalog + L2 card
- [ ] 1. Jira Critical/Medium → FIXED / PARTIAL / OPEN / DOCUMENT-ONLY (proof)
- [ ] 1b. Related Done/Closed tickets — closed-claim audit (exact columns;
        live verify; supersede stale “leave stub” claims) — rule
        `jira-related-ticket-verify`
- [ ] 1c. Missing API columns — mapping exhaust + vendor ask before Option B
        (rule `api-missing-column-ask-vendor-first`); evidence in
        triage_validation one-stop
- [ ] 2. Business hunt (L0+catalog+L2)
- [ ] 3. Platform hunt (L1)
- [ ] 4. Align with PR bot (L4)
- [ ] 4b. **L5 artefact audit (L5)** — all ticket HTML/MD; live AWS; sibling jobs
- [ ] 5. Validation evidence — row counts, BK overlap, smoke (compare.py or manual)
- [ ] 5b. Report pack: `validation/reports/de_{jira}_{name}/` + refresh
        `de_{jira}_final_verdict.html` when tip/explain evidence exists
        (rule `dimension-validation-reports`)
- [ ] 6. **Count mismatch justification** when SQL rows ≠ warehouse rows (BK table required)
- [ ] 7. RED ALERT check (and legacy-history-wipe caveat)
- [ ] 8. Board list (incl. L5 artefact audit)
- [ ] 9. Block PR / commit / deploy? (L5 artefact audit RED blocks)
- [ ] 10. Write / refresh `fixes/…/devils_advocate_unit_test.md` (incl. **Validation results** + **L5 artefact audit**)
- [ ] 11. **After DEV validation:** re-open doc — update Validation results + re-run L5 artefact audit
- [ ] 12. Append novel patterns to L0/L1/catalog
- [ ] 13. dimension-ai-code-review → dimension-pr → Commit → DEV → Watermark
```

### Output shape (`fixes/{dim}/devils_advocate_unit_test.md` + chat)

**Mandatory for every dimension and fact ticket (all Jira DE-* migration work).**
Write once after Place 1 / pre-PR; **refresh after DEV validation** (Phase 2)
with full counts, BK overlap, and count-mismatch justification before PR to
`main`. **After post-deploy prod validation**, refresh `final_prod_results.md`
with prod BK overlap (test SQL → prod Redshift) — same BK gate as DEV; do not
close on prod smoke only.
(or `fixes/facts/…` when the ticket is a fact).

```markdown
## Devil’s advocate unit test — {dim|fact} (DE-XXXX)

(header: branch, glue job, compare profile, last updated)

### RED ALERT
- None | **SQL=0 / RS={n}** …

### Business-logic card (L0)
…

### Jira findings — fixed?
| Sev | Finding | Status | Proof |

### L1 §M (Glue ↔ TF)
…

### L4 AI code review
…

### L5 artefact audit
| Gate | Result |
| Overall | PASS / FAIL |
| Live AWS | (tables checked / NEW confirmed absent) |
| Betfred paste | PASS / FAIL |
| Sibling jobs | PASS / FAIL |
| Open RED/HIGH | … |

### Validation results (mandatory — refresh after DEV validation)

#### Compare pair
(test SQL → DEV RS | prod RS; date)

#### Row counts
| Source | Table/layer | Rows | BK range | Notes |

#### Business key overlap
| Metric | DEV | Prod (if checked) |

#### Count mismatch — justification
(required whenever SQL rows ≠ warehouse rows)

#### Aggregate compare (if profile uses aggregate_by)
…

#### Smoke checks
…

#### DEV validation verdict
| Gate | Result |

### Extra issues — board list
| Sev | Area | Business impact | Board? | Action |

### Block PR / commit / deploy?
Yes | No — reason

### Post-PR / prod (when applicable)
…
```

**Count mismatch rule:** If SQL row count ≠ warehouse row count, the unit test
**must** include a **Count mismatch — justification** section with evidence.
Never leave a gap unexplained.

If RED ALERT:

```text
RED ALERT — {dim}: SQL Server has 0 rows but Redshift has {n}
(pair: …, window: …). PR/commit/deploy blocked. Need your call.
```

---

## Hard rules

1. Ticket FIXED ≠ PR-ready — this unit test still required (after Compare).
2. **Every dim/fact Jira ticket** gets `devils_advocate_unit_test.md` with a
   completed **Validation results** section before PR to `main`.
3. When SQL row count ≠ warehouse row count, **Count mismatch — justification**
   is mandatory (BK overlap + root cause — not “investigate later”).
4. Refresh the doc **after DEV validation** with live counts and verdict; do not
   leave a pre-DEV stub at PR time. Re-run **L5 artefact audit**.
5. **Post-deploy:** `final_prod_results.md` must include **BK overlap from test
   SQL Server → prod Redshift**. Prod smoke-only is incomplete.
6. Open **RED / HIGH / MEDIUM** (incl. **L5 artefact audit**) ⇒ **block** PR / commit /
   deploy unless Prasath accepts in writing.
7. Ask before applying code fixes or prod mutations.
8. Extend KB files when new patterns appear.
9. Never mark PASS on inverted emptiness (SQL empty, RS populated) except
   documented legacy-history-wipe cases (intersection gate only).
10. **Task DA + L5 artefact audit after every completed task** — do not defer to Full DA.

## Related

- [business-use-cases.md](business-use-cases.md) · [catalog.md](catalog.md) ·
  [knowledge-base.md](knowledge-base.md) · [bedrock-kb-pointer.md](bedrock-kb-pointer.md)
- `dimension-validate` / `dimension-ai-code-review` / `dimension-pr`
- Rule: `dimension-devils-advocate-unit-test.mdc` (Task DA + L5 live here —
  no separate skill)
- After DA / Place gates: tick `delivery_checklist.md` same turn
  (`dimension-delivery-order` § Delivery checklist)
