# Never touch PROD

Busy Bees Midlothian work is DEV then UAT only. Do not run Glue jobs, edit Delta tables, change triggers, or deploy scripts in PROD.

Existing guard: `prod-delete-approval` still requires human approval for drop / truncate / delete. This rule covers any other PROD mutation.
