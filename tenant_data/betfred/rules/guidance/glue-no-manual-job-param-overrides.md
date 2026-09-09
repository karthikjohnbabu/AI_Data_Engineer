# Glue jobs — no manual parameter overrides

When starting, restarting, or debugging a Glue job (DEV / test / prod):

## Hard rule

**Do not** change job behaviour by editing Default parameters in the Glue
console, or by passing `--arguments` / overrides on `aws glue start-job-run`.

That includes (not exhaustive): `--catalog_name`, worker count, execution
class, connections, script path, `--extra-py-files`, watermarks passed as
job args, or any other DefaultArguments key.

## Correct path

1. Fix the value in **Terraform** (`tf/*.tf` `default_arguments`) and/or the
   **Glue `.py` script**.
2. Commit → push → **Jenkins plan/apply** for that environment.
3. Only then: run the job with **defaults** (console Run, or
   `start-job-run` with **no** `--arguments` override).

## Why

Manual overrides leave AWS out of sync with the repo. The next scheduled or
colleague run uses the broken defaults again. Session_history
(`AwsDataCatalog` vs `awsdatacatalog` after `configure_spark`) is the
worked example — the fix belongs in TF, not a one-off run argument.

## Agent behaviour

- **Never** call `aws glue start-job-run ... --arguments ...` to paper over
  a bad default.
- **Never** tell the user to edit Default parameters in the console for a
  permanent fix.
- If a run fails because of a wrong default: patch TF/code, say so, wait for
  apply; do not offer a manual override as the solution.
- Watermark / gold DROP (DEV reload gate) stays on Redshift Data API +
  DynamoDB as today — that is not a Glue job-parameter override.

## Related

- `configure-spark-shared` — catalog must be `awsdatacatalog` in TF when
  using shared `configure_spark`
- `dimension-watermark-reset` — reload gate; do not start Glue with overrides
- `git-repo-scope` — commit/push only the data-jobs repo unless named
