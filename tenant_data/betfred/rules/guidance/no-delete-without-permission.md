# No deletes without permission (HARD RULE)

## Never do without an explicit yes in the **same** user message

- `rm`, `rm -rf`, `Delete` tool, trash, wipe, unlink of:
  - folders (including `.cursor/`, repo roots, `Newton/`, `fixes/`, etc.)
  - files the user did not name for deletion
- “Clean up”, “remove related”, “strip X” does **not** mean delete a repo,
  `.env`, SSH keys, or whole rule trees unless they say **delete** /
  **remove the folder** / **yes delete** clearly.

## Prefer

- Remove a folder from the **workspace** `.code-workspace` only (stops
  indexing) without deleting disk contents
- Disable / stop applying a rule without deleting the file, unless asked
- Ask one short confirm before any destructive cleanup

## Allowed without extra confirm

- Deleting files **you created in this turn** as an obvious undo of a bad
  edit the user rejected, or replacing content via Write/StrReplace
- `git checkout --` / revert of tracked files only when the user asked to
  discard those changes

## Lesson

Betfred vs Newton: user may want **this chat** Betfred-only and another
window for Newton — that means workspace focus, **not** deleting `Newton/`.
