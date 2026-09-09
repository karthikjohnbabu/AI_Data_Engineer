# Jira comment links & APIs — always follow

When triaging or doing **ground work** on a Jira ticket (`DE-*`):

## Hard rule

If the ticket **description or comments** contain a URL, API endpoint,
Bitbucket/SharePoint path, or named attachment (PDF / .msg / xlsx):

1. **Inventory** it in `fixes/.../triage_validation.md` (or triage `.md`) —
   table: Link | Where | What we did | Result.
2. **Follow / resolve** it — do not only restate the comment text.
   - Report/API URL (e.g. `admin.betfred.com/reportviewer/...`) → prove how
     prod/DEV calls it (DynamoDB APIConfiguration, EventBridge, S3 landing,
     Iceberg). Redact secrets.
   - Bitbucket → open when VPN allows; else note block + use live AWS/config.
   - Attachments → list and summarise; if PDF not OCR'd, say who must review.
   - Mapping workbooks (xlsx) → search every sheet for missing DWH columns
     (unhide rows); cite sheet + row or “not present”. Then follow
     `api-missing-column-ask-vendor-first` (ask vendor before Option B).
3. **Fail** ground work if an API was pasted in comments and the validation
   doc has no links-followed + API-access section.

## Related / closed tickets (HARD RULE)

If the ticket **links to or inherits from** another issue that is **Done /
Closed** (e.g. DE-9549 → DE-7392):

1. Fetch that issue’s description + comments.
2. **Question why it closed** and what Done actually covered.
3. Map each inherited claim to the **exact column / person / quote**.
4. **Verify live** (Glue / Iceberg / SQL). Supersede stale comments with
   evidence.
5. Put a **Related tickets — closed-claim audit** table in
   `triage_validation.md`.

**Done ≠ still correct.** Worked miss: DE-7392 “always zero” was
`BonusWagering`, not `AmountGBP`. Rule: `jira-related-ticket-verify`.

## Why

DE-9549: the Playtech export URL and CDC-vs-API explanation lived in comments.
Skipping links missed that AWS already had API access. Blind trust of Done
tickets also mis-labelled amount_gbp as an accepted stub.

Skill: `dimension-triage` § Jira comment links & APIs / Related tickets.
