## 🤖 AI Code Review — `ee534bd9` · local (Cursor)

> Local rehearsal of Jenkins `dp-ai-code-review` (Claude via AWS Bedrock on CI).
> Advisory only — complements human review and CI. Not posted to Bitbucket.

### Summary

DE-9567 correctly fixes session pairing (next logout before next login), adds the
2-hour watermark buffer, mirrors legacy per-player DELETE+INSERT via shared
`delete_from_redshift`, and aligns Spark bootstrap / catalog with sibling dims.
DEV Place 2 evidence (99.71% logout match, 0 SQL-only) supports merge. One
deploy-time concern: `delete_from_redshift` shares a fixed staging table name,
but Terraform still allows high `max_concurrent_runs` — same class of bug
`time_spent` documents with `max_concurrent_runs = 1`.

### Checklist

| Area | Status | Notes |
|------|--------|-------|
| Correctness / pairing | ✅ | `pair_logins_to_logouts` bounds logout between login and `lead(Login)`; fixes C2 MAX-logout bug |
| DELETE+INSERT grain (C1) | ✅ | Delete on batch `player_bk`, MERGE on `bvt_action_id` per TF |
| Watermark / 2h buffer (M1) | ✅ | `data_fetch_delay_in_minutes=120` on `get_last_success_time` |
| INNER JOIN silent deletes | ⚠️ | `sgp_player` INNER — legacy parity; documented in PR |
| Shared Spark / catalog | ✅ | `configure_spark` + TF `awsdatacatalog` |
| Reuse utilities | ✅ | `delete_from_redshift`, `redshift_sync`, `redshift_recreate` — no hand-rolled Redshift I/O |
| Gold missing path | ✅ | `check_target_table_exists` → `redshift_recreate`; skip delete when absent |
| Deploy / DDL | ⚠️ | New `sgp_player_id` needs prod DROP+reload or Liquibase before first prod run |
| Concurrent runs + delete | ❌ | `staging_delete_session_history` not run-safe if two jobs overlap |
| Testing evidence | ✅ | Place 1 + Place 2 in PR; PROD plan + Place 3 post-merge noted |
| Job rename / watermark | ✅ | No rename |
| EventBridge order | ✅ | No rule changes in PR |

### Issues & Concerns

- **[MEDIUM] `tf/uk_digital_dimension_session_history.tf:51-52` — concurrent runs unsafe with `delete_from_redshift`**  
  `delete_from_redshift` stages keys in a fixed table `staging_delete_session_history` (see etl-common `redshift_delete.py`). Two overlapping runs can truncate each other's staging keys, so DELETE matches nothing while MERGE still appends — duplicate or inconsistent sessions. `uk_digital_dimension_time_spent.tf` sets `max_concurrent_runs = 1` with an explicit comment for this reason; session_history still uses `var.dimension_builder_max_concurrent_runs` (default **100**).  
  **💡 Suggestion:** Set `max_concurrent_runs = 1` on this Glue job (same as time_spent) now that C1 uses delete staging.

- **[LOW] `uk_digital_dimension_session_history.py:221` — `toPandas()` for wipe keys**  
  Distinct `player_bk` for the incremental window is collected on the driver before `delete_from_redshift`. Acceptable for typical 2-hour batches; very large player fan-out could pressure driver memory. Same pattern as other delete callers; monitor after prod reload.  
  **💡 Suggestion:** Optional follow-up — chunk deletes if prod metrics show driver pressure (not a merge blocker if schedules stay serial).

- **[LOW] `uk_digital_dimension_session_history.py:150-168` — broad `except Exception` in `check_target_table_exists`**  
  Transient Redshift errors return `False` and route to `redshift_recreate`, which may mis-handle “table exists but unreadable”. Matches `deposit_limit_history` sibling pattern.  
  **💡 Suggestion:** Log exception at debug/warn before returning `False` (follow-up only).

- **[LOW] `uk_digital_dimension_session_history.py:209` — INNER JOIN `sgp_player` after DELETE scope**  
  `players_to_wipe` is built from `player_logs_df` before the INNER JOIN. Players with BVT events but missing from `sgp_player` lose all gold rows with no re-insert — same as legacy `Sharp.Player` join.  
  **💡 Suggestion:** None if parity is intentional (documented in PR reviewer notes).

### Questions

- Will prod reload follow the PR post-merge ops (DROP + epoch watermark), or is a Liquibase `ALTER` for `sgp_player_id` planned without DROP?
- Are manual re-runs of this job ever triggered while a scheduled run is in flight? If yes, `max_concurrent_runs = 1` is more urgent.

### Recommendation

**❌ REQUEST CHANGES** — address **MEDIUM** concurrent-runs / delete staging (one-line TF change). Everything else is acceptable for merge with documented deploy ops and validation contract.

---
<sub>Re-run this skill after fixes. On Bitbucket: comment `/ai-review` then re-run Jenkins PR job.</sub>
