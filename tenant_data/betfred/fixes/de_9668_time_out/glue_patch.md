# Glue patch (proposed) — `uk_digital_dimension_timeout.py`

**Target file (do not edit in this delivery):**  
`data-platform-glue-etl-transactional-data-jobs/glue-jobs/uk/digital/dimension/uk_digital_dimension_timeout.py`

**Scope:** replace the source SELECT that builds `dm_timeout_df` only.  
`redshift_sync(...)` call, primary keys, and expiry `is_current` logic stay as-is.

---

## Before (current — joins on current status)

```sql
FROM {sgp_player} p
JOIN {sgp_player_disable_reason} pdr
    ON p.player_disable_reason_bk = pdr.player_disable_reason_bk
JOIN {silver_player_disabled_history} pd
    ON pd.player_bk = p.player_bk
    AND pd.player_disable_reason_bk = p.player_disable_reason_bk
WHERE pdr.player_disable_reason_description = 'Timeout'
  AND p.is_test = 0
  AND (
      p.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
      OR pd.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
      OR pdr.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
  )
```

Problem: `pdr` is tied to **current** `p.player_disable_reason_bk`, and history is further restricted to that same current key. After Self Exclude overwrite, Timeout history drops out.

---

## After (proposed — Timeout on event / history)

```sql
FROM {silver_player_disabled_history} pd
JOIN {sgp_player_disable_reason} pdr
    ON pd.player_disable_reason_bk = pdr.player_disable_reason_bk
JOIN {sgp_player} p
    ON p.player_bk = pd.player_bk
WHERE pdr.player_disable_reason_description = 'Timeout'
  AND p.is_test = 0
  AND (
      p.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
      OR pd.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
      OR pdr.ds_tsprocessed >= CAST('{safe_last_load_time}' AS TIMESTAMP)
  )
```

Notes:

- Driver = history (`pd`).
- Reason filter is on the **event** reason (`pd` → `pdr`), not current player reason.
- Player join supplies `player_bk` / `sgp_player_id` / `account_number` only.
- Outer SELECT column list and `is_current` CASE stay unchanged (still based on `pd.*`).

---

## Suggested unified diff (snippet)

```diff
-        FROM {sgp_player} p
-        JOIN {sgp_player_disable_reason} pdr
-            ON p.player_disable_reason_bk = pdr.player_disable_reason_bk
-        JOIN {silver_player_disabled_history} pd
-            ON pd.player_bk = p.player_bk
-            AND pd.player_disable_reason_bk = p.player_disable_reason_bk
+        FROM {silver_player_disabled_history} pd
+        JOIN {sgp_player_disable_reason} pdr
+            ON pd.player_disable_reason_bk = pdr.player_disable_reason_bk
+        JOIN {sgp_player} p
+            ON p.player_bk = pd.player_bk
         WHERE pdr.player_disable_reason_description = 'Timeout'
```

---

## `redshift_sync` impact

None to the utility. Job still:

1. Builds the frame with grain `(player_bk, disable_on, disable_until)` / `sgp_timeout_id`
2. Calls `redshift_sync(..., primary_keys=...)` for MERGE into `uk_digital.dimension.timeout`

Expect more historical Timeout rows to re-enter the incremental batch for players who later Self Excluded; MERGE upserts them back into gold.
