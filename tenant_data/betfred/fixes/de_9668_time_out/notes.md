# Notes: time_out status-overwrite fix

## Join diagram

### Before (bad)

```text
sgp_player (current reason)
    ⋈ pdr ON player.current_reason_bk
    ⋈ history ON player_bk AND history.reason_bk = player.current_reason_bk
WHERE pdr.description = 'Timeout'
```

After Self Exclude: current reason ≠ Timeout → history Timeout rows vanish from the SELECT.

### After (good)

```text
silver_player_disabled_history (event)
    ⋈ pdr ON history.reason_bk
    ⋈ sgp_player ON player_bk   -- attributes only
WHERE pdr.description = 'Timeout'
```

Timeout events stay even when the player's current status is Self Exclude.

## redshift_sync

- Path: `utilities.redshift_sync.redshift_sync`
- Role here: MERGE frame → `uk_digital.dimension.timeout` on grain keys
- Not the root cause; do not change the utility for this fix

## Risks

- Incremental watermark may need a controlled backfill/replay so already-dropped Timeout history re-enters gold for dormant Self-Excluded players
- Legacy view has the same join pattern — comparison vs unfixed SQL Server can understate the fix benefit
- Secondary issues from DE-9568 (`is-current-expiry`, watermark buffer) are out of scope for this patch
- Fan-out: confirm `sgp_player.player_bk` is unique before applying the event-level join

---

## Backfill plan (proposal only — no production changes)

**Goal:** After the event-level join fix lands in a controlled environment, recover:

1. The **~740** April 2024 Timeout rows missing from Redshift vs SQL Server (and the larger gap vs Iceberg event-level ≈ **823** vs primary oracle count **1,454**)
2. **Full history** of Timeout events that current-status joins dropped for players who later Self Excluded (or otherwise changed reason)

**Constraint:** Deploying the join fix alone is **not** enough. Incremental logic filters on `ds_tsprocessed >= last_success`. Dormant history rows often have **old** `ds_tsprocessed`, so they never re-enter the batch.

**Grain reminder:** gold is **one row per disable event** `(player_bk, disable_on, disable_until)` — not one row per player.

### Option A — Full rebuild / reload of `uk_digital.dimension.timeout`

**What:** Truncate or `redshift_recreate` / drop+reload the gold table from a full event-level Timeout extract (all history), then resume normal incremental runs with the fixed join.

| | |
|---|---|
| **Pros** | Clean slate; `is_current` recomputed end-to-end; no leftover orphans |
| **Cons** | Downtime / empty table window; higher blast radius; needs exclusive job window; more stakeholder coordination |
| **Risks** | Downstream reports break during reload; reload failure leaves table empty or half-loaded; harder to partial-retry |
| **Rollback** | Restore from pre-rebuild snapshot / UNLOAD backup taken **before** truncate; re-point consumers if needed |

### Option B — MERGE-only reopen of historical Timeout rows (recommended)

**What:** Keep the existing gold table. Run a **one-shot** (or watermark-reset) job with the **event-level** join and a **forced lookback** covering all history (e.g. override `safe_last_load_time` to a sentinel far in the past for one run). Let `redshift_sync` **MERGE** on grain keys to INSERT missing Timeout events and UPDATE changed attributes / `is_current`. Then restore normal watermark behaviour.

Suggested phases:

1. **Non-prod:** apply join fix → forced full-history MERGE → validate  
2. **April gate:** gold vs Iceberg event-level for 2024-04-01..2024-04-30 ≥ 90% (primary oracle); legacy SQL Server secondary only  
3. **Full history:** same forced MERGE in prod window (or chunked by year if volume/WLM requires)  
4. **Steady state:** normal incremental + existing full-table `is_current` expiry pass  

| | |
|---|---|
| **Pros** | No truncate; recovers the ~740+ missing rows in place; uses existing MERGE path; smaller blast radius; easy to re-run if incomplete |
| **Cons** | Does **not** delete gold rows that should not exist (April showed `only_rs = 0`, so low concern today); depends on correct grain keys and unique `player_bk` on player join |
| **Risks** | Watermark mishandled → accidental perpetual full scans; WLM/timeout on huge MERGE; fan-out if player table duplicates; false confidence if validated only vs legacy |
| **Rollback** | Keep pre-backfill UNLOAD/snapshot of `dimension.timeout`; if MERGE goes wrong, restore snapshot and revert job to previous join until re-attempt. Incremental watermark: record/restore DynamoDB last-success time used before the forced run |

### Recommendation

**Choose Option B (MERGE-only reopen).**

Rationale: gold is under-populated, not over-populated, for the measured April window; event grain + existing `redshift_sync` MERGE is designed for upserts; avoid truncate downtime. Use Option A only if ops prefer a clean rebuild or if later validation finds material gold-only orphans that MERGE cannot clear.

**Do not apply Glue or run backfill from this note alone** — wait for explicit non-prod apply + validation against Iceberg event-level before any prod backfill.
