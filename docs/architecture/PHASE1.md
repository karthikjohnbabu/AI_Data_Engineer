# Newton Phase 1 — Architecture

## Implemented

| Area | Location |
|------|----------|
| TenantContext / resolver / loader / registry / validation | `backend/tenants/` |
| Multi / single tenant deployment mode | `NEWTON_DEPLOYMENT_MODE`, `NEWTON_TENANT_ID` |
| AgentRunContext | `backend/models/agent_run_context.py` |
| Provider abstractions (git, messaging, ticketing, llm, execution, secrets, cloud) | `backend/providers/` |
| Workflow engine + templates + policies | `backend/workflows/engine/`, `templates/`, `policies/` |
| Stage interface + stubs | `backend/workflows/stages/` |
| Skill registry (standard + tenant override) | `backend/skills/{base,loader,registry,standard}/` |
| Rule engine | `backend/rules/` |
| Tenant-scoped memory | `backend/memory/` |
| Approval policy evaluation | `backend/approvals/policy_eval.py` |
| Structured events | `backend/observability/events/` |
| Example tenants | `tenant_data/{newton,example_customer,busybees}/` |
| API | `GET /api/tenants`, `/tenants/context`, `POST /tenants/workflows/run` |
| Isolation + workflow tests | `backend/tests/unit/test_architecture_phase1.py` (**12 passed**) |

## Cursor knowledge migration map

| Source | Classification | Newton destination |
|--------|----------------|--------------------|
| Product pitch / pipeline narrative | NEWTON STANDARD | `docs/architecture/PITCH.md`, workflow templates |
| Domain baselines (26 industries) | NEWTON STANDARD | `backend/data/domains/*.json` (later → tenant selectable baselines) |
| Skill YAML stubs (glue, dbt, …) | NEWTON STANDARD | `backend/skills/` + `backend/skills/standard/` |
| Betting / BusyBees incremental load patterns | TENANT SPECIFIC | `tenant_data/busybees/` |
| IDE settings / Cursor rules | DEVELOPMENT-ONLY | stay in Cursor; **not** shipped in runtime |
| No Cursor APIs in product code | — | verified clean |

## Preserved (not rewritten)

- FastAPI routes, dashboard, onboarding UI, existing agents/orchestrator
- Integrations package layout (Jira/Slack/Teams/AWS/…)
- Frontend Next.js app

## Remaining TODOs (later phases)

1. Wire legacy orchestrator to `WorkflowExecutor` + `TenantContext`
2. Real GitHub/Bitbucket/GitLab adapters behind `GitProvider`
3. Persist memories/events in Postgres with `tenant_id` + optional RLS
4. Docker sandbox `ExecutionProvider`
5. SSO / RBAC enforcement on every route
6. Frontend tenant switcher for multi-tenant mode
7. Migrate domain baselines into tenant-selectable packs
8. Rename workspace folder to `ai-data-engineer` if desired (content already matches)

## Commands

```bash
cp .env.example .env
make install
make dev-backend
make dev-frontend
cd backend && ../.venv/bin/pytest tests/unit/test_architecture_phase1.py -v
```
