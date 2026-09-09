# Newton · The AI Data Engineer

Newton is an autonomous / semi-autonomous **AI Data Engineering platform**.

It takes engineering work from **Jira, Microsoft Teams, Slack, Web UI, or API** and executes a **configurable** engineering lifecycle — never a hard-coded DEV → UAT → PROD path.

**Cursor is only the IDE used to develop Newton.** Production Newton has **zero** Cursor runtime dependency. A clean checkout runs with:

```bash
cp .env.example .env
docker compose up --build
# or: make install && make dev-backend / make dev-frontend
```

**Repository:** https://github.com/karthikjohnbabu/AI_Data_Engineer

---

## Architecture

### Newton Core (shared, company-agnostic)

Orchestration, triage, investigation, planning, coding, testing, validation, Git/PR, approvals, **workflow engine**, security, audit, observability, notifications, memory/knowledge retrieval, skill execution, provider integrations.

### Tenant / customer context (dynamic)

Architecture, repos, environments, Jira projects, standards, incidents, custom skills, runbooks, approval policies, **branching strategy**, **workflow templates**, secrets references.

### Multi-tenant and single-tenant

| Mode | Env | Behaviour |
|------|-----|-----------|
| Multi-tenant SaaS | `NEWTON_DEPLOYMENT_MODE=multi_tenant` | Resolve tenant from `X-Tenant-Id` / auth |
| Single-tenant enterprise | `NEWTON_DEPLOYMENT_MODE=single_tenant` + `NEWTON_TENANT_ID=busybees` | Always that tenant; **foreign tenant IDs rejected** |

Same application code — no customer forks.

### Configurable workflows

Templates live under `backend/workflows/templates/`:

- `dev_to_prod.yaml` — Company A style
- `dev_uat_prod.yaml` — Company B style
- `feature_to_prod.yaml` — Company C style
- `incident_resolution.yaml`

Branch policy is per-tenant (`tenant_data/<tenant>/config.yaml` → `git.branch_strategy`).

### Provider abstractions

Agents call interfaces (`GitProvider`, `TicketProvider`, `MessagingProvider`, `LLMProvider`, `ExecutionProvider`, `SecretProvider`) — not Bitbucket/Jira SDKs directly.

### Skills, rules, memory

- **Standard skills:** `backend/skills/standard/`
- **Tenant overrides:** `tenant_data/<tenant>/skills/` (override → tenant → standard)
- **Rules:** structured YAML under `tenant_data/<tenant>/rules/`
- **Memory:** always queried with `tenant_id` first (isolation enforced)

### Example tenants

```
tenant_data/
  newton/             # Newton product (Infominds IAM user newton)
  betfred/            # Betfred skills/rules only — secrets.local.yaml for UI tests
  example_customer/
  busybees/
```

Each tenant has `skills/`, `rules/`, `workflows/`, `lineage/`, `reports/`. Secrets stay in gitignored `secrets.local.yaml`. Future MySQL: `tenant_data/_schema/mysql_plan.md`.

---

## Local development

Working URLs:

- UI: http://localhost:3000
- Admin: http://localhost:3000/admin
- Betfred portal: http://localhost:3000/tenants/betfred
- BusyBees portal: http://localhost:3000/tenants/busybees
- API: http://localhost:8000
- Health: http://localhost:8000/api/health
- OpenAPI: http://localhost:8000/docs

```bash
cp .env.example .env
make install
make dev-backend   # :8000
make dev-frontend  # :3000
```

Phase 1 architecture tests:

```bash
cd backend && ../.venv/bin/pytest tests/unit/test_architecture_phase1.py -v
```

Useful APIs:

- `GET /api/health` — includes `deploymentMode`
- `GET /api/tenants`
- `GET /api/tenants/context` — header `X-Tenant-Id: example_customer`
- `GET /api/tenants/admin-overview` — cross-tenant skills/rules/fixes counts
- `GET /api/tenants/client-dashboard` — portal metrics + pipeline + lineage
- `GET /api/tenants/fixes` / `.../fixes/{id}` / `.../artefacts/{name}`
- `GET /api/tenants/workspace` — skills, rules, lineage, production reports, secret *status*
- `POST /api/tenants/workflows/run-stage` — one pipeline phase (uses tenant secrets)
- `GET /api/tenants/lineage`
- `GET /api/tenants/reports/production`

Docker:

```bash
docker compose up --build
```

---

## Pipeline (example — not hard-coded)

Companies configure their own stage order. One common template:

```
Intake → Triage → Investigation → Plan → Code → Test
→ Deploy DEV → Validate → PR → Review → Human Approval
→ Merge → Deploy PROD → Validate → Update Jira / Memory → Notify
```

---

## Security principles

- Tenant isolation on every request and memory query
- Secrets referenced by name/ID in tenant config (not committed keys)
- Production destructive ops require human approval (rules engine)
- Execution sandbox abstraction (no arbitrary code on API hosts)
- Structured events: `tenant_id`, `run_id`, `workflow_stage`

---

## Docs

- `docs/architecture/OVERVIEW.md`
- `docs/architecture/PITCH.md`
- `docs/architecture/PHASE1.md` — what Phase 1 delivered and remaining TODOs

## License

Proprietary — internal use only.
