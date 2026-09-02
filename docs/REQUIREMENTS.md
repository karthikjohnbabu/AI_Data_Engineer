# Project Requirements — Prasath Anna Meeting (Sep 2026)

Source: Meeting with Prasath Anna. Captures product scope for Betfred/BBees pilot and external GTM.

---

## 1. Product Objective

Build an AI tool that:

1. Detects a company's tech stack
2. Integrates with their environment (AWS, Jira, Bitbucket, CI/CD)
3. Automates development workflows based on learned patterns

---

## 2. Tech Stack Display and Credential Management

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Display AWS, Jira, Bitbucket, Jenkins | Done | `/tech-stack` |
| AWS Dev / UAT / Prod environments | Done | Tech Stack page after AWS creds saved |
| User enters credentials, stored in backend | Done | `/settings` — encrypted at rest when `CREDENTIALS_SECRET_KEY` set |
| Auto-detect connected vs mock services | Done | `GET /api/tech-stack` |

---

## 3. Domain Baselines and Project Initialization

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Pharma, Finance, Betting, Nursery baselines | Done | `backend/data/domains/*.json` |
| Ask new vs existing project | Done | `/onboarding` wizard |
| Existing: user provides context | Done | Context field in onboarding |
| New: AWS network + data lake setup | Done | `POST /api/onboarding` triggers `provision_new_project()` |
| Azure support | Planned | Architecture plan returned; live provisioning TBD |

**New project provisioning includes:**

- VPCs and private subnets (Dev, UAT, Prod) — planned via Terraform
- Data lake buckets (bronze, silver, gold, metadata)
- Folder structure (`raw/`, `staging/`, `curated/`, `metadata/`)
- Glue catalog naming

---

## 4. Adaptive Learning and Skill Updates

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Periodic skill updates from work patterns | Done | `POST /api/skills/learn` + daily scheduler (23:00 UTC) |
| End-of-day pattern study | Done | `services/scheduler.py` |
| Auto-update backend skill repository | Done | `learned_skills` table merged into `/api/skills` |
| Pop-up workflow recommendations | Done | `RecommendationsBanner` on dashboard |

---

## 5. Jira Workflow Automation

| Phase | Tasks |
|-------|-------|
| **Phase 1** | Triage and analysis |
| **Phase 2** | Dev testing, Jira testing, validation, merge to dev, PR + README |
| **Phase 3** | PR movement, localhost/dev deployments |
| **Phase 4** | Ticket closure, post-validation, memory update |

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Phase 1–4 checklist on tickets | Done | `PhaseChecklist.tsx` + default workflow JSON |
| Natural language phase definition | Done | `/workflows` |
| Real Jira read/write | Ready | Set credentials in Settings; auto-switches from mock |

---

## 6. Integration and Testing Strategy

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Test in Betfred and Busybees before external release | In progress | Betting domain baseline configured |
| Slack bot with human-in-the-loop | Done | Webhook delivery + pending actions panel |
| Teams (non-direct, webhook relay) | Done | Incoming webhook / Power Automate relay |
| Bot reads tags, asks permission before executing | Done | `pending_actions` table + dashboard approve/reject |

---

## 7. Busybees Project Status (from meeting)

| Item | Decision |
|------|----------|
| Production migration | Completed |
| Source surname / deleted record changes | Incremental loads (delta rows only) |
| Data freeze | Active after prod load |
| New buyers work | Starting per ops schedule |

Captured in `backend/data/domains/betting.json`.

---

## 8. Go-to-Market (Business — not engineering)

| Action | Owner | Doc |
|--------|-------|-----|
| Formal product name | Prasath Anna | `docs/GTM.md` — name candidates |
| LinkedIn CEO/CTO outreach | Marketing | `docs/GTM.md` — outreach templates |
| Demo script for pilot | Karthik + Prasath | `docs/DEMO_SCRIPT.md` |

---

## 9. Engineering Configuration

```bash
# Switch from mock to live integrations
JIRA_MODE=jira          # or save creds in Settings UI
GIT_PROVIDER=bitbucket  # or github
LLM_PROVIDER=openai     # or bedrock, local
CREDENTIALS_SECRET_KEY=your-random-secret  # encrypts secrets in SQLite
```

Install optional AWS provisioning:

```bash
pip install -e ".[aws]"
```

---

## 10. Team Notification

Share with the team:

- **Repo:** https://github.com/karthikjohnbabu/AI_Data_Engineer
- **Requirements:** This document
- **Demo:** `docs/DEMO_SCRIPT.md`
- **Pilot clients:** Betfred / Busybees (Betting domain)
