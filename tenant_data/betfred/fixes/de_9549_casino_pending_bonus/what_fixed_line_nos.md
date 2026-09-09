# DE-9549 — what fixed (line numbers)

Personal reference for
`glue-jobs/uk/digital/dimension/uk_digital_dimension_casino_pending_bonus.py`.
Ignore quote/ruff churn. Lines as of tip 2026-09-08 (template_code fix).

## 1. X5 — `bonus_bk` = `template_code` (not action `code`)
**Lines ~16–18** — module docstring states BonusBK = template id.  
**Line ~104** — `a.template_code AS bonus_bk`.

## 2. C1 — `amount_gbp` still hardcoded 0
**Lines ~18–19, ~107** — still `CAST(0 …)`; Playtech ask first (Option B later).

## 3. C2 — `bonus_wagering` still hardcoded 0
**Line ~133** — `CAST(0 …) AS bonus_wagering`.

## Quick map

| Jira finding | Lines (approx.) |
|---|---|
| X5 bonus_bk → template_code | ~16–18, ~104 |
| C1 amount_gbp = 0 (deferred) | ~18–19, ~107 |
| C2 bonus_wagering = 0 (exclude) | ~133 |
