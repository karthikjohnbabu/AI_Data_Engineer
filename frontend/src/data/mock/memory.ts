import type { MemoryItem } from "@/types";

export const memoryItems: MemoryItem[] = [
  {
    id: "arch-001",
    title: "UK Digital Data Platform — Medallion Architecture",
    category: "architecture",
    content:
      "Bronze (raw S3) → Silver (Iceberg, cleaned) → Gold (Redshift, aggregated). All Glue jobs follow naming convention: uk_{domain}_{entity}_{action}. Cross-account access via IAM roles with external ID.",
    tags: ["architecture", "medallion", "uk-digital"],
    updatedAt: "2026-08-15T10:00:00Z",
    source: "Architecture Decision Record #12",
  },
  {
    id: "arch-002",
    title: "BBees/Betfred Shared Data Lake Pattern",
    category: "architecture",
    content:
      "Client-specific bronze zones with shared silver/gold layers. Tenant isolation via S3 prefix and IAM policies. Databricks Unity Catalog for cross-tenant governance.",
    tags: ["betfred", "bbees", "multi-tenant"],
    updatedAt: "2026-08-20T14:30:00Z",
    source: "Client Onboarding Doc",
  },
  {
    id: "std-001",
    title: "Glue Job Timeout Standards",
    category: "standards",
    content:
      "Default timeout: 120 min for dimension loads, 60 min for fact loads, 30 min for staging. Jobs processing >5M rows must enable adaptive query execution and partition pruning.",
    tags: ["glue", "timeout", "standards"],
    updatedAt: "2026-07-10T09:00:00Z",
    source: "Engineering Standards v2.3",
  },
  {
    id: "std-002",
    title: "SCD2 Implementation Standard",
    category: "standards",
    content:
      "Use MERGE with effective_date/end_date columns. Hash key on business key + effective_date. Always include is_current flag. Backfill requires DBA approval.",
    tags: ["scd2", "standards", "modelling"],
    updatedAt: "2026-06-22T11:00:00Z",
    source: "Engineering Standards v2.1",
  },
  {
    id: "inc-001",
    title: "UKDATA-4521 — Glue Timeout on customer_dim",
    category: "incidents",
    content:
      "Similar root cause: timeout too low after data volume increase. Fix: increased timeout to 180 min + added partition pruning. Resolution time: 35 minutes.",
    tags: ["glue", "timeout", "customer_dim"],
    updatedAt: "2026-07-18T16:00:00Z",
    source: "Incident Post-Mortem",
  },
  {
    id: "inc-002",
    title: "UKDATA-4398 — Redshift WLM Queue Saturation",
    category: "incidents",
    content:
      "Peak-hour ETL caused WLM queue saturation. Fix: rescheduled non-critical jobs to off-peak + increased query slots for ETL queue.",
    tags: ["redshift", "wlm", "performance"],
    updatedAt: "2026-06-30T10:00:00Z",
    source: "Incident Post-Mortem",
  },
  {
    id: "fix-001",
    title: "Partition Pruning for Large Glue Jobs",
    category: "fixes",
    content:
      "Add watermark-based date filter before full table scan. Reduces processing time by 60-80% on dimension loads. Template available in glue/templates/partition_prune.py.",
    tags: ["glue", "optimization", "partition"],
    updatedAt: "2026-07-18T16:30:00Z",
    source: "Known Fix Library",
  },
  {
    id: "fix-002",
    title: "Iceberg Schema Evolution — Safe Column Add",
    category: "fixes",
    content:
      "Use ALTER TABLE ADD COLUMN with nullable default. Never drop columns in production. Run compatibility check against downstream consumers before merge.",
    tags: ["iceberg", "schema", "evolution"],
    updatedAt: "2026-08-01T09:00:00Z",
    source: "Known Fix Library",
  },
  {
    id: "dep-001",
    title: "Production Deployment Rules",
    category: "deployment",
    content:
      "All prod deployments require: (1) UAT sign-off, (2) data validation pass, (3) rollback plan documented, (4) change window approval for P1 tables. Auto-deploy disabled for prod.",
    tags: ["deployment", "prod", "governance"],
    updatedAt: "2026-08-01T12:00:00Z",
    source: "Deployment Policy v3.0",
  },
  {
    id: "dep-002",
    title: "UAT Validation Checklist",
    category: "deployment",
    content:
      "Mandatory checks: row count ±0.1%, schema match, DQ score >99%, reconciliation 100%, sample query validation. Automated via validation agent.",
    tags: ["uat", "validation", "checklist"],
    updatedAt: "2026-07-25T08:00:00Z",
    source: "Deployment Policy v3.0",
  },
];
