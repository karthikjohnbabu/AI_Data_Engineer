# Legacy parity verification (from DE-9558 method)

When proving a migrated Glue dimension/fact matches its legacy SQL Server
proc, prefer **live outputs** over reading two scripts side by side. Origin:
team method used on DE-9558 (login retry); apply to other dims including
DE-9556-style work.

## 1. Re-implement, don't argue

Port the proc's CTE chain into Athena (or an equivalent engine) over the
**same source**, applying only deliberate key-space translations. Compare to
what the job wrote in Redshift.

- A **grouped distribution** can match while rows are mis-assigned.
- Prefer a **per-row checksum** (weighted sum of entity + measure columns)
  plus counts. Matching count **and** checksum is strong proof.
- Confirm the source was **static** for the window
  (`MAX(ds_tsprocessed)` vs when gold was written) or the compare is void.

`compare.py` presence / attribute checks remain the day-to-day gate for many
dims; escalate to Athena re-implement + checksum when the bug is logic/key
space (not just missing rows).

## 2. Surrogate vs business key (silent wrong)

SQL Server often has `<Thing>ID` (IDENTITY surrogate) and `<Thing>BK`
(source key). A port that filters `WHERE id = 4` but reads `_bk` **never
errors**; row counts may be unchanged.

- Never infer the mapping — read both reference tables (description match).
- Ask: does the old literal even exist in the new key space? If not, the
  branch was **unreachable** (stronger finding).
- Check **DEV and prod** Iceberg/reference — env drift voids DEV-only
  conclusions.

## 3. Green run on empty table ≠ full job evidence

If the gold table was dropped/empty, the job may take only the **insert**
path (no carry-forward union, no update/MERGE half).

Detect before trusting “ran clean in DEV”:

```sql
SELECT DATE_TRUNC('minute', ds_ts_processed) AS written_at, COUNT(*) AS rows_
FROM <schema>.<table>
GROUP BY 1
ORDER BY 1 DESC;
```

- **One timestamp for the whole table** → rebuild / empty beforehand.
- **Staircase of batches** → genuine incremental MERGEs.
- Glue `current_timestamp()` is UTC; Redshift often stores it naive —
  BST offset can look like a mystery writer.

## 4. Correctness ≠ repair

“Is the new logic right?” and “will deploy fix existing wrong rows?” need
**separate** tests. Rebuild answers only the first. Incremental jobs often
leave dormant entities wrong until the next source event.

- Call out **backfill / full reload** in the PR when repair needs it.
- For logic under review: synthetic `VALUES` replay of the job CTEs
  (stale / heal-on-event / clean control).

## 5. Cheap checks every time

- INNER JOIN to a reference table: count unmatched (silent deletes).
- Dimension join fan-out: `COUNT(*)` vs `COUNT(DISTINCT bk)`.
- Stored FK resolves against its dimension.
- Row self-consistency `GROUP BY` (invariants with no second system).

## 6. Access traps (parity work)

- Prefer reading the live proc from `sys.sql_modules` on SQL Server; Red Gate
  repo checkouts drift.
- **Related Done tickets** — do not treat closed Jira as the oracle for
  current Glue stubs / mappings; re-read comments + verify live
  (`jira-related-ticket-verify`).
- Redshift DB must be `uk_digital`, not cluster default `betfred`.
- Shell `AWS_PROFILE` overrides `.env` (`load_dotenv` does not replace an
  already-set var). Export the intended profile explicitly for the pair.
- Profile **names** vary by laptop (`dev`/`prod` vs `data-platform-dev` /
  `data-platform-prod`) — check `~/.aws/config`. Still declare the
  **compare pair** (test SQL → DEV RS vs test SQL → prod RS); never prod SQL
  for Prasath's access.
- Glue log group from `get-job-run` is a stem — append `/output` or `/error`.

## Related

- Env pairs: rule `migration-compare-env-pair`
- Workflow detail: skill `dimension-validate`
- INNER JOIN row loss: Glue repo `docs/ETL_DEVELOPMENT.md`
