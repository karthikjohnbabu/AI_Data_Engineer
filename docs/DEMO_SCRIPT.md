# Demo Script — Prasath Anna / Betfred / Busybees Pilot

**Duration:** 15–20 minutes  
**Audience:** Prasath Anna, data engineering leads, client stakeholders  
**Prerequisites:** Backend + frontend running locally

---

## Setup (before the call)

```bash
# Terminal 1
cd backend
pip install -e ".[aws,dev]"
python -m uvicorn api.main:app --reload --port 8000

# Terminal 2
cd frontend
npm run dev
```

Open http://localhost:3000

---

## Act 1 — Onboarding (3 min)

**Say:** "When a new client connects, the tool asks about their domain and whether this is a new or existing project."

1. Complete onboarding wizard:
   - Domain: **Betting**
   - Project type: **Existing**
   - Client: **BBees / Busybees**
   - Context: *"Prod migration complete. Incremental loads for surname changes. Data freeze active."*

2. Show betting baseline rules loaded automatically.

**Say:** "For new projects, we auto-provision AWS data lake architecture — VPCs, buckets, metadata layers."

---

## Act 2 — Tech Stack and Credentials (3 min)

1. Go to **Settings** → show credential forms for AWS, Jira, Bitbucket, Jenkins, Slack, Teams
2. **Say:** "All secrets are stored in the backend, encrypted when `CREDENTIALS_SECRET_KEY` is set."
3. Go to **Tech Stack** → show Dev / UAT / Prod environments
4. **Say:** "Once AWS credentials are saved, we display the three environments. Jira and Bitbucket switch from mock to live automatically."

---

## Act 3 — Ticket Lifecycle (7 min)

1. Go to **Tickets** → select `UKDATA-4821` (Glue timeout)
2. Show **Phase 1–4 checklist** on ticket detail
3. Click **Run Again** → watch agent pipeline:
   - Triage → Investigation → Code fix → Tests → Validation
4. Show generated diff and test results
5. Click **Create PR** → show PR link
6. Show **Deployments** tab (Dev → UAT → Prod gates)

**Say:** "The agent doesn't auto-merge. Every deployment step requires human approval — human in the loop."

---

## Act 4 — Adaptive Learning (2 min)

1. Return to **Dashboard**
2. Show **recommendations banner** (e.g. BBees incremental load tip)
3. **Say:** "At end of day, the system studies work patterns and suggests skill updates and workflow optimisations."

4. Go to **Skills** → mention auto-learned skills appear after repeated ticket types

---

## Act 5 — Integrations (3 min)

1. Show **Pending Actions** panel on dashboard
2. **Say:** "When someone tags the bot in Slack or Teams, it queues an approval — never executes without permission."

3. Optional API demo (Postman/curl):

```bash
curl -X POST http://localhost:8000/api/notifications/slack/tag \
  -H "Content-Type: application/json" \
  -d '{"user":"prasath","message":"Run agent on UKDATA-4821","ticketId":"UKDATA-4821"}'
```

4. Approve/reject from dashboard

---

## Act 6 — Custom Workflows (2 min)

1. Go to **Workflows**
2. Paste natural language phases:

```
Phase 1: Triage and root cause
- Classify ticket
- Check memory for similar incidents

Phase 2: Fix and validate
- Generate code fix
- Run unit and DQ tests
- Create PR and README

Phase 3: Deploy
- Merge to dev
- Deploy to UAT

Phase 4: Close
- Post-validation
- Update memory
- Close Jira ticket
```

3. **Say:** "Each company can define their own phased workflow in plain English."

---

## Closing talking points

- Pilot ready for **Betfred / Busybees** with betting domain baseline
- Real Jira/Bitbucket: add credentials in Settings — no code changes
- Product name and LinkedIn GTM: see `docs/GTM.md`
- Full requirements: `docs/REQUIREMENTS.md`

---

## Q&A prep

| Question | Answer |
|----------|--------|
| Does it auto-deploy to prod? | No — human approval required at every gate |
| Where are credentials stored? | Backend SQLite, encrypted with Fernet |
| Can we use Teams? | Yes — webhook relay, no manager monitoring API |
| What about incremental loads? | Betting baseline includes BBees delta load + data freeze rules |
| LLM provider? | Local (demo), OpenAI, or Bedrock — switch via env |
