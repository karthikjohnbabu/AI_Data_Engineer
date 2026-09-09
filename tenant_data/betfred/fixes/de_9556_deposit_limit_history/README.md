# Fix: deposit_limit_history

- Source of truth: `dimensions/done/de_9556_deposit_limit_history.md`
- Classification: `join-logic` (primary); secondary `other` (`is_first_dl`, `CustomerID`)
- Jira: [DE-9556](https://betfred.atlassian.net/browse/DE-9556)
- Working branch (Glue repo): `feature/de-9556-dimension-deposit-limt-histy`
- Proposal only — **production Glue / SQL Server not edited here**

## Problem

Glue builds `uk_digital.dimension.deposit_limit_history` from Iceberg limit **events**, then **INNER JOINs** Redshift `dimension.player`. Unmatched players (and their limit events) are dropped. First-time DL is also computed so that if the earliest row is invalid, no later valid row gets `FirstTime_DL`.

This is **not** the Timeout status-overwrite pattern (current reason filter). History events are not filtered by “current limit.”

## Proposed change

See `glue_patch.md`:

1. Player enrich: **left** join + sentinel (`sgp_player_id` / ids = -1 style) when no player match — keep limit events.
2. `is_first_dl`: rank over **valid-only** rows (or first valid by `valid_from`), not “row 1 of all rows if valid.”
3. `CustomerID`: populate for parity **or** document sign-off (tracked in notes; optional in patch).

`redshift_sync` unchanged (MERGE only).

## Files in this folder

| File | Purpose |
|---|---|
| `README.md` | This summary |
| `glue_patch.md` | Proposed Glue join / first-DL changes |
| `sql_patch.md` | Legacy LEFT JOIN reference (review only) |
| `notes.md` | Contrast vs Timeout, risks, validation |

| `dry_run_iceberg_reference.sql` | **Athena CTAS** — build target dim from Iceberg only (no Redshift deploy) |
| `redshift_ddl_customer_id_legacy.sql` | Manual DBA CREATE for gold table (post-deploy) |

## Dry-run validation (no Redshift deploy)

**Worth doing** for an approximate tip-logic check before DEV/prod:

1. **CTAS in Athena** — `dry_run_iceberg_reference.sql` joins Iceberg
   `sgp_player` **inside Athena** (12M stays in S3; do not pull to client).
2. **`compare.py`** with `mappings/complex_dims/deposit_limit_history_dry_run_athena.yaml`
   (`athena_unload: true` — result window as Parquet from S3).

```bash
aws sso login --profile prod
cd data-platform-migration-data-test
# After CTAS materialised:
AWS_PROFILE=prod python compare.py \
  --profile mappings/complex_dims/deposit_limit_history_dry_run_athena.yaml \
  --start 2024-04-01 --end 2024-04-30
```

**Caveats (approximate only):** Iceberg `sgp_player` ≠ Redshift `dimension.player`;
`customer_id_legacy = -1`; no Redshift gold history union. Authoritative gate is
still DEV Glue reload + `deposit_limit_history.yaml` vs SQL Server.

## Validation (prod gold)

- Window: **1 month** (lock bounds when running)
- Acceptable match rate: **≥ 90%**
- Profile: `mappings/complex_dims/deposit_limit_history.yaml`

## Out of scope

- No production Glue job edit from this folder alone
- No SQL Server object edits
- No prod deploy / backfill until explicitly approved
