# Devil’s advocate — deposit_limit_history (DE-9556)

Retrospective seed from Bedrock AI review (`48470acf` era) + tip resolutions.
Use as example of `fixes/{dim}/devils_advocate_unit_test.md` shape.

| Sev | Area | Verdict | Action taken |
|---|---|---|---|
| HIGH | `sgp_player_id=-1` history fetch windows all unmatched together | **FIXED** | Exclude sentinel from `fetch_historical_records` filter |
| MEDIUM | `customer_id_legacy` DDL before job | **FIXED** (ops) | DROP gold / Glue recreate; runbook in prod reset doc |
| LOW | `account_number` cast fallback → NULL collapse | **NOTED** | Prefer unique non-null fallback if types diverge |
| LOW | Redundant early `customer_id_legacy` fetch | **DEFERRED** | Optional cleanup |
| MEDIUM | Testing evidence | **FIXED** | Presence BA DEV + prod in PR / Jira |

**Block PR?** No (after HIGH fix landed) — historical for next dims.
