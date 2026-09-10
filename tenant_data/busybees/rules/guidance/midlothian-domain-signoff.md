# New Midlothian domain sign-off

Copy the child/parent pattern fully before calling a domain complete:

1. Run `{env}-midln-{domain}-workflow` (full Step Function), not the Glue job alone.
2. Confirm `midlothian/curated/{domain}/` is empty and CSVs are in archive.
3. DEV: EventBridge S3 Object Created trigger `dev-midln-{domain}-curated-s3-trigger`.
4. UAT: matching S3 triggers; CDK daily crons stay DISABLED.
5. DEV Glue JobMode = NOTEBOOK, role `dev-midln-data-lake-role`.
