# Devil’s advocate unit test — `vip_hospitality_costing` (DE-9570)

**Ticket:** [DE-9570](https://betfred.atlassian.net/browse/DE-9570)  
**Branch:** `feature/de-9570-dimension-vip-hospitality-costing` (`713f8ccf`)  
**Glue job:** `uk_digital_dimension_vip_hospitality_costing`  
**Compare profile:** `mappings/complex_dims/vip_hospitality_costing.yaml` (aggregate by `event_name` + `event_date`)  
**Last updated:** 2026-09-02 (post DEV validation)

---

## RED ALERT

**None.** SQL Server has rows for this table; DEV gold populated as expected. Not a legacy-history-wipe case.

---

## Business-logic card (L0)

| Field | Detail |
|---|---|
| **Domain** | VIP hospitality costing — SharePoint event spend per player (tickets, extras) |
| **Grain** | One row per SharePoint list item (`VIPHospitalityCostingBK` = list `ID`) |
| **Must never load** | Oddsking accounts (`AccountNumber` / `account_number` starting `OK%`) |
| **Legacy filter** | `usp_etl_table_transform_1_Sharepoint_VIPHospitalityCosting` — `NOT LIKE 'OK%'` + migration guard |
| **Silent failure mode** | INNER JOIN to player drops rows without error (legacy dimension view); Glue uses LEFT JOIN |
| **Consumers** | Reporting on VIP event spend by player/event |

---

## Jira findings — fixed?

| Sev | Finding | Status | Proof |
|---|---|---|---|
| Critical | C1 — Missing `OK%` exclusion | **FIXED** | Iceberg read `AND account_number NOT LIKE 'OK%'` ~L123–124; sibling CDD job + legacy proc |
| Critical | FullName / Username | **CLOSED (pre-fix)** | DEV gold: `username`, `full_name` populated — Sowmiya 2026-09-01 |
| Critical | AccountNumber dropped | **CLOSED (pre-fix)** | DEV gold: `account_number` populated — Sowmiya |
| Medium | AccountNumber trim | **CLOSED (pre-fix)** | `trim(account_number)` on read — Sowmiya |

---

## L1 §M (Glue ↔ TF)

| Check | Result |
|---|---|
| `delete_from_redshift`? | **No** — MERGE only via `redshift_sync` |
| `max_concurrent_runs = 1`? | **Yes** — already on TF |
| Agentic TF walk | No TF change in this PR |

---

## L4 AI code review

See `ai_code_review.md` — **APPROVE** (no open HIGH/MEDIUM).

---

## Validation results (mandatory)

### Compare pair

| Run | Pair | Date |
|---|---|---|
| DEV gate | test SQL Server (`BGB-BT` / `EnterpriseDataMartUnity`) → DEV Redshift (`uk_digital.dimension.vip_hospitality_costing`) | 2026-09-01 |
| Prod spot-check | Same SQL → prod Redshift (counts + BK only) | 2026-09-01 |

**Ticket scope validated:** OK% exclusion only. Other Criticals closed in DEV before this change.

### Row counts

| Source | Table / layer | Rows | BK range | Notes |
|---|---|---:|---|---|
| Test SQL | `Dimension.VIPHospitalityCosting` | **295** | 561–1,338 | INNER JOIN `Player` (compare target) |
| Test SQL | `Sharepoint.VIPHospitalityCosting` (Unity) | **298** | 561–1,338 | Staging; 0 `OK%` |
| Test SQL | `Sharepoint.VIPHospitalityCosting` (EDW) | **937** | 3–1,335 | Fuller BT copy |
| Test SQL | `Sharepoint.VIPHospitalityCosting` (Staging) | **0** | — | Empty on BT |
| DEV | `dimension.vip_hospitality_costing` | **1,311** | 3–1,338 | 0 `OK%` |
| Prod | `dimension.vip_hospitality_costing` | **1,311** | 3–1,338 | 0 `OK%` |
| Prod | Iceberg `shpt_viphospitality_costing` (excl `OK%`) | **1,309** | 3–1,338 | Glue source |

**Row-count ratio (dimension):** 295 ÷ 1,311 = **22.5%** — looks like a migration failure; **is not** (see BK section below).

### Business key overlap (`VIPHospitalityCostingBK` = `viphospitality_costing_bk`)

| Metric | DEV | Prod (spot-check) |
|---|---:|---:|
| Test SQL staging BKs | 298 | 298 |
| Warehouse BKs | 1,311 | 1,311 |
| **Intersection (SQL BKs found in warehouse)** | **298 / 298 (100%)** | **298 / 298 (100%)** |
| SQL-only BKs | **0** | **0** |
| Warehouse-only BKs | **1,013** | **1,013** |
| Test EDW BKs found in warehouse | **937 / 937 (100%)** | — |
| Warehouse-only vs EDW | **374** | — |

**Attribute match on all 298 shared BKs:** `event_name` **100%**, `account_number` **100%**.

**Duplicate MERGE keys:** **None** — `COUNT(*) = COUNT(DISTINCT viphospitality_costing_bk)` on DEV and prod.

### Count mismatch — justification (why 295 ≠ 1,311)

| # | Cause | Evidence |
|---|---|---|
| 1 | **Test Unity is a partial SharePoint snapshot** | Unity staging has only **298** of **1,311** SharePoint IDs (BK ≥ 561). Prod/AWS ingests the **live SharePoint SPSQL feed** with full list history (BK 3–1,338). |
| 2 | **Not watermark / duplicate / wrong BK mapping** | Every test-SQL BK exists in DEV with matching attributes; distinct BK count equals row count. |
| 3 | **Test EDW is also incomplete vs prod** | EDW has **937** rows — all present in DEV; DEV has **374** additional live SharePoint records never loaded into test EDW. |
| 4 | **295 vs 298 (dimension vs staging)** | Legacy dimension view **INNER JOIN** `Dimension.Player` drops **3** rows (2 no player match). Glue **LEFT JOIN** keeps costing rows without player. |
| 5 | **Not in scope for DE-9570** | Row-count parity is a **test-environment data coverage** issue, not the OK% filter. Sowmiya: filter-only close OK. |

**BK bucket split (DEV/prod):**

| BK range | Rows in warehouse | In test Unity? |
|---|---:|---|
| &lt; 561 | 533 | No |
| 561–1,338 | 778 | 298 of 778 |
| &gt; 1,338 | 0 | — |

### Aggregate compare (profile grain: `event_name` + `event_date`)

| Metric | SQL dimension | DEV |
|---|---:|---:|
| Aggregate groups | **77** | **320** |
| SQL groups also in DEV | **75 / 77 (97.4%)** | — |

Aggregate totals diverge on shared events because DEV has **more player-rows per event** (extra BKs not in test SQL). Formal `compare.py` not run — profile maps `PlayerID → sgp_player_id` which **does not exist on gold** (profile fix deferred).

### Smoke checks (DEV)

| Check | Result |
|---|---|
| Jenkins `dev` apply | **Complete** (2026-09-01) |
| Gold DROP / reload | **No** — forward-only filter; gold already clean |
| `COUNT(*) WHERE UPPER(account_number) LIKE 'OK%'` | **0** |
| `account_number`, `username`, `full_name` | Populated |
| DynamoDB watermark | Last SUCCESS 2026-08-26; NODATA since (no new SharePoint rows) — expected |
| Glue job | SUCCESS after deploy |

### DEV validation verdict

| Gate | Result |
|---|---|
| OK% exclusion (ticket scope) | **PASS** |
| BK overlap on test SQL | **PASS** (298/298) |
| Row-count parity SQL vs DEV | **N/A / documented** — partial test snapshot; not blocking |
| Block PR to `main`? | **No** |

Jira DEV validation comment posted 2026-09-01.

---

## Extra issues — board list

| Sev | Area | Business impact | Board? | Action |
|---|---|---|---|---|
| LOW | Compare profile | `sgp_player_id` mapped but not on gold — blocks formal compare | No | Fix profile separately |
| LOW | Test SQL data | Unity/EDW lag live SharePoint — row % misleading | No | Document in validation (done) |
| — | — | — | — | — |

---

## Block PR / commit / deploy?

**No** — ticket scope PASS; DEV validation complete; ready for PR to `main`.

**Board candidates:** None.

---

## Post-PR / prod (not yet run)

| Step | Status |
|---|---|
| PR feature → `main` | Pending |
| Prod Glue ≥2× (defaults) | Pending |
| Post-deploy prod validation (test SQL → prod RS) | Pending |
| Prod cleanup | **Not required** — prod 0 `OK%` (2026-09-01) |
