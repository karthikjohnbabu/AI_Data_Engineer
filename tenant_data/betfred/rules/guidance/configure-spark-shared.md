# Shared `configure_spark` (Glue jobs)

When editing or reviewing Glue Python in
`data-platform-glue-etl-transactional-data-jobs` (**dimensions, facts, gold,
enrichment** — any job that builds a `SparkConf`):

## Do

- Import from the common library:

```python
from utilities.glue_spark_config import configure_spark, create_glue_runtime

conf = configure_spark()
runtime = create_glue_runtime(conf)
spark, glueContext, job = runtime.spark, runtime.glue_context, runtime.job
```

- Prefer `create_glue_runtime(conf)` over legacy `init_spark(conf=...)`.
- If a setting is **job-specific** and not in the shared defaults, pass it via
  `extra_conf={...}` only after comparing against
  `data-platform-glue-etl-common` `utilities.glue_spark_config` /
  `docs/utilities/configure_spark.md`.
- Tell the user what (if anything) goes in `extra_conf` and **ask permission**
  before applying.

## Catalog name (TF only — never a manual run override)

`configure_spark` registers the Iceberg catalog as **`awsdatacatalog`**
(lowercase). Terraform `--catalog_name` and SQL like
`{catalog_name}.{env}_dp_dwh_…` must use that same string.

Using `AwsDataCatalog` with shared `configure_spark` fails at runtime with
`REQUIRES_SINGLE_PART_NAMESPACE` / `spark_catalog requires a single-part
namespace`. Sibling pattern: `uk_digital_dimension_deposit_limit_history.tf`
uses `awsdatacatalog`.

**Fix in TF + Jenkins apply.** Do **not** paper over with Glue console
Default parameters or `start-job-run --arguments` — see rule
`glue-no-manual-job-param-overrides`.

## Don't

- Do **not** define a local `def configure_spark()` / hand-rolled `SparkConf`
  with Iceberg catalog, AQE, parquet rebase, UTC, etc. — those are shared
  defaults and scale by Glue worker type (G.1X, G.2X, …).
- Do **not** copy-paste sibling jobs' old local conf blocks into new work.
- Do **not** put this rule under any sibling git repo’s `.cursor/` — skills
  and rules live only under workspace `Cursor/.cursor/`.
- Do **not** leave `--catalog_name = "AwsDataCatalog"` on jobs that call
  `configure_spark`.
- Do **not** “fix” catalog mismatches by manually changing job parameters
  for one run.

## Reference pattern

Sibling already migrated: `uk_digital_dimension_time_spent.py`,
`uk_digital_dimension_deposit_limit_history.py` (DE-9556 Dom review).
