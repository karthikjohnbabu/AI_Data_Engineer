# API source — missing column (ask vendor before Option B)

When gold/Glue hardcodes or omits a DWH column and the platform feed is an
**API / IMS / webservice report** (not CDC), do **not** jump straight to a
platform approximation (e.g. **sgp_currency_exchange_rate** for AmountGBP).

## Order (mandatory)

1. **Thorough analysis first** (before any Option B or “just use SGP”):
   - Legacy proc / tables that filled the column on SQL
   - Playtech / vendor **mapping workbook** (every relevant sheet; unhide rows)
   - All **Jira links / attachments** (rule `jira-comment-links-follow`)
   - Iceberg / curated schema for the report tables (column list)
   - Related Done tickets (rule `jira-related-ticket-verify`)
2. **Prove absence** — write in `triage_validation.md` / `.html`: searched X /
   Y / Z; **not found** (cite sheet + row or “no match in workbook”).
3. **Ask why** the column is missing on the API in the first place (product +
   vendor). Short Teams paste: **bold** names, no grey backticks
   (`betfred-facing-no-cursor-leak`).
4. **Ask the API owner / vendor first** (e.g. Playtech via Elena/Andrew):
   - Add/expose the field on the report, **or**
   - Point to another report/API (e.g. IMS Currency → ExchangeRate), **or**
   - Confirm permanently unavailable
5. **Only if vendor says no / not available** → **Option B**: platform
   approximation (document tables, rate date, LEFT JOIN, parity risk vs legacy).

## Verdict wording (in triage one-stop doc)

```text
Missing column on API path:
  A) Exhaust mapping + Jira + schema → not found (evidence)
  B) Ask <vendor/API owner>: add field / alternate feed / confirm N/A
  C) If no → Option B: <SGP or other platform tables> (approximation)
```

## Anti-patterns

- Shipping Option B (SGP FX) as the first recommendation without mapping-doc proof
- Treating “Glue hardcoded 0” as “source has no GBP” without checking the workbook
- Leaving the ask only in chat — must live in **triage_validation.md + .html**

## One-stop docs

`fixes/.../triage_validation.md` and matching **`triage_validation.html`** are
the **primary** ticket home. Report pack under `validation/reports/` is
**secondary** (teaching / tip diagrams). Skill: `dimension-triage`.

Lesson: DE-9549 AmountGBP — mapping xlsx has Amount + Currency code, no
AmountGBP; legacy used Casino.ExchangeRate / IMSCurrency; ask Playtech before
SGP.
