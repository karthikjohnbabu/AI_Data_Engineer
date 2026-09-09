# Dimension validation reports (final_verdict pack)

Every dimension / complex-fact ticket (`DE-*`) uses the **same report pack**
shape pioneered on **DE-9549** (`casino_pending_bonus`). Do not invent ad-hoc
report names or dump evidence only into chat.

## Folder (mandatory)

```text
Cursor/validation/reports/de_{jira}_{dim_name}/
```

Example: `validation/reports/de_9549_casino_pending_bonus/`.

Never put ticket reports under a bare `validation/reports/{name}_…` without the
`de_{jira}_` prefix. Nested run folders under that dir are fine
(e.g. `athena_verdict/`, `prod_2026-08/`).

## Report pack — what to produce

| Artefact | When required | Purpose |
|---|---|---|
| **`fixes/.../triage_validation.md` + `.html`** | Ground work / ongoing ticket home | **Primary one-stop** — **full DE-9549 detail** (not a stub); findings, links, mapping proof, vendor ask, Option A/B, live counts, TOC, Mermaid/ASCII |
| **`fixes/.../proposed_solution.html`** | New workflow / historic load | Plan→Execute; **AWS-verified** NEW/EXISTS; multi-window → DynamoDB work-queue + SFN; **L5 artefact audit** before Jira paste (`dimension-proposed-solution`) |
| **`de_{jira}_final_verdict.html`** | Athena tip / “explain the issue” / close readiness / user asks for verdict | **Secondary** teaching + tip diagrams (keep in sync with triage one-stop) |
| `de_{jira}_how_to_close_ticket_*.html` (or `.md`) | Closing / standup paste | Personal runbook: Jira Paste A/B, not a meeting deck |
| `de_{jira}_*_business_justification*.html` (+ `.md` twin optional) | After compare with deltas | Team-facing justification (no Cursor paths) |
| `de_{jira}_team_field_map_*.html` | Field vocab / ID-space tickets | Column-by-column Alice gate map |
| `fixes/.../final_prod_results.md` | Post-deploy prod gate | Jira-paste BK overlap + smoke |
| Raw evidence subfolder | When Athena/RS SQL was run | e.g. `athena_verdict/*.tsv` |

**Primary vs secondary:** put decisions and evidence in **triage_validation**
first; report-pack HTML supports teaching / tip proof. Do not leave the only
copy of a vendor-ask or Option B decision only in chat or only in
`final_verdict.html`.

## `triage_validation.html` — full detail (HARD RULE — every ticket)

Ground work **fails** if `triage_validation.html` is a short stub (one verdict
box + one table). Match the depth of
`fixes/dimensions/in_progress/de_9549_casino_pending_bonus/triage_validation.html`
for **all** future `DE-*` tickets (historic-backfill, source-system-gap,
logic bugs — same bar).

**Minimum HTML sections** (adapt titles; do not drop the substance):

1. TOC (Jump) with anchors  
2. Verdict banner + status pill  
3. Picture / good vs wrong  
4. Layman pipes + Alice/Bob/Carol + cheat sheet  
5. Tables inventory + Mermaid **and** ASCII E2E + issue map  
6. Live counts / examples (compare pair declared)  
7. Findings or options board (ship vs leave / Critical–Medium / A–B–C)  
8. Related Done closed-claim audit (when linked)  
9. Jira links followed  
10. Blocks Done / how to close + next  
11. Mermaid via CDN; DE-9549-like CSS shell  

MD twin must stay in sync. Rule detail also in `dimension-docs-plain-diagrams`
§6.

**Reference pack:**  
`validation/reports/de_9549_casino_pending_bonus/`  
(esp. `de_9549_final_verdict.html`) +  
`fixes/dimensions/in_progress/de_9549_casino_pending_bonus/triage_validation.md`
(+ full `.html`). Historic example: DE-9654 full `triage_validation.html`.

## `de_{jira}_final_verdict.html` — required sections

Fail the deliverable if any of these are missing when a final verdict is asked
for or when Place-1 Athena tip proof is the gate:

1. **TOC** with in-page anchors  
2. **Verdict banner** (one screen: ship / hold / close-on-contract)  
3. **Compare pair** declared (test SQL → Athena tip / DEV RS / prod RS)  
4. **Picture for anyone** — metaphor + good vs wrong + one sentence  
5. **IN vs OUT of this issue** (two boxes or table)  
6. **Tables involved** — numbered inventory: every Iceberg / Redshift /
   DynamoDB / SQL compare object; role in plain words; “used by Glue?”  
7. **End-to-end flow** — Mermaid **and** ASCII twin; tag `✗ C#` / source-pipe
   gaps **on** the diagram (not prose-only)  
8. **Alice / Bob / Carol** (or equivalent named examples) on the picture  
9. **Cheat sheet** — symptom → usually means → fix in Glue?  
10. **Live examples** with real keys from Athena/RS (not invented)  
11. **What the fix changes / does not change**  
12. **Athena (or tip) SQL** that proves the fix + match summary  
13. **Decision board** (PROVED / OUT OF SCOPE / OPEN / EXCLUDE)  
14. Mermaid via CDN so the file renders when opened in a browser  

Align with rule `dimension-docs-plain-diagrams` (Picture / layman / E2E). The
HTML is the **assembled** teaching doc; triage `.md` stays the ticket narrative.

## Skills that must produce / refresh the pack

| Skill / moment | Must refresh |
|---|---|
| `dimension-triage` ground work | **Full** `triage_validation.md` + `.html` (DE-9549 depth, not stub); start report folder; **`proposed_solution.html`** when new workflow / load path |
| Athena tip / “final verdict” / explain issue | **`de_{jira}_final_verdict.html`** |
| `dimension-validate` | Business justification + report folder; refresh verdict after gate |
| Close / standup paste | How-to-close HTML + Jira paste blocks |
| `dimension-devils-advocate-unit-test` | Point Validation results at report pack + verdict; **L5 artefact audit** on ticket HTML/MD; **Task DA** after every step |
| Post-deploy | `final_prod_results.md` (not a replacement for final_verdict) |

## Hard rules

- **All tickets** follow this pack — not only `source-system-gap` dims.  
- Betfred-facing HTML/MD: **no** `Cursor/` paths, Place 1/2/3 labels, or
  agent names (`betfred-facing-no-cursor-leak`). Personal runbooks may keep
  local paths. **Jira / Teams paste** from the pack: no Alice/Bob/Carol or
  “shelf” nicknames — translate to CDC vs API (or equivalent) in plain words.  
- Do not claim PASS on full row-count parity when triage is `source-system-gap`.  
- Keep raw Athena/RS extracts under the same `de_{jira}_{name}/` folder.

## Anti-patterns

- Chat-only walkthrough with no HTML/MD under `validation/reports/de_{jira}_*`  
- `final_verdict` that is only a prose summary (no table inventory, no diagrams)  
- Mermaid without ASCII twin  
- Mixing multiple tickets’ evidence in one unscoped folder  
