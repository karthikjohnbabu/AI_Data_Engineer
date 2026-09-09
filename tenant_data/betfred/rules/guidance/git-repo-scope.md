# Git and Cursor artifact scope (Prasath)

## Git

When the user says **git push**, **git commit**, or "commit and push" without naming a repo:

- **Only** use `data-platform-glue-etl-transactional-data-jobs` (the Glue / data-jobs repo).
- Do **not** `git status` / `commit` / `push` / stage in sibling repos (`migration-data-test`, `etl-common`, `etl-customer`, legacy Unity, `Cursor/`, etc.).

Touch another repo only when the user **explicitly names it**.

Bitbucket remote errors that say “admin must whitelist your IP” mean **VPN is
off** — see rule `bitbucket-vpn`. Do not call it a whitelist problem.

## Never create `.cursor` under other repos

- Skills, rules, and agent config live **only** under the workspace folder **`Cursor/.cursor/`**.
- Do **not** create, copy, or commit `.cursor/` (or `.cursor/rules`, `.cursor/skills`) under:
  - `data-platform-glue-etl-transactional-data-jobs`
  - `data-platform-migration-data-test`
  - `data-platform-glue-etl-common`
  - `data-platform-glue-etl-customer`
  - `data-platform-legacy-enterprisedatawarehouseunity`
  - or any other sibling git repo
- If a `.cursor` folder was added under those repos by mistake, **delete it** (untracked) and keep rules/skills in `Cursor/` only.
