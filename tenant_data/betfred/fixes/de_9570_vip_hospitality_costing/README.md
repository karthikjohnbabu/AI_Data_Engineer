# DE-9570 — vip_hospitality_costing

**Status:** In progress  
**Jira:** [DE-9570](https://betfred.atlassian.net/browse/DE-9570)  
**Triage:** `dimensions/in_progress/de_9570_vip_hospitality_costing.md`

## Next artefacts

| File | When |
|---|---|
| `glue_patch.md` | After fix design agreed |
| `what_fixed_line_nos.md` | When Glue tip changes |
| `pr.md` | Before PR to main |
| `validation/` | After DEV gold load |

## Priority fixes (from triage)

1. **C1** — `OK%` + migrated-account exclusion (match legacy proc)
2. **C3b** — select `sgp_player_id` from `dimension.player` (compare needs `PlayerID`)
3. **C2** — read SharePoint `full_name` / `username` from Iceberg (player fallback)
4. **Extra** — remove NODATA exit when player fetch empty
5. **C3b** — add `sgp_player_id` (column missing on gold today; `account_number` already present)
