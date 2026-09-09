# AWS SSO — be proactive

When any AWS CLI / boto3 / Redshift Data API / Glue / DynamoDB / Bedrock call
fails with expired token, `UnauthorizedException`, `ExpiredToken`,
`InvalidGrantException`, or “SSO session” errors — **do not stop at “SSO
expired”**.

## Required behaviour

1. **Refresh immediately** (non-interactive browser flow is OK):

```bash
aws sso login --profile prod   # prefer first when the target is prod / Bedrock KB
aws sso login --profile dev    # when the work needs DEV
```

2. Tell the user the **device code URL** only if the command is still waiting;
   then wait / retry after they approve.
3. **Re-run the original AWS call** after a successful login. Do not leave the
   discovery half-done.
4. Profiles (Prasath laptop): `dev` (767828768594), `prod` (490004657962),
   region `eu-west-2`. Shell `AWS_PROFILE` overrides `.env` — export the
   intended profile explicitly when comparing.

## Bedrock Knowledge Base (PR bot)

- Prefer **`prod`** for listing / Retrieve (`dp-ai-code-review` lives against
  production-quality content; DEV often has no useful KB data).
- Pointer file:
  `Cursor/.cursor/skills/dimension-devils-advocate-unit-test/bedrock-kb-pointer.md`
- If `list-knowledge-bases` returns **empty** in prod+dev: document that in
  the pointer; continue devil’s advocate on **L1–L3**; ask Dom which account
  hosts the bot KB (may be outside DP engineer SSO accounts).

## Mutations

SSO refresh is **read/auth only**. Prod **mutations** (DROP, DynamoDB wipe,
Glue start that deletes) still need an explicit user yes per existing skills.
