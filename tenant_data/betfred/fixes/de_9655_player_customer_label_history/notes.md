# DE-9655 — working notes

## Status: **BLOCKED** (2026-09-03)

Parked while picking up DE-9549. Resume when:

1. DE-9563 prod incremental delta proven (label change expires old row), and/or  
2. Nathan / Andrew walkthrough for SQL extract → curated merge is scheduled.

## One-liner

Backfill **pre–July 2025** into curated `sgp_player_customer_label`, then full gold reload + BK validation.

See triage: `dimensions/in_progress/de_9655_player_customer_label_history.md`


## Key configs (already in repo)

**Reload from SQL extract (use for historic):**

`data-platform-glue-etl-customer/migration-config/reload/sgp_player_customer_label.json`

- Source S3: `sql-server-extraction/PlayerCustomerLabel`
- Target: `{env}_dp_dwh_uk_digital.sgp_player_customer_label`
- PK merge: `player_bk, customer_label_bk, date_last_modified`
- `ds_platform`: `EDW`

**Live CDC (Jul 2025+):**

`transactional-config/uk/digital/SGP/franchisedb/sgp_player_customer_label.json`

- Source: `players_customer_labels` (franchisedb)
- PK: `player_bk, customer_label_bk` (no `date_last_modified` in key — watch dedup)

## SQL extract job

- Glue: `prod-sql-server-extraction` (etl-common Terraform)
- Console: see DE-9655 Jira resources
- **Ask before prod run** — index / storage impact called out in ticket

## DE-9563 prod health (2026-09-02)

```text
total_rows:           4,361,050
is_current='Y':       4,361,027
distinct player_bk:   4,361,026
players w/ >1 Y:      1
```

Interpretation: gold looks like **bulk initial load** (almost every row still current). Historic backfill + full reload likely required; incremental fix may only show on **new** label changes after deploy.

## Suggested first actions for Prasath

1. Comment on DE-9655: triage complete, blocked on DE-9563 prod delta proof + Nathan/Andrew walkthrough.
2. With Ben: confirm who runs extract vs who owns curated merge.
3. Pick one prod player with label change post–DE-9563 deploy — validate expiry SQL.
4. Do **not** start prod extract without storage/index sign-off.

## Compare (when ready)

```bash
cd data-platform-migration-data-test
cp .env.dev .env   # or .env.prod for post-deploy
python compare.py --profile mappings/complex_dims/player_customer_label_history.yaml \
  --start 2024-01-01 --end 2024-12-31
```

BK: `player_bk`, `customer_label_bk`, `start_date` — always report intersection in validation.
