"""Seed mock JSON files from Python (mirrors frontend mock data)."""

import json
from pathlib import Path

MOCK_DIR = Path(__file__).parent / "mock"
MOCK_DIR.mkdir(parents=True, exist_ok=True)

SKILLS = [
    {"id": "aws-glue", "name": "AWS Glue", "description": "ETL job authoring, debugging, and optimization for AWS Glue Spark and Python shell jobs.", "category": "AWS", "status": "active", "usageCount": 47, "lastUsed": "2026-08-28T09:15:00Z"},
    {"id": "redshift", "name": "Redshift", "description": "Query optimization, SCD merges, distribution key analysis, and workload management tuning.", "category": "AWS", "status": "active", "usageCount": 38, "lastUsed": "2026-08-27T14:30:00Z"},
    {"id": "iceberg", "name": "Iceberg", "description": "Table format management, schema evolution, partition spec changes, and compaction strategies.", "category": "Data Lake", "status": "active", "usageCount": 22, "lastUsed": "2026-08-27T11:00:00Z"},
    {"id": "pyspark", "name": "PySpark", "description": "Spark job development, UDF optimization, broadcast joins, and partition strategy design.", "category": "Processing", "status": "active", "usageCount": 55, "lastUsed": "2026-08-26T16:45:00Z"},
    {"id": "scd2", "name": "SCD2", "description": "Slowly changing dimension Type 2 implementations, merge logic, and effective date handling.", "category": "Modelling", "status": "active", "usageCount": 31, "lastUsed": "2026-08-27T14:30:00Z"},
    {"id": "watermark", "name": "Watermark Analysis", "description": "Incremental load watermark tracking, gap detection, and recovery procedures.", "category": "Pipeline", "status": "active", "usageCount": 19, "lastUsed": "2026-08-25T08:00:00Z"},
    {"id": "schema-drift", "name": "Schema Drift", "description": "Automated schema change detection, impact analysis, and migration script generation.", "category": "Data Quality", "status": "active", "usageCount": 15, "lastUsed": "2026-08-27T11:00:00Z"},
    {"id": "reconciliation", "name": "Data Reconciliation", "description": "Source-to-target row count validation, checksum comparison, and variance reporting.", "category": "Data Quality", "status": "active", "usageCount": 28, "lastUsed": "2026-08-26T10:20:00Z"},
    {"id": "databricks", "name": "Databricks", "description": "Notebook optimization, job cluster sizing, Delta Lake operations, and Unity Catalog management.", "category": "Platform", "status": "active", "usageCount": 33, "lastUsed": "2026-08-26T16:45:00Z"},
    {"id": "terraform", "name": "Terraform", "description": "Infrastructure as code for data platform resources, drift detection, and module management.", "category": "Infrastructure", "status": "active", "usageCount": 12, "lastUsed": "2026-08-24T13:15:00Z"},
]

