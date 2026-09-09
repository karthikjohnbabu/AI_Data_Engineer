## 🤖 AI Code Review — `local` · DE-9570 (uncommitted tip)

> Local rehearsal of Jenkins `dp-ai-code-review`. Advisory only.

### Summary

Single-line filter change: exclude Oddsking (`OK%`) accounts on the Iceberg
read, matching legacy SharePoint proc and sibling CDD dimension job. No TF
change. Sowmiya confirmed other Critical/Medium items already resolved in DEV.

### Checklist

| Area | Status | Notes |
|------|--------|-------|
| C1 OK% exclusion | ✅ | `account_number NOT LIKE 'OK%'` on source read |
| Reuse / siblings | ✅ | Same predicate as `cdd_risk_assessment_reporting_data` |
| `delete_from_redshift` / concurrency | ✅ | N/A — job uses MERGE only; TF already `max_concurrent_runs = 1` |
| Shared Spark / catalog | ✅ | Unchanged — `configure_spark` |
| INNER JOIN silent deletes | ⚠️ | Player enrich LEFT JOIN; NODATA exit if zero player hits — pre-existing, out of scope |
| Testing evidence | ⚠️ | DEV had 0 OK% rows pre-fix; post-deploy smoke + optional compare |
| TF / primary_keys | ✅ | Unchanged — `shpt_viphospitality_costing_id` |

### Issues & Concerns

- **[LOW] `uk_digital_dimension_vip_hospitality_costing.py:166-179` — NODATA when no player match**  
  Pre-existing: batch exits NODATA if Redshift player fetch empty despite LEFT JOIN design. Not introduced by this PR.  
  **💡 Suggestion:** Follow-up ticket if unmatched accounts should still sync.

- **[LOW] Docstring claims `sgp_player_id` enrich**  
  Pre-existing drift vs tip SELECT (no `sgp_player_id` on gold). Out of scope; Sowmiya closed other items.

### Questions

- Is a full `compare.py` run required for close, or OK% filter + Glue smoke sufficient per Sowmiya?

### Recommendation

**✅ APPROVE** — C1 fix is minimal, correct, and aligned with legacy + siblings. No open HIGH/MEDIUM from this diff.

---
<sub>Re-run after commit. On Bitbucket: `/ai-review` on PR.</sub>
