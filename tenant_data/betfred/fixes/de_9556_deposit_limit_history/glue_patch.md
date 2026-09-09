# Glue patch (proposed) — `uk_digital_dimension_deposit_limit_history.py`

**Target file (do not edit in this delivery):**  
`data-platform-glue-etl-transactional-data-jobs/glue-jobs/uk/digital/dimension/uk_digital_dimension_deposit_limit_history.py`  
**Branch when applying later:** `feature/de-9556-dimension-deposit-limt-histy`

**Scope:** player enrich join + first-DL window only.  
`redshift_sync(...)`, watermark, and core event SELECT from `sgp_player_deposit_limit` stay as-is unless noted.

---

## A) Player enrich — stop dropping unmatched limits (`join-logic`)

### Before (current)

```python
matched_player_df = matched_player_df.dropDuplicates([join_column])
return df.join(matched_player_df, join_column, "inner")
```

Problem: INNER join drops deposit-limit events with no matching Redshift player (safer-gambling risk). Legacy used LEFT JOIN + `-1` sentinel + backfill.

### After (proposed)

```python
matched_player_df = matched_player_df.dropDuplicates([join_column])
# Keep all limit events; decorate with player attrs when present
out = df.join(matched_player_df, join_column, "left")

# Sentinel for unmatched players (align with legacy PlayerID = -1 pattern).
# Adjust column names to whatever the frame uses after enrich
# (sgp_player_id and/or account_number may already exist on df).
if "sgp_player_id" in out.columns:
    out = out.withColumn(
        "sgp_player_id",
        coalesce(col("sgp_player_id"), lit(-1)),  # or lit("-1") if string/hash typed
    )
# If account_number comes only from player side, preserve source account_number
# from the limit event path — do not null out the business key used downstream.

return out
```

Suggested unified diff (illustrative):

```diff
-        return df.join(matched_player_df, join_column, "inner")
+        out = df.join(matched_player_df, join_column, "left")
+        # TODO: coalesce player id columns to sentinel -1 where null
+        return out
```

Imports: ensure `coalesce`, `lit` available (already used elsewhere in job / add as needed).

---

## B) First-time DL — valid-only window (`other`)

### Before (current)

```python
window_spec = Window.partitionBy("account_number").orderBy("valid_from")
result_df = result_df.withColumn("rn", row_number().over(window_spec))
result_df = result_df.withColumn(
    "is_first_dl",
    when((col("rn") == 1) & (col("is_invalid_record") == 0), 1).otherwise(
        col("is_first_dl")
    ),
).drop("rn")
```

Problem: `rn` is over **all** rows. If row 1 is invalid, `is_first_dl` stays 0 forever for that account even when a later valid limit exists.

### After (proposed)

```python
# Rank only among valid rows; invalid rows never compete for "first"
valid_window = (
    Window.partitionBy("account_number")
    .orderBy("valid_from")
)
# Option 1 — filter then join flag back:
valid_first = (
    result_df.filter(col("is_invalid_record") == 0)
    .withColumn("rn_valid", row_number().over(valid_window))
    .filter(col("rn_valid") == 1)
    .select("account_number", "player_deposit_limit_bk")  # grain keys
    .withColumn("is_first_dl_flag", lit(1))
)
result_df = (
    result_df.drop("is_first_dl")
    .join(valid_first, ["account_number", "player_deposit_limit_bk"], "left")
    .withColumn(
        "is_first_dl",
        coalesce(col("is_first_dl_flag"), lit(0)),
    )
    .drop("is_first_dl_flag")
)
```

Suggested intent in one line: **first valid limit by `valid_from` per account gets `is_first_dl = 1`.**

Downstream `action_description = 'FirstDL'` / `first_time_dl` mapping should keep working if it still keys off `is_first_dl` / FirstDL.

---

## C) CustomerID — **implemented on Glue tip**

Populate **`customer_id_legacy`** from `uk_digital.dimension.player` on both player enrich paths
(`enrich_with_player_data`, `prepare_final_records`), with `coalesce(..., -1)` matching legacy
`ISNULL(c.CustomerID, -1)`.

**Redshift DDL (manual DBA drop/recreate — CREATE reference only):** `fixes/deposit_limit_history/redshift_ddl_customer_id_legacy.sql`  
Column order matches legacy: `customer_id_legacy` first, then grain keys, then `sgp_player_id`. **Never** add DROP/CREATE/ALTER for gold tables in Glue `.py`.

Compare profile: `CustomerID` → `customer_id_legacy` in `deposit_limit_history.yaml`.

---

## `redshift_sync` impact

None to the utility. Job still MERGEs the final frame into `"uk_digital"."dimension"."deposit_limit_history"`. Expect **more** rows after LEFT enrich (previously dropped unmatched players) and corrected `first_time_dl` flags after valid-only first-DL.
