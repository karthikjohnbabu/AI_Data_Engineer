import type { Ticket, TicketDetail } from "@/types";

export const tickets: Ticket[] = [
  {
    id: "UKDATA-4821",
    summary: "Glue job timeout on uk_digital_dimension load",
    status: "In Review",
    agentStatus: "Awaiting Review",
    confidence: 91,
    pr: "#422",
    environment: "UAT",
    priority: "High",
    assignee: "AI Agent",
    createdAt: "2026-08-28T09:15:00Z",
  },
  {
    id: "UKDATA-4819",
    summary: "Redshift SCD2 merge failing on customer_dim",
    status: "Done",
    agentStatus: "PR Merged",
    confidence: 96,
    pr: "#418",
    environment: "Prod",
    priority: "Critical",
    assignee: "AI Agent",
    createdAt: "2026-08-27T14:30:00Z",
  },
  {
    id: "UKDATA-4815",
    summary: "Schema drift detected in iceberg silver layer",
    status: "In Progress",
    agentStatus: "Investigating",
    confidence: 75,
    pr: null,
    environment: "Dev",
    priority: "Medium",
    assignee: "AI Agent",
    createdAt: "2026-08-27T11:00:00Z",
  },
  {
    id: "UKDATA-4812",
    summary: "Databricks job OOM on large partition aggregation",
    status: "In Progress",
    agentStatus: "Generating Fix",
    confidence: 82,
    pr: "#420",
    environment: "Dev",
    priority: "High",
    assignee: "AI Agent",
    createdAt: "2026-08-26T16:45:00Z",
  },
  {
    id: "UKDATA-4808",
    summary: "Data reconciliation mismatch in daily sales report",
    status: "Failed",
    agentStatus: "Failed",
    confidence: 45,
    pr: null,
    environment: "UAT",
    priority: "High",
    assignee: "AI Agent",
    createdAt: "2026-08-26T10:20:00Z",
  },
  {
    id: "UKDATA-4803",
    summary: "Watermark not advancing on incremental load pipeline",
    status: "Done",
    agentStatus: "Completed",
    confidence: 94,
    pr: "#415",
    environment: "Prod",
    priority: "Medium",
    assignee: "AI Agent",
    createdAt: "2026-08-25T08:00:00Z",
  },
  {
    id: "UKDATA-4799",
    summary: "Terraform drift in Glue connection configuration",
    status: "In Review",
    agentStatus: "Awaiting Review",
    confidence: 88,
    pr: "#413",
    environment: "UAT",
    priority: "Low",
    assignee: "AI Agent",
    createdAt: "2026-08-24T13:15:00Z",
  },
  {
    id: "UKDATA-4795",
    summary: "PySpark UDF performance degradation in loyalty pipeline",
    status: "Done",
    agentStatus: "PR Merged",
    confidence: 93,
    pr: "#410",
    environment: "Prod",
    priority: "Medium",
    assignee: "AI Agent",
    createdAt: "2026-08-23T09:30:00Z",
  },
];

