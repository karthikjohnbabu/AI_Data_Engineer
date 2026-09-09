# Future MySQL — tenant-wise access

Filesystem `tenant_data/<tenant_id>/` is the store **now**. When a MySQL database is added, keep the same isolation:

## Layout

- Database name: `newton` (Newton-owned; not a customer warehouse).
- Every table includes `tenant_id VARCHAR(64) NOT NULL`.
- Unique / primary keys are composite `(tenant_id, …)`.
- Application queries **always** filter `WHERE tenant_id = :current`.
- Optional: MySQL users per tenant or row-level views; never a shared superuser from the UI.

## Tables (planned)

| Table | Contents |
|-------|----------|
| `tenants` | id, name, config JSON |
| `tenant_skills` | tenant_id, skill_id, manifest JSON |
| `tenant_rules` | tenant_id, rule_id, rule JSON |
| `tenant_lineage_nodes` / `_edges` | lineage graph |
| `tenant_reports` | production report runs |
| `tenant_secrets` | encrypted blobs (KMS), never plaintext dumps |
| `tenant_memory` | memory items |

The IAM user `newton` (Infominds) is for **Newton platform** objects (code artefacts, this DB), not for Betfred AWS.
