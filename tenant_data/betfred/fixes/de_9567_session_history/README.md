# Fix: session_history

- Source of truth: `dimensions/in_progress/de_9567_session_history.md`
- Classification: `other` (session pairing) primary; secondary `watermark-drift`
- Jira: [DE-9567](https://betfred.atlassian.net/browse/DE-9567)
- Status: **Glue patch on branch** — C2 + M1 + shared Spark done; not committed yet

## Schema evidence (2026-08-26)

| Side | Columns |
|---|---|
| SQL `Dimension.SessionHistory` | `SessionHistoryID`, **`PlayerID`**, `PlayerBK`, `LoginDate`, `LogoutDate` |
| RS DEV+prod `dimension.session_history` | `bvt_action_id`, `player_bk`, `logindate`, `logoutdate`, `ds_tsprocessed` — **no player_id** |
| Compare YAML | Maps BK + login/logout only (PlayerID omitted) |
| TF | `--primary_keys=bvt_action_id` (M4 done) |

**C3 verdict:** document only — do not Liquibase unless product asks.

## Implemented (code)

| Finding | Change |
|---|---|
| C2 | `pair_logins_to_logouts` — next logout before next login |
| M1 | `data_fetch_delay_in_minutes=120` |
| Spark | `configure_spark` + `create_glue_runtime` |
| C1 / C3 | Document for PR / compare |

Branch: `feature/de-9567-dimension-session-history`

See `glue_patch.md` and `what_fixed_line_nos.md`.

## Next (three test places)

1. **Place 1** — Athena Iceberg tip (`bvt_action` pairing) vs test SQL  
2. DA → PR → Commit → DEV → reload  
3. **Place 2** — test SQL → DEV RS  
4. Prod → **Place 3** — test SQL → prod RS  
