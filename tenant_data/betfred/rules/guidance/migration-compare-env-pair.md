# Migration compare — declare the environment pair

When running or reporting `compare.py` / dimension validation (SQL Server vs
Redshift or Athena), **always say which pair** is in use. Do not assume.

## Canonical pairs (Prasath)

| Label | SQL Server (legacy) | AWS / warehouse (platform) | When |
|---|---|---|---|
| **test → Athena (Place 1)** | `BGB-BT-SQL-01` (test), Unity for complex dims | Athena over Iceberg (`{env}_dp_dwh_uk_digital.*` or approved dry-run CTAS); AWS profile usually `prod` or `dev` catalog | **Pre-commit / pre-DEV** — tip logic only; see `dimension-delivery-order` |
| **test → DEV** (Place 2) | Same test SQL | AWS profile `dev`, `dev-redshift-cluster`, DB `uk_digital` | After Glue deployed to DEV and gold ready |
| **test → prod RS** (Place 3) | Same test SQL | AWS profile `prod`, `prod-redshift-cluster`, `powerbi_user`, DB `uk_digital` | After job deployed to **prod** |

**No prod SQL Server** — do **not** use `BGB-BP-SQL-01` or any prod SQL host. There is no access.

### Three test places (one-liner)

1. Athena Iceberg tip vs test SQL (before DEV)  
2. test SQL → DEV Redshift (after DEV gold)  
3. test SQL → prod Redshift (after prod deploy)  

Full table: rule `dimension-delivery-order`.

Config files (git-ignored, under `data-platform-migration-data-test/`):

- **`.env`** — active pair (default: **test → DEV**)
- **`.env.dev`** — **test → DEV**
- **`.env.prod`** — **test → prod Redshift** (SQL still test/BT; name means “prod warehouse”)

## Before every compare

1. Read which `.env` / hosts / `AWS_PROFILE` will be used.
2. If AWS auth is expired: **`aws sso login --profile <dev|prod>`** for that
   pair, then retry — do not stop at “SSO expired” (`aws-sso-proactive`).
3. Tell the user in one line, e.g.  
 `Comparing: test SQL Server (…) → Athena Iceberg tip (Place 1, …)`  
 or `Comparing: test SQL Server (…) → DEV Redshift (uk_digital.dimension.<table>)`  
 or `Comparing: test SQL Server (…) → prod Redshift (…)`  
4. If the pair is ambiguous or they did not choose, **ask** before running.
5. When reporting match rates (e.g. “96%”), **repeat the compare pair** in the
   same breath — never “DEV data” or “prod” or “Athena” alone.

## Jira / PR / team chat (no “Place 1/2/3”)

**Place numbering is Cursor-internal only** (rules `dimension-delivery-order`,
chat with Prasath). **Never** put “Place 1”, “Place 2”, or “Place 3” in Jira,
Bitbucket, standup, or Slack.

| Internal (chat) | Betfred-facing (Jira / PR) |
|---|---|
| Place 1 | Pre-DEV logic check — **test SQL → Athena Iceberg** |
| Place 2 | **DEV validation** — test SQL → DEV Redshift |
| Place 3 | **Post-deploy prod validation** — test SQL → prod Redshift |

Jira comments: heading like **“Post-deploy prod validation”** or **“DEV
validation”**, then pair + window + metrics + PASS/FAIL. See
`dimension-validate` § Jira comments.

When posting via MCP `addCommentToJiraIssue`, use Betfred-facing wording only
— **self-contained** (rule `betfred-facing-no-cursor-leak`). No Alice/Bob/Carol,
“shelf-only”, or other triage nicknames unless the same sentence names the
real systems and why.

**Post-deploy prod validation must always include business key overlap from
test SQL Server** (intersection %, SQL-only, attribute match on shared keys).
Prod row-count / smoke checks alone do not close a dimension ticket.


### Special gate: `source-system-gap` (different pipes)

When triage classifies **`source-system-gap`** (e.g. SQL = CDC full DB, AWS =
API/report — DE-9549 `casino_pending_bonus`):

| Do | Do not |
|---|---|
| Gate on **BK intersection** attribute match | Require SQL total == Redshift total |
| `exclude_from_comparison` for accepted stubs (e.g. GBP=0) | FAIL every row on hardcoded measures |
| Justify SQL-only / RS-only in **private** reports (Alice/Bob OK); in **Jira** spell out CDC vs API | Treat all SQL-only as a Glue bug |
| Close on **test SQL → prod RS** with that contract | Close on smoke / DEV-only alone |

Still declare the pair every time. Skill: `dimension-validate` §5c /
§ Jira comments.

## Anti-patterns

- Using **prod SQL Server** (`BGB-BP`) — not available; refuse and use test SQL
- Running **test → prod RS** (Place 3) before the user said prod is deployed / asked for that pair
- Treating **Place 1 Athena** as a substitute for Place 2/3 Redshift gold
- Saying “compared DEV” without saying **test SQL Server → DEV Redshift**
- Using `EnterpriseDataMartUK` for Unity dimension tables (e.g. `DepositLimitHistory`) — dims are on **Unity**
- Trusting a green Glue run without checking whether gold was empty (one
  `ds_ts_processed` stamp) — see `legacy-parity-verification`
- Leaving shell `AWS_PROFILE` set so `.env` is ignored and the wrong account
  is used (often surfaces as Redshift cluster “doesn't exist in this region”)
- **FAILING `source-system-gap` dims solely because SQL row count ≠ Redshift**
  — use intersection + justified SQL-only (see DE-9549)
