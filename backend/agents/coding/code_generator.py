"""Code fix generator (rule-based templates; LLM-ready later)."""

CODE_TEMPLATES: dict[str, list[dict]] = {
    "glue_timeout": [
        {
            "file": "glue/jobs/uk_digital_dimension_timeout.py",
            "language": "python",
            "diff": (
                "@@ -45,7 +45,12 @@ def main():\n"
                "-    spark = glueContext.spark_session\n"
                "+    spark = glueContext.spark_session\n"
                "+    spark.conf.set('spark.sql.adaptive.enabled', 'true')\n"
                "+    spark.conf.set('spark.sql.adaptive.coalescePartitions.enabled', 'true')\n"
                "@@ -78,6 +83,10 @@ def process_dimension():\n"
                "-    df = spark.read.parquet(source_path)\n"
                "+    df = spark.read.parquet(source_path) \\\n"
                "+        .filter(col('processing_date') >= watermark_date)\n"
            ),
        }
    ],
    "redshift_scd": [
        {
            "file": "sql/scd2/customer_dim_merge.sql",
            "language": "sql",
            "diff": (
                "@@ -12,4 +12,8 @@ MERGE INTO customer_dim\n"
                "+  -- Added distribution key hint to reduce skew\n"
                "+  SET query_group TO 'etl_queue';\n"
                "   WHEN MATCHED AND src.hash_key != tgt.hash_key THEN UPDATE SET\n"
            ),
        }
    ],
    "schema_drift": [
        {
            "file": "iceberg/silver/events_table.py",
            "language": "python",
            "diff": (
                "@@ -20,3 +20,7 @@ schema = StructType([\n"
                "+    StructField('new_column', StringType(), True),\n"
                "+])\n"
                "+# Schema evolution: nullable column added with compatibility check\n"
            ),
        }
    ],
    "databricks_oom": [
        {
            "file": "notebooks/loyalty_aggregation.py",
            "language": "python",
            "diff": (
                "@@ -55,4 +55,8 @@ def aggregate_loyalty():\n"
                "-    result = df.groupBy('customer_id').agg(F.sum('points'))\n"
                "+    # Broadcast small dimension to avoid shuffle OOM\n"
                "+    result = df.join(F.broadcast(dim_df), 'customer_id') \\\n"
                "+               .groupBy('customer_id').agg(F.sum('points'))\n"
            ),
        }
    ],
    "reconciliation": [
        {
            "file": "pipelines/daily_sales_recon.py",
            "language": "python",
            "diff": (
                "@@ -30,4 +30,7 @@ def reconcile():\n"
                "-    watermark = get_watermark('sales')\n"
                "+    # Include 2-hour grace window for late-arriving records\n"
                "+    watermark = get_watermark('sales') - timedelta(hours=2)\n"
            ),
        }
    ],
    "watermark": [
        {
            "file": "pipelines/incremental_load.py",
            "language": "python",
            "diff": (
                "@@ -88,4 +88,8 @@ def commit_watermark():\n"
                "-    update_watermark(max_processed_date)\n"
                "+    # Only advance watermark after successful commit\n"
                "+    if job_status == 'SUCCEEDED':\n"
                "+        update_watermark(max_processed_date)\n"
            ),
        }
    ],
    "terraform": [
        {
            "file": "terraform/glue_connections.tf",
            "language": "hcl",
            "diff": (
                "@@ -15,3 +15,6 @@ resource \"aws_glue_connection\" \"redshift\" {\n"
                "+  connection_properties = {\n"
                "+    JDBC_CONNECTION_URL = var.redshift_jdbc_url\n"
                "+  }\n"
            ),
        }
    ],
    "pyspark_perf": [
        {
            "file": "spark/loyalty_udf.py",
            "language": "python",
            "diff": (
                "@@ -10,5 +10,8 @@ def loyalty_score_udf(x):\n"
                "-    return x * 1.5  # Python UDF - slow\n"
                "+# Replaced Python UDF with native Spark SQL expression\n"
                "+df = df.withColumn('loyalty_score', col('points') * 1.5)\n"
            ),
        }
    ],
}


def generate_fix(classification_id: str, impacted_files: list[dict]) -> list[dict]:
    """Generate proposed code changes for a classification."""
    if classification_id in CODE_TEMPLATES:
        return CODE_TEMPLATES[classification_id]

    if impacted_files:
        return [
            {
                "file": impacted_files[0]["path"],
                "language": "python",
                "diff": "@@ -1,3 +1,5 @@\n # Agent-generated fix pending LLM integration\n+# TODO: apply targeted patch\n",
            }
        ]
    return []
