# Commit author / committer

When creating git commits in this repo (`bb-famly-migration-pipeline`):

- **Author and committer** must be Prasath (name + Busy Bees email), not Karthik and not the agent.
- **Never** run `git config` to change global or local user.name / user.email permanently.
- Use one-off overrides on the commit only, e.g.:

```powershell
git -c user.name="Prasath Natarajan" -c user.email="prasath.natarajan@busybees.com" commit -m "..."
```

- Confirm `git log -1 --format="%an <%ae>%n%cn <%ce>"` shows Prasath for both author and committer after commit.
- Still follow: no agent product name in messages; no `Co-authored-by` agent trailers; only commit when the user asks.
