# London time in communication

Busy Bees Midlothian work is London-based (AWS `eu-west-2`). Karthik's laptop may show IST; that is local only.

- In Teams, WhatsApp, Jira, Slack, and chat replies, state times as **London time** (GMT in winter, BST in summer). Do not mention IST.
- EventBridge cron is UTC. Convert before sending: UAT daily health is `cron(0 7 ? * * *)` = 07:00 UTC = **08:00 London** in BST, **07:00 London** in GMT.
- AWS CLI timestamps on Karthik's Windows machine are often IST (`+05:30`). Convert to London before quoting them.
- Internal notes may keep UTC for cron/S3 folder names (`2026-08-17_09-10` is UTC). User-facing text still uses London.
