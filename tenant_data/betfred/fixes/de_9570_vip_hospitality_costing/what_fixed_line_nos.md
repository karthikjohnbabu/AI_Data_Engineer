# DE-9570 — what fixed (line numbers)

Personal reference for `glue-jobs/uk/digital/dimension/uk_digital_dimension_vip_hospitality_costing.py`.
Branch `feature/de-9570-dimension-vip-hospitality-costing` (uncommitted tip).

## 1. C1 — Oddsking (`OK%`) account exclusion

**Lines ~123–124** — Iceberg read `WHERE` adds
`AND UPPER(trim(account_number)) NOT LIKE 'OK%'` (trim + case-insensitive
Oddsking exclusion; stricter than legacy literal `NOT LIKE 'OK%'`).

## Quick map

| Jira finding | Lines (approx.) |
|---|---|
| C1 OK% exclusion | ~123–124 |
