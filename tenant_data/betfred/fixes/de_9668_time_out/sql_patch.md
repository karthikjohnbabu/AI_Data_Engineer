# SQL patch (review only) — legacy `DMDimension.Timeout`

**Never apply from this folder. No production SQL edits. No deploy.**

Legacy view (read-only reference):

`data-platform-legacy-enterprisedatawarehouseunity/Views/DMDimension.Timeout.sql`

## Current legacy join (same status-overwrite shape)

```sql
FROM Sharp.Player P
	JOIN Sharp.PlayerDisableReason PDR
		ON P.PlayerDisableReasonBK = PDR.PlayerDisableReasonBK
	JOIN Sharp.PlayerDisabled PD
		ON PD.PlayerBK = P.PlayerBK
		   AND PD.PlayerDisableReasonBK = P.PlayerDisableReasonBK
WHERE
	PDR.PlayerDisableReasonDescription = 'Timeout'
	AND P.IsTest = 0;
```

## Proposed shape for parity review (not applied here)

```sql
FROM Sharp.PlayerDisabled PD
	JOIN Sharp.PlayerDisableReason PDR
		ON PD.PlayerDisableReasonBK = PDR.PlayerDisableReasonBK
	JOIN Sharp.Player P
		ON P.PlayerBK = PD.PlayerBK
WHERE
	PDR.PlayerDisableReasonDescription = 'Timeout'
	AND P.IsTest = 0;
```

If legacy and Glue both used current-status joins, comparing them can **hide** the bug (both wrong the same way). Prefer validating Glue gold against an event-level history definition / fixed comparison query once the Glue patch is accepted.
