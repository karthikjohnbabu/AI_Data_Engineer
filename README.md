# AI Data Engineer — Agent Platform

An internal AI Data Engineering Agent dashboard that automates the full lifecycle of Jira tickets — from triage and root-cause analysis through code generation, testing, PR creation, and deployment validation.

Built for data engineering teams running ETL pipelines on AWS, Databricks, and Redshift. Designed for Betfred/BBees and similar client engagements.

**Repository:** https://github.com/karthikjohnbabu/AI_Data_Engineer

---

## What it does

A data engineer selects or submits a Jira ticket. An AI agent then:

1. **Triages** the ticket (classify severity and type)
2. **Investigates** root cause using architecture memory and past incidents
3. **Generates** a code fix with diffs
4. **Runs** unit, integration, and data quality tests
5. **Validates** row counts, schema, and reconciliation
6. **Creates** a pull request for human review
7. **Deploys** through DEV → UAT → PROD with approval gates

All of this is visible in one dashboard — not a chatbot.

---

## Architecture

The frontend never talks to Jira, Git, or AWS directly. Everything goes through the Agent API so the underlying agent engine can be swapped without UI changes.

```
┌─────────────────┐     HTTPS      ┌─────────────────┐
│    Frontend     │ ─────────────▶ │    Agent API    │
│   (Next.js)     │                │   (FastAPI)     │
└─────────────────┘                └────────┬────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
        ┌──────────┐              ┌──────────────┐              ┌──────────┐
        │   Jira   │              │  Agent Core  │              │   Git    │
        └──────────┘              │              │              └──────────┘
                                    │ Orchestrator │
        ┌──────────┐              │ Triage       │              ┌──────────┐
        │  Memory  │              │ Investigation│              │   AWS    │
        └──────────┘              │ Coding       │              └──────────┘
                                    │ Testing      │
        ┌──────────┐              │ Validation   │              ┌──────────┐
        │  Skills  │              └──────────────┘              │Databricks│
        └──────────┘                                            └──────────┘
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| Backend | Python 3.11+, FastAPI, Pydantic |
| Database | SQLite (agent runs, ticket state) |
| Agents | Rule-based (local LLM); ready for Bedrock / OpenAI |
| Integrations | Jira, GitHub/Bitbucket (mock mode by default) |

---

## Prerequisites

Install these before starting:

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | 20+ | `node --version` |
| **npm** | 10+ | `npm --version` |
| **Python** | 3.11+ | `python --version` |
| **pip** | latest | `pip --version` |
| **Git** | any | `git --version` |
| **Docker** _(optional)_ | 24+ | `docker --version` |

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/karthikjohnbabu/AI_Data_Engineer.git
cd AI_Data_Engineer
```

### 2. Install dependencies

**Using Make (macOS / Linux / Git Bash on Windows):**

```bash
make install
```

**Manual install (Windows PowerShell):**

```powershell
# Frontend
cd frontend
npm install
cd ..

# Backend
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings
```

### 3. Configure environment

Copy the example env files:

```bash
# Root (backend config)
cp .env.example .env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Default values work out of the box for local demo — no credentials required.

| File | Purpose |
|------|---------|
| `.env` | Backend settings (Jira, Git, LLM, API key) |
| `frontend/.env.local` | Frontend API URL (`NEXT_PUBLIC_API_URL`) |

### 4. Start the backend (Terminal 1)

```bash
make dev-backend
```

Or manually:

```bash
cd backend
python -m uvicorn api.main:app --reload --port 8000
```

Verify the API is running:

- Health check: http://localhost:8000/api/health
- Interactive API docs: http://localhost:8000/docs

### 5. Start the frontend (Terminal 2)

```bash
make dev-frontend
```

Or manually:

```bash
cd frontend
npm run dev
```

Open the dashboard: **http://localhost:3000**

### 6. Seed demo data (optional)

Pre-run agents on sample tickets so the Runs and Reports pages have data:

```bash
make seed-demo
```

---

## Quick start with Docker

If you prefer not to install Python/Node locally:

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

Stop containers:

```bash
make docker-down
# or
docker compose down
```

---

## Using the dashboard

### Walkthrough for demo / pilot

1. Open **http://localhost:3000**
2. Go to **Tickets** → click **New Ticket**
3. Enter an issue, e.g. `Glue job timeout on customer_dim load`
4. The agent runs automatically — you land on the ticket detail page
5. Review the **timeline**, **root cause**, **code diff**, and **test results**
6. Click **Approve**, **Reject**, **Run Again**, or **Create PR**
7. Check **Runs** for execution history and **Deployments** for pipeline status

### Sample ticket to explore

If you ran `make seed-demo`, open:

**http://localhost:3000/tickets/UKDATA-4821**

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Metrics, activity charts, resolution breakdown |
| Tickets | `/tickets` | Searchable ticket table; submit new tickets |
| Ticket detail | `/tickets/[id]` | Timeline, root cause, diffs, tests, deployments |
| Runs | `/runs` | Agent execution history |
| Deployments | `/deployments` | DEV → UAT → PROD pipeline |
| Skills | `/skills` | Agent capabilities (Glue, Redshift, PySpark, etc.) |
| Memory | `/memory` | Architecture decisions, standards, incidents |
| Reports | `/reports` | Success rate, classifications, recent runs |
| Integrations | `/integrations` | Jira, Git, AWS, Databricks status |
| Settings | `/settings` | Platform configuration (placeholder) |
| Login | `/login` | API key sign-in (only when `API_KEY` is set) |

---

## Agent pipeline

```
Jira analysed
    → Architecture loaded
    → Repository identified
    → Memory searched
    → Root cause identified
    → Fix generated
    → Tests executed
    → PR created
    → Deployment validated
