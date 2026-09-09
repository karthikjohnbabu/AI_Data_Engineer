# Fix: time_out

- Source of truth: `dimensions/done/de_9668_time_out.md`
- Classification: `status-overwrite`
- Branch (when committing): `cursor/dimension-time_out-fix-22ba`
- Jira: BED-XXX (placeholder)
- Related: DE-9568

## Problem

Glue builds `uk_digital.dimension.timeout` by joining disable history to the player's **current** `player_disable_reason_bk`, then filtering reason = `Timeout`. After `Timeout` → `Self Exclude`, historical timeout events stop qualifying, so Redshift row counts diverge from expectations / comparison.

## Proposed change

Rebuild the source SELECT so:

1. History is the driver.
2. Reason = `Timeout` is applied on the **event** (`pd.player_disable_reason_bk` → `pdr`).
3. Player is joined only for attributes (`player_bk`, account, ids) — **not** for current reason = Timeout.

`redshift_sync` stays unchanged (still MERGE on grain keys). No production SQL edits; no deploy.

## Files in this folder

| File | Purpose |
|---|---|
| `README.md` | This summary |
| `glue_patch.md` | Proposed Glue SQL change |
| `sql_patch.md` | Legacy view note (review only) |
| `notes.md` | Join diagram + sync notes |

## Validation

- Window: 1 month (April) — see `validation/config/windows.yaml`
- Acceptable match rate: ≥ 90%
- Next: run **dimension-validate** after review

## Out of scope

- No production SQL edits
- No edits to live Glue job or `redshift_sync` in this change set
- No deploy
