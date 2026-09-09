# Pre-deploy quality gate (data-jobs)

Before **merge to `dev`**, **Jenkins deploy**, or telling the user a Glue change is ready to deploy in `data-platform-glue-etl-transactional-data-jobs`:

## Required checks (touched Python)

Run against every changed Glue/Python file (repo root):

```bash
uvx ruff check <path>          # lint + import order (line-length 79)
uvx ruff format --check <path> # formatting; fix with: uvx ruff format <path>
uvx ty check <path>            # type check (staged-file model; awsglue unresolved OK)
```

Or on staged files: `pre-commit run ruff-check ruff-format ty --files <path>...`

## Standards (from repo)

- **ruff**: format, lint (`E`/`F`/`I`/`W`), line length **79** (`pyproject.toml`)
- **ty**: type check via pre-commit / `uvx ty check`
- **SQLFluff**: only if SQL files changed
- **Terraform**: `ci/terraform_checks.sh` / tflint / Checkov if `.tf` changed
- Do **not** skip hooks (`--no-verify`) unless the user explicitly asks

## Code comments (Glue jobs)

- **Do not** add inline `#` or SQL `--` comments that only document a fix (“legacy uses X”, “do not use Y”, ticket IDs).
- Prefer module/function docstrings or `Cursor/fixes/{dim}/notes.md`.
- See `dimension-fix` skill — default is **no new inline fix comments**.

## Gate behaviour

1. Run checks **before** Commit → merge to `dev` / push for deploy / watermark+drop reload that depends on new code (delivery order steps 3–5; see `dimension-delivery-order`).
2. If any check fails: **fix**, re-run, then continue. Do not merge/deploy with known lint/format/ty failures on touched files.
3. Report pass/fail briefly to the user when entering the DEV deploy gate (after Compare + DA/PR when following delivery order; first-ship may Commit→DEV first).
4. Skills/rules live only under `Cursor/.cursor/` — never add `.cursor/` under the data-jobs repo.