export const ticketDetails: Record<string, TicketDetail> = {
  "UKDATA-4821": {
    ...tickets[0],
    description:
      "The uk_digital_dimension Glue job is timing out after 120 minutes during the daily load. Affects downstream reporting for digital channel analytics.",
    rootCause:
      "The Glue job's default timeout of 120 minutes is insufficient for the increased data volume following the Q3 schema expansion. The job processes 8.4M rows with a complex SCD2 merge that now includes 3 additional columns, pushing execution time beyond the configured limit.",
    impact: {
      level: "Medium",
      filesAffected: 2,
      tablesAffected: 1,
      blastRadius: "Low",
    },
    timeline: [
      {
        id: "1",
        label: "Jira analysed",
        status: "completed",
        timestamp: "2026-08-28T09:16:00Z",
        description: "Ticket parsed and classified as Glue performance issue",
      },
      {
        id: "2",
        label: "Architecture loaded",
        status: "completed",
        timestamp: "2026-08-28T09:17:00Z",
        description: "UK Digital data platform architecture retrieved from memory",
      },
      {
        id: "3",
        label: "Repository identified",
        status: "completed",
        timestamp: "2026-08-28T09:18:00Z",
        description: "uk-data-platform repo, branch: main",
      },
      {
        id: "4",
        label: "Memory searched",
        status: "completed",
        timestamp: "2026-08-28T09:19:00Z",
        description: "Found 3 similar incidents from past 6 months",
      },
      {
        id: "5",
        label: "Root cause identified",
        status: "completed",
        timestamp: "2026-08-28T09:22:00Z",
        description: "Timeout configuration insufficient for current data volume",
      },
      {
        id: "6",
        label: "Fix generated",
        status: "completed",
        timestamp: "2026-08-28T09:28:00Z",
        description: "Increased timeout + added partition pruning optimization",
      },
      {
        id: "7",
        label: "Tests executed",
        status: "completed",
        timestamp: "2026-08-28T09:35:00Z",
        description: "18/18 tests passed in DEV environment",
      },
      {
        id: "8",
        label: "PR created",
        status: "completed",
        timestamp: "2026-08-28T09:38:00Z",
        description: "PR #422 created against main branch",
      },
      {
        id: "9",
        label: "Deployment validated",
        status: "in_progress",
        timestamp: null,
        description: "Awaiting UAT deployment approval",
      },
    ],
    impactedFiles: [
      {
        path: "glue/jobs/uk_digital_dimension_timeout.py",
        changeType: "modified",
        linesAdded: 12,
        linesRemoved: 3,
      },
      {
        path: "glue/config/uk_digital_dimension.json",
        changeType: "modified",
        linesAdded: 4,
        linesRemoved: 2,
      },
    ],
    codeChanges: [
      {
        file: "glue/jobs/uk_digital_dimension_timeout.py",
        language: "python",
        diff: `@@ -45,7 +45,12 @@ def main():
-    job.init(args['JOB_NAME'], args)
-    spark = glueContext.spark_session
+    job.init(args['JOB_NAME'], args)
+    spark = glueContext.spark_session
+    
+    # Enable adaptive query execution for large datasets
+    spark.conf.set("spark.sql.adaptive.enabled", "true")
+    spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
 
@@ -78,6 +83,10 @@ def process_dimension():
-    df = spark.read.parquet(source_path)
+    # Partition pruning: filter to current processing window
+    df = spark.read.parquet(source_path) \\
+        .filter(col("processing_date") >= watermark_date)
+    
+    logger.info(f"Processing {df.count()} rows after partition pruning")
 
@@ -120,4 +129,6 @@ if __name__ == "__main__":
     process_dimension()
     job.commit()
+    
+# Timeout increased to 180 minutes in job config`,
      },
    ],
    testResults: [
      {
        id: "t1",
        name: "test_dimension_load_completes_within_timeout",
        type: "Unit",
        environment: "Dev",
        status: "passed",
        duration: "4.2s",
      },
      {
        id: "t2",
        name: "test_partition_pruning_reduces_row_count",
        type: "Unit",
        environment: "Dev",
        status: "passed",
        duration: "2.8s",
      },
      {
        id: "t3",
        name: "test_scd2_merge_integrity",
        type: "Integration",
        environment: "Dev",
        status: "passed",
        duration: "18.5s",
      },
      {
        id: "t4",
        name: "test_row_count_reconciliation",
        type: "Data Quality",
        environment: "Dev",
        status: "passed",
        duration: "12.1s",
      },
      {
        id: "t5",
        name: "test_schema_compatibility",
        type: "Data Quality",
        environment: "Dev",
        status: "passed",
        duration: "3.4s",
      },
    ],
    dataValidation: [
      { name: "Row Count Check", value: "8.49M rows", status: "passed" },
      { name: "Schema Check", value: "23 columns", status: "passed" },
      { name: "Data Quality Check", value: "100%", status: "passed" },
      { name: "Reconciliation Check", value: "100%", status: "passed" },
    ],
    deployments: [
      {
        stage: "Dev",
        status: "completed",
        approvedBy: "Auto-deploy",
        timestamp: "2026-08-28T09:40:00Z",
      },
      {
        stage: "UAT",
        status: "in_progress",
        approvedBy: null,
        timestamp: null,
      },
      { stage: "Prod", status: "pending", approvedBy: null, timestamp: null },
      {
        stage: "Validation",
        status: "pending",
        approvedBy: null,
        timestamp: null,
      },
    ],
  },
};
