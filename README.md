# AI Data Engineer — Agent Platform

Internal AI Data Engineering Agent dashboard that automates the full lifecycle of Jira tickets — from triage and root-cause analysis through code generation, testing, PR creation, and deployment validation.

## Architecture

```
Frontend (Next.js)  →  Agent API (FastAPI)  →  Integrations (Jira, Git, AWS, Databricks, ...)
```

The UI never calls AWS, Jira, or Git directly. All operations go through the Agent API, allowing the underlying agent engine to be swapped without frontend changes.

## Project Structure

```
ai-data-engineer/
├── frontend/          # Next.js dashboard (TypeScript, Tailwind)
├── backend/           # Python Agent API, agents, workflows, integrations
├── infrastructure/    # Terraform, Docker, Kubernetes
├── scripts/           # Setup, migrations, seed data
└── docs/              # Architecture, API, workflow documentation
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (coming soon)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
uvicorn api.main:app --reload --port 8000
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Metrics, activity charts, resolution breakdown |
| Tickets | `/tickets` | Searchable ticket table with filters |
| Ticket Detail | `/tickets/[id]` | Timeline, root cause, diffs, tests, deployments |
| Skills | `/skills` | Agent capabilities (Glue, Redshift, PySpark, etc.) |
| Memory | `/memory` | Architecture decisions, standards, incidents, fixes |

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI (planned)
- **Infrastructure:** AWS, Terraform, Docker (planned)

## License

Proprietary — internal use only.
