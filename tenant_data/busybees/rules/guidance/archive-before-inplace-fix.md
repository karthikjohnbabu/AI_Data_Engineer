# Archive before in-place fix

Before changing existing Delta table data, copy it to the archive bucket first: `{env}-bb-famly-migration-archive/midlothian/Analytics/[domain]/`.

This is the rollback safety net. No exceptions.
