# Dimension / fact devil’s advocate

Fits **delivery order** (`dimension-delivery-order`): **Place 1 Athena** →
**this gate** → PR → Commit → DEV → **Place 2** → … → **Place 3** prod.

Applies to **every dimension and fact Jira ticket (DE-*)**.

## After every completed task (HARD RULE — Task DA)

When any meaningful ticket step finishes in the same turn (triage HTML,
`proposed_solution`, Glue/TF tip, checklist tick, Jira/Teams paste draft,
watermark plan, etc.):

1. Run skill **`dimension-devils-advocate-unit-test`** in **Task DA** mode  
   (not optional — do not wait for “PR-ready”).
2. Task DA **always** includes **L5 artefact audit** (same skill — live AWS
   **describe+sample+writer** for every JobControl named, Betfred-paste leak
   check, sibling jobs, control-plane correctness).
3. Confirm the step is **aligned** with THE PLAN / checklist / delivery order.
4. **L5 RED** or Task DA RED/HIGH/MEDIUM ⇒ **fix before** claiming done /
   ticking checklist / offering Jira paste.
5. If `proposed_solution.html` (or triage) mis-states a control table, hand-waves
   extract grain/volumes, ships **thin JSON** (“clone X” only), or lacks
   **per-hop PASS + row counts** on the work-queue — **patch it same turn**.
6. Log `Task DA L5 PASS|FAIL` on `delivery_checklist.md` Notes.

Full L0–L5 + validation still required before PR (below). Performance,
hop observability, and complete config EXAMPLES are part of L5.

## Full DA (PR-ready / bot-proof / unit test / before Commit)

When Jira findings are **implemented** and the user is about to **raise a PR**,
**draft `pr.md`**, **commit**, **deploy**, or says **PR-ready** / **bot-proof** /
**unit test** / **devil's advocate**:

1. Prefer **Place 1** before Commit when Iceberg can express the tip; then
   **DEV validation**; **Post-deploy prod validation** after prod. Declare
   compare pair. C1 / legacy-history-wipe: Glue ≫ SQL OK when classified.
2. Run skill **`dimension-devils-advocate-unit-test`** end-to-end:
   - **L0** + **catalog** · **L1** (incl. §M) · **L2** · **L3** (Jira + related
     Done audit) · **L4** `dimension-ai-code-review` · **L5 artefact audit**
3. **Validation results** in `devils_advocate_unit_test.md` (counts, BK overlap,
   count-mismatch justification, smoke, **L5 board**, report pack).
4. Refresh after DEV validation; re-run L5. Post-deploy: BK overlap in
   `final_prod_results.md`.
5. Board list; **RED ALERT** on SQL=0/RS>0; block on open RED/HIGH/MEDIUM
   (incl. L5 RED).
6. Write path: `fixes/dimensions/{status}/de_{jira}_{name}/devils_advocate_unit_test.md`
7. Then `dimension-pr` → PR to `main`. Append novel patterns to L0/L1/catalog
   when tickets close.

Do not mention this rule/skill in Betfred-facing PR or Jira text.