MEMORY = [
    {"id": "arch-001", "title": "UK Digital Data Platform — Medallion Architecture", "category": "architecture", "content": "Bronze (raw S3) → Silver (Iceberg, cleaned) → Gold (Redshift, aggregated). All Glue jobs follow naming convention: uk_{domain}_{entity}_{action}. Cross-account access via IAM roles with external ID.", "tags": ["architecture", "medallion", "uk-digital"], "updatedAt": "2026-08-15T10:00:00Z", "source": "Architecture Decision Record #12"},
    {"id": "arch-002", "title": "BBees/Betfred Shared Data Lake Pattern", "category": "architecture", "content": "Client-specific bronze zones with shared silver/gold layers. Tenant isolation via S3 prefix and IAM policies. Databricks Unity Catalog for cross-tenant governance.", "tags": ["betfred", "bbees", "multi-tenant"], "updatedAt": "2026-08-20T14:30:00Z", "source": "Client Onboarding Doc"},
    {"id": "std-001", "title": "Glue Job Timeout Standards", "category": "standards", "content": "Default timeout: 120 min for dimension loads, 60 min for fact loads, 30 min for staging. Jobs processing >5M rows must enable adaptive query execution and partition pruning.", "tags": ["glue", "timeout", "standards"], "updatedAt": "2026-07-10T09:00:00Z", "source": "Engineering Standards v2.3"},
    {"id": "std-002", "title": "SCD2 Implementation Standard", "category": "standards", "content": "Use MERGE with effective_date/end_date columns. Hash key on business key + effective_date. Always include is_current flag. Backfill requires DBA approval.", "tags": ["scd2", "standards", "modelling"], "updatedAt": "2026-06-22T11:00:00Z", "source": "Engineering Standards v2.1"},
    {"id": "inc-001", "title": "UKDATA-4521 — Glue Timeout on customer_dim", "category": "incidents", "content": "Similar root cause: timeout too low after data volume increase. Fix: increased timeout to 180 min + added partition pruning. Resolution time: 35 minutes.", "tags": ["glue", "timeout", "customer_dim"], "updatedAt": "2026-07-18T16:00:00Z", "source": "Incident Post-Mortem"},
    {"id": "inc-002", "title": "UKDATA-4398 — Redshift WLM Queue Saturation", "category": "incidents", "content": "Peak-hour ETL caused WLM queue saturation. Fix: rescheduled non-critical jobs to off-peak + increased query slots for ETL queue.", "tags": ["redshift", "wlm", "performance"], "updatedAt": "2026-06-30T10:00:00Z", "source": "Incident Post-Mortem"},
    {"id": "fix-001", "title": "Partition Pruning for Large Glue Jobs", "category": "fixes", "content": "Add watermark-based date filter before full table scan. Reduces processing time by 60-80% on dimension loads. Template available in glue/templates/partition_prune.py.", "tags": ["glue", "optimization", "partition"], "updatedAt": "2026-07-18T16:30:00Z", "source": "Known Fix Library"},
    {"id": "fix-002", "title": "Iceberg Schema Evolution — Safe Column Add", "category": "fixes", "content": "Use ALTER TABLE ADD COLUMN with nullable default. Never drop columns in production. Run compatibility check against downstream consumers before merge.", "tags": ["iceberg", "schema", "evolution"], "updatedAt": "2026-08-01T09:00:00Z", "source": "Known Fix Library"},
    {"id": "dep-001", "title": "Production Deployment Rules", "category": "deployment", "content": "All prod deployments require: (1) UAT sign-off, (2) data validation pass, (3) rollback plan documented, (4) change window approval for P1 tables. Auto-deploy disabled for prod.", "tags": ["deployment", "prod", "governance"], "updatedAt": "2026-08-01T12:00:00Z", "source": "Deployment Policy v3.0"},
    {"id": "dep-002", "title": "UAT Validation Checklist", "category": "deployment", "content": "Mandatory checks: row count ±0.1%, schema match, DQ score >99%, reconciliation 100%, sample query validation. Automated via validation agent.", "tags": ["uat", "validation", "checklist"], "updatedAt": "2026-07-25T08:00:00Z", "source": "Deployment Policy v3.0"},
]

