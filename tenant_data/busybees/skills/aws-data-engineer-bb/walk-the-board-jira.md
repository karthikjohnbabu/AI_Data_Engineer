# Walk-the-board & Jira close list

When Prasath or Anna ask **“which Jira tickets to close?”** or for a **walk-the-board update with Jira numbers**, follow this workflow. Do not answer from the day's chat narrative alone.

## Board style (Prasath — 2 Sep 2026)

**Keep walk-the-board short.** Prefer a high-level **Completed** section — no row counts, SCD2 breakdowns, or Live-id tallies unless Prasath asks. Too much detail → more questions on the board.

Use Prasath’s preferred shape (example 2 Sep):

```
Completed

Prod Midlothian:
End-to-end load completed across Centre, Room, Child, Parent, Bill Payer and Health.
Reverse processing completed for Child, Parent and Bill Payer with Live IDs.
Profile images successfully processed; no reverse required.

UAT Parent Refresh:
Parent refresh completed successfully.
Existing Live IDs preserved and SCD2 processing validated.

Closed in Jira:
DTK-536 — Bishopsgarth centre SOT on PROD — Done
DTK-699 — Centre SOT creation — Bishopsgarth loaded — Done
DTK-700 — Room SOT creation — Done

No Ticket:
Nick's office IP whitelisted on bastion (103.110.210.49).
```

**Recent** for “what changed lately” = Jira `updated >= -7d` (not the full open board).

---

## What went wrong (28 Aug 2026)

We matched only Wed–Fri topics (Hopefield, Katy, Tife) to Jira keywords. We missed Prasath-assigned tickets whose **work was done** but **Jira status was never moved to Done** (497, 647, 656, 682, 683, 687, 536).

**Rule:** “Close” means **work complete → transition Jira to Done**, not “already shows Done in Jira”.

---

## Mandatory steps (every time)

1. **Jira — Prasath's open board first**
   ```
   assignee = "Prasath Natarajan" AND status != Done ORDER BY updated DESC
   ```
   Review every row. Ask Prasath or check repo/AWS if work looks finished but status is To Do / In Progress / To Review.

2. **Jira — recently updated (last 7 days)** when they ask for “recent / updated tickets”
   ```
   assignee = "Prasath Natarajan" AND updated >= -7d ORDER BY updated DESC
   ```

3. **Jira — recently Done (don't re-close)**
   ```
   assignee = "Prasath Natarajan" AND status = Done AND updated >= -14d
   ```

4. **Cross-check `completed-tasks.md`** — map finished Tasks to DTK numbers when known.

5. **Then** add narrative-only items (Hopefield support, ad-hoc DQ) — note if **no ticket**.

6. **Report for Karthik (internal)** — Close now vs Still open. **Draft for the board** — short Completed + Closed + No ticket only (see template above).

---

## Known DTK ↔ work map (Prasath assignee — keep updated)

| DTK | Summary (short) | Notes |
|-----|-----------------|-------|
| DTK-497 | Akhilesh RDP + MySQL read replica | **Done** (28 Aug) |
| DTK-536 | Bishopsgarth centre SOT | **Close / Done** — prod `gs_ref=90012` (28 Aug); board closed 2 Sep |
| DTK-647 | Child journal PDF links — DEV | To Review → close when signed off |
| DTK-656 | UAT S3 file-drop (match DEV) | **Done** (28 Aug) |
| DTK-682 | First/last name fix — DEV | **Done** (28 Aug) |
| DTK-683 | First/last name fix — UAT | **Done** (28 Aug) |
| DTK-687 | Prod Midlothian bucket/folder structure | **Done** (28 Aug) |
| DTK-679 | dropDuplicates + UAT bill_payer cleanup | **Open** until UAT deploy + cleanup |
| DTK-699 | Centre SOT creation (generic) | **Close / Done** for Bishopsgarth first use (2 Sep board) |
| DTK-700 | Room SOT creation (generic) | **Close / Done** — 4 rooms on `90012` in `dim_room` |
| DTK-705 | Prod Midlothian validation support | **In Progress** (created 2 Sep) — keep open |
| DTK-601 | UAT Midlothian validation support | Still open |
| DTK-626 | Analytics post-check DEV/UAT | To Review |

When closing a ticket, add a one-line comment (what was done, where verified).

---

## New tickets to create (when asked)

- **SOT Centre creation** — original DL centre onboarding (not Midlothian Glue) — was DTK-699
- **SOT Room creation** — original DL room onboarding — was DTK-700

Use project **DTK**, assign per Prasath. Link to Bishopsgarth / Katy thread if relevant.

---

## Walk-the-board message template (board-facing)

```
Completed

[Env / workstream]:
[1–3 short outcome lines — no counts unless asked]

Closed in Jira:
DTK-xxx — [one short line] — Done

No Ticket:
[ad-hoc only]
```

Internal Karthik notes may still list Still open / Backlog; do **not** paste that full list to the board unless Prasath asks.

Times in **London** (BST/GMT), not IST.
