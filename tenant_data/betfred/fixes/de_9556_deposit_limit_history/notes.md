# Notes: deposit_limit_history vs Timeout status-overwrite

## Not the Timeout pattern

| | Timeout (`time_out`) | Deposit limit history |
|---|---|---|
| Driver | Disable **history**, filtered by reason | Limit **events** (`sgp_player_deposit_limit`) |
| Failure mode | Join to **current** disable reason → history drops after Timeout → Self Exclude | **INNER** player enrich → events drop when player missing; first-DL wrong on invalid-first accounts |
| Classification | `status-overwrite` | `join-logic` + `other` |

Do **not** apply the Timeout event-level reason rewrite here — the event table is already the driver.

## Join diagram (player enrich)

### Before (bad)

```text
limit_events ⋈_inner redshift.dimension.player
→ only events with a matched player survive
```

### After (good)

```text
limit_events ⋈_left redshift.dimension.player
→ all events survive; unmatched get sentinel player id (-1)
```

## First-DL diagram

### Before (bad)

```text
ROW_NUMBER() over ALL rows by valid_from
→ if rn=1 and invalid → never FirstDL
```

### After (good)

```text
ROW_NUMBER() over VALID rows only by valid_from
→ first valid limit gets is_first_dl = 1
```

## redshift_sync

- Innocent MERGE path — not the root cause
- After LEFT enrich, MERGE may insert previously missing grain keys — plan a controlled non-prod validation before any prod backfill

## Risks

- Sentinel type for `sgp_player_id` (int vs hash/string) must match Redshift column type
- LEFT join can duplicate if player fetch is not de-duped on join key (already `dropDuplicates`)
- Downstream that assumed every gold row has a “real” player may need to handle `-1`
- CustomerID gap remains until signed off or populated
- Fan-out: confirm join key uniqueness on player side

## Validation reminder

- 1 month window, ≥ 90% vs SQL Server profile (`deposit_limit_history.yaml`)
- Explicitly count rows that would have been INNER-dropped (player null) before/after in non-prod