TICKET_DETAIL = {
    "id": "UKDATA-4821",
    "summary": "Glue job timeout on uk_digital_dimension load",
    "status": "In Review",
    "agentStatus": "Awaiting Review",
    "confidence": 91,
    "pr": "#422",
    "environment": "UAT",
    "priority": "High",
    "assignee": "AI Agent",
    "createdAt": "2026-08-28T09:15:00Z",
    "description": "The uk_digital_dimension Glue job is timing out after 120 minutes during the daily load. Affects downstream reporting for digital channel analytics.",
    "rootCause": "The Glue job's default timeout of 120 minutes is insufficient for the increased data volume following the Q3 schema expansion. The job processes 8.4M rows with a complex SCD2 merge that now includes 3 additional columns, pushing execution time beyond the configured limit.",
    "impact": {"level": "Medium", "filesAffected": 2, "tablesAffected": 1, "blastRadius": "Low"},
    "timeline": [
        {"id": "1", "label": "Jira analysed", "status": "completed", "timestamp": "2026-08-28T09:16:00Z", "description": "Ticket parsed and classified as Glue performance issue"},
        {"id": "2", "label": "Architecture loaded", "status": "completed", "timestamp": "2026-08-28T09:17:00Z", "description": "UK Digital data platform architecture retrieved from memory"},
        {"id": "3", "label": "Repository identified", "status": "completed", "timestamp": "2026-08-28T09:18:00Z", "description": "uk-data-platform repo, branch: main"},
        {"id": "4", "label": "Memory searched", "status": "completed", "timestamp": "2026-08-28T09:19:00Z", "description": "Found 3 similar incidents from past 6 months"},
        {"id": "5", "label": "Root cause identified", "status": "completed", "timestamp": "2026-08-28T09:22:00Z", "description": "Timeout configuration insufficient for current data volume"},
        {"id": "6", "label": "Fix generated", "status": "completed", "timestamp": "2026-08-28T09:28:00Z", "description": "Increased timeout + added partition pruning optimization"},
        {"id": "7", "label": "Tests executed", "status": "completed", "timestamp": "2026-08-28T09:35:00Z", "description": "18/18 tests passed in DEV environment"},
        {"id": "8", "label": "PR created", "status": "completed", "timestamp": "2026-08-28T09:38:00Z", "description": "PR #422 created against main branch"},
        {"id": "9", "label": "Deployment validated", "status": "in_progress", "timestamp": None, "description": "Awaiting UAT deployment approval"},
    ],
    "impactedFiles": [
        {"path": "glue/jobs/uk_digital_dimension_timeout.py", "changeType": "modified", "linesAdded": 12, "linesRemoved": 3},
        {"path": "glue/config/uk_digital_dimension.json", "changeType": "modified", "linesAdded": 4, "linesRemoved": 2},
    ],
    "codeChanges": [{"file": "glue/jobs/uk_digital_dimension_timeout.py", "language": "python", "diff": "@@ -45,7 +45,12 @@ def main():\n-    job.init(args['JOB_NAME'], args)\n+    job.init(args['JOB_NAME'], args)\n+    spark.conf.set('spark.sql.adaptive.enabled', 'true')\n # Partition pruning added\n"}],
    "testResults": [
        {"id": "t1", "name": "test_dimension_load_completes_within_timeout", "type": "Unit", "environment": "Dev", "status": "passed", "duration": "4.2s"},
        {"id": "t2", "name": "test_partition_pruning_reduces_row_count", "type": "Unit", "environment": "Dev", "status": "passed", "duration": "2.8s"},
        {"id": "t3", "name": "test_scd2_merge_integrity", "type": "Integration", "environment": "Dev", "status": "passed", "duration": "18.5s"},
        {"id": "t4", "name": "test_row_count_reconciliation", "type": "Data Quality", "environment": "Dev", "status": "passed", "duration": "12.1s"},
        {"id": "t5", "name": "test_schema_compatibility", "type": "Data Quality", "environment": "Dev", "status": "passed", "duration": "3.4s"},
    ],
    "dataValidation": [
        {"name": "Row Count Check", "value": "8.49M rows", "status": "passed"},
        {"name": "Schema Check", "value": "23 columns", "status": "passed"},
        {"name": "Data Quality Check", "value": "100%", "status": "passed"},
        {"name": "Reconciliation Check", "value": "100%", "status": "passed"},
    ],
    "deployments": [
        {"stage": "Dev", "status": "completed", "approvedBy": "Auto-deploy", "timestamp": "2026-08-28T09:40:00Z"},
        {"stage": "UAT", "status": "in_progress", "approvedBy": None, "timestamp": None},
        {"stage": "Prod", "status": "pending", "approvedBy": None, "timestamp": None},
        {"stage": "Validation", "status": "pending", "approvedBy": None, "timestamp": None},
    ],
}

if __name__ == "__main__":
    with open(MOCK_DIR / "skills.json", "w", encoding="utf-8") as f:
        json.dump(SKILLS, f, indent=2)
    with open(MOCK_DIR / "memory.json", "w", encoding="utf-8") as f:
        json.dump(MEMORY, f, indent=2)
    with open(MOCK_DIR / "ticket_details.json", "w", encoding="utf-8") as f:
        json.dump({"UKDATA-4821": TICKET_DETAIL}, f, indent=2)
    print("Mock JSON files generated.")