```

| Agent | Location | Status |
|-------|----------|--------|
| Orchestrator | `backend/agents/orchestrator/` | Done |
| Triage | `backend/agents/triage/` | Done (rule-based) |
| Investigation | `backend/agents/investigation/` | Done (rule-based) |
| Coding | `backend/agents/coding/` | Done (template-based) |
| Testing | `backend/agents/testing/` | Done (simulated) |
| Validation | `backend/agents/validation/` | Done (simulated) |
| PR / Deployment | `backend/integrations/github/` | Mock (ready for real Git) |

---

## API endpoints

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check and config summary |
| `GET` | `/dashboard/metrics` | Dashboard KPIs |
| `GET` | `/dashboard/activity` | Activity chart data |
| `GET` | `/dashboard/resolution` | Resolution breakdown |
| `GET` | `/tickets` | List all tickets |
| `POST` | `/tickets` | Submit new ticket and run agent |
| `GET` | `/tickets/{id}` | Ticket detail |
| `POST` | `/tickets/{id}/run-again` | Re-run agent pipeline |
| `POST` | `/tickets/{id}/approve` | Approve ticket |
| `POST` | `/tickets/{id}/reject` | Reject ticket |
| `POST` | `/tickets/{id}/create-pr` | Create pull request |
| `GET` | `/runs` | List agent runs |
| `GET` | `/deployments` | List deployments |
| `GET` | `/reports/summary` | Report analytics |
| `GET` | `/integrations` | Integration status |
| `GET` | `/skills` | Agent skills |
| `GET` | `/memory` | Organizational memory |
| `POST` | `/auth/verify` | Verify API key |

Full interactive docs: http://localhost:8000/docs

---

## Configuration

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | _(empty)_ | Set to enable API key auth on protected endpoints |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origins (comma-separated) |
| `JIRA_MODE` | `mock` | `mock` or `jira` |
| `GIT_PROVIDER` | `mock` | `mock`, `github`, or `bitbucket` |
| `LLM_PROVIDER` | `local` | `local`, `bedrock`, `openai`, `anthropic` |
| `JIRA_URL` | — | Jira Cloud URL (when `JIRA_MODE=jira`) |
| `JIRA_EMAIL` | — | Jira account email |
| `JIRA_API_TOKEN` | — | Jira API token |
| `JIRA_PROJECT_KEY` | `UKDATA` | Jira project key |
| `GITHUB_TOKEN` | — | GitHub PAT (when `GIT_PROVIDER=github`) |
| `GITHUB_REPO` | — | e.g. `org/repo` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Frontend → API URL |

### Enable API key auth (optional)

```bash
# .env
API_KEY=your-secret-key-here
```

Restart the backend, then sign in at http://localhost:3000/login with that key.

### Switch to real integrations

When credentials are available, update `.env` only — no frontend changes needed:

```bash
JIRA_MODE=jira
JIRA_URL=https://your-org.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=UKDATA

GIT_PROVIDER=github
GITHUB_TOKEN=ghp_...
GITHUB_REPO=org/uk-data-platform

LLM_PROVIDER=bedrock   # when AWS keys are available
```

---

## Project structure

```
AI_Data_Engineer/
├── frontend/                 # Next.js dashboard
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # API client layer
│   │   ├── types/            # TypeScript types
│   │   └── data/mock/        # Fallback mock data
│   └── package.json
│
├── backend/                  # Python Agent API
│   ├── agents/               # Triage, investigation, coding, testing, validation
│   ├── api/                  # FastAPI routes and middleware
│   ├── config/               # Settings from environment
│   ├── data/mock/            # Mock JSON data
│   ├── database/             # SQLite persistence
│   ├── integrations/         # Jira, GitHub (mock + real stubs)
│   ├── llm/                  # LLM provider abstraction
│   ├── models/               # Pydantic models
│   └── services/             # Business logic
│
├── infrastructure/docker/    # Dockerfiles
├── scripts/seed/             # Demo seed script
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Make commands

| Command | Description |
|---------|-------------|
| `make install` | Install frontend and backend dependencies |
| `make dev-backend` | Start FastAPI on port 8000 (with hot reload) |
| `make dev-frontend` | Start Next.js on port 3000 |
| `make seed-demo` | Pre-run agents on 4 sample tickets |
| `make docker-up` | Build and start Docker containers |
| `make docker-down` | Stop Docker containers |
| `make test` | Run backend tests |
| `make lint` | Lint backend and frontend |

---

## Troubleshooting

### Frontend shows empty data or errors

1. Confirm the backend is running: http://localhost:8000/api/health
2. Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
3. Restart the frontend after changing `.env.local`

### `ModuleNotFoundError` when starting backend

Run from the `backend` directory:

```bash
cd backend
python -m uvicorn api.main:app --reload --port 8000
```

### Port already in use

```bash
# Windows — find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# macOS / Linux
lsof -ti:8000 | xargs kill -9
```

### Runs page is empty

Seed demo data:

```bash
make seed-demo
```

Or open any ticket and click **Run Again**.

### CORS errors in browser

Ensure `CORS_ORIGINS` in `.env` includes your frontend URL:

```bash
CORS_ORIGINS=http://localhost:3000
```

---

## Roadmap

| Item | Status | Needs |
|------|--------|-------|
| Frontend dashboard | Done | — |
| Agent API | Done | — |
| Agent pipeline (triage → deploy) | Done | — |
| SQLite persistence | Done | — |
| Mock Jira / Git | Done | — |
| Docker Compose | Done | — |
| Real Jira integration | Pending | API token + project key |
| Real GitHub / Bitbucket | Pending | PAT + repo name |
| LLM (Bedrock / OpenAI) | Pending | Cloud credentials |
| SSO auth | Pending | Azure AD / Okta |

---

## License

Proprietary — internal use only.
