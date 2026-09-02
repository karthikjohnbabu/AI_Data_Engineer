# AI Data Engineer — Agent Platform

Internal AI Data Engineering Agent dashboard that automates the full lifecycle of Jira tickets — from triage and root-cause analysis through code generation, testing, PR creation, and deployment validation.

## Architecture

```
Frontend (Next.js)  →  Agent API (FastAPI)  →  Integrations (Jira, Git, AWS, Databricks, ...)
```

The UI never calls AWS, Jira, or Git directly. All operations go through the Agent API.

## Quick Start

### Option 1 — Local development

```bash
# Install dependencies
make install

# Terminal 1 — API
make dev-backend

# Terminal 2 — Frontend
make dev-frontend

# Optional — seed demo agent runs
make seed-demo
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

### Option 2 — Docker

```bash
docker compose up --build
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `JIRA_MODE` | `mock` | `mock` or `jira` (when credentials available) |
| `GIT_PROVIDER` | `mock` | `mock`, `github`, or `bitbucket` |
| `LLM_PROVIDER` | `local` | `local`, `bedrock`, `openai`, `anthropic` |
| `API_KEY` | _(empty)_ | Set to enable API key auth on all endpoints |

## Pages

| Page | Route |
|------|-------|
| Dashboard | `/` |
| Tickets | `/tickets` |
| Runs | `/runs` |
| Deployments | `/deployments` |
| Skills | `/skills` |
| Memory | `/memory` |
| Reports | `/reports` |
| Integrations | `/integrations` |
| Settings | `/settings` |

## Agent Pipeline

```
Jira ticket → Triage → Investigation → Coding → Testing → Validation → PR → Deployment
```

Click **New Ticket** to submit an issue, or **Run Again** on any ticket to re-process.

## Swapping mocks for real integrations

When credentials arrive, update `.env`:

```bash
JIRA_MODE=jira
JIRA_URL=https://your-org.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-token

GIT_PROVIDER=github
GITHUB_TOKEN=ghp_...
GITHUB_REPO=org/repo
```

No frontend changes required.

## License

Proprietary — internal use only.
