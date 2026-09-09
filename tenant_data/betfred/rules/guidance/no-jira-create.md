# Jira — no ticket creation (HARD RULE)

## Never create issues

Do **not** call `createJiraIssue`, Atlassian “create issue”, or any API that
opens a **new** Jira key — unless the user’s **current message** explicitly
says to create a ticket (e.g. “create Jira ticket DE-…” / “raise a Jira for
this”).

**Prohibited without that explicit ask:**

- Proactive follow-up tickets after triage, validation, or “we should track
  this”
- “I’ll create a linked ticket” / auto follow-up to a Done ticket
- Creating because a skill or workflow *could* use a ticket

When work needs tracking and the user did **not** ask for a new ticket: offer
**draft summary text** for them to paste into Jira themselves, or comment on
an **existing** ticket only if they asked to update that key.

## Allowed (when user asks)

- **Read** issues (`getJiraIssue`, search, transitions)
- **Edit** description/comments on a ticket the user named
- **Transition** close/status only when the user asked for that action
- **Create** only when the current user message explicitly requests creation
  — still no Cursor paths in title/description (see `betfred-facing-no-cursor-leak`)

## Why

Tickets created via MCP appear under **Prasath’s** Jira account. Unrequested
creates are easy to miss and pollute the backlog (e.g. DE-9668).
