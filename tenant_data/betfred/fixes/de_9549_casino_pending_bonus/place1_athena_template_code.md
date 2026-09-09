# DE-9549 Place 1 — Athena tip (template_code)

**Pair:** Athena Iceberg tip over `prod_dp_dwh_uk_digital.ptcasino_der_bonus_actions`  
**Date:** 2026-09-08  
**Glue tip change:** `a.template_code AS bonus_bk` (local tip; not yet deployed)

## Tip grain (latest action per pending_bonus_code)

| Metric | Value |
|---|---|
| Tip rows | **313,569** |
| `code` = `template_code` | **0** |
| `template_code` NULL | **0** |
| Distinct `template_code` | **200** |
| Distinct action `code` | **313,569** |

## Sample keys (live)

| pending_bonus_code | action `code` (wrong BK today) | `template_code` (fixed BK) | amount | currency | status |
|---|---|---|---|---|---|
| 3998550691 | 553502464 | **44531** | 1 | GBP | Wagering completed |
| 3997548571 | 553502459 | **44530** | 1 | GBP | Wagering completed |
| 3998057901 | 553382319 | **44531** | 1 | EUR | Wagering completed |

## Verdict

Place 1 logic **PASS** for X5: tip must use **template_code**; action **code** is a different id space (0 overlap on tip).

## Next — HUMAN OK required

Phase 2 cannot start until you say yes to each:

1. **Commit** Glue tip  
2. **Push** / merge to `dev` + Jenkins DEV apply  
3. **DEV gold reload** (DROP + watermark — heals old `code` BKs)  
4. Run DEV Glue ≥2× (defaults only)  
5. Then agent runs Place 2: test SQL → DEV RS
