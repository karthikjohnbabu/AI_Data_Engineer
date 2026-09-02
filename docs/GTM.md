# Go-to-Market — Product Name and LinkedIn Outreach

Business action items from the Prasath Anna meeting. Engineering platform is ready for pilot demos.

---

## Product Name Candidates

Pick one with Prasath Anna before external launch:

| Name | Tagline | Notes |
|------|---------|-------|
| **PipelinePilot** | Your AI data engineering co-pilot | Emphasises automation + human oversight |
| **DataForge Agent** | From ticket to production, automatically | Strong for DE audience |
| **StackMind** | Learns your stack, runs your workflows | Highlights tech stack detection |
| **FlowEngine DE** | Jira-to-PR intelligence for data teams | Descriptive, enterprise-friendly |
| **DeltaAgent** | Incremental intelligence for data platforms | Nods to delta/incremental loads (BBees context) |

**Recommendation:** **PipelinePilot** — short, memorable, works on LinkedIn and in sales decks.

---

## LinkedIn Outreach Process

### Target profile

- **Title:** CEO, CTO, VP Engineering, Head of Data
- **Company:** Data-heavy industries (betting, finance, pharma, retail)
- **Size:** 50–500 employees (fast decision cycle)
- **Signal:** Hiring data engineers, posting about cloud migration or data quality

### Workflow

1. **Sales Navigator** — save search: "CTO" + "data platform" + UK/EU
2. **Connect** — personalised connection request (no pitch)
3. **Day 3** — follow-up message with demo offer
4. **Day 7** — share 2-minute screen recording if no reply
5. **CRM** — log in spreadsheet or HubSpot (name, company, stage)

### Connection request template

```
Hi [Name], I work on AI tooling for data engineering teams —
automating Jira-to-PR workflows on AWS/Databricks. Would love to connect.
```

### Demo invitation template

```
Hi [Name], thanks for connecting.

We built an AI agent that takes a Jira ticket (e.g. Glue timeout, SCD merge failure),
investigates root cause, generates a fix, runs tests, and opens a PR — with human
approval at every step.

We're piloting with betting/finance data teams. Would a 20-minute demo be useful
for [Company]? Happy to show a live run on a real ticket pattern.

Best,
[Your name]
```

### Follow-up (no reply)

```
Hi [Name], quick follow-up — here's a 90-second walkthrough of our agent handling
a Glue job timeout: [Loom link]

No pressure — happy to chat if timing works.
```

---

## Demo logistics

- Use **Betting domain** baseline for BBees/Betfred conversations
- Use **Finance** baseline for fintech prospects
- Run locally or deploy via Docker Compose
- See `docs/DEMO_SCRIPT.md` for step-by-step demo flow

---

## Metrics to track

| Metric | Target (Month 1) |
|--------|------------------|
| Connection requests sent | 50 |
| Demo calls booked | 5 |
| Pilot agreements | 1 (BBees in progress) |
