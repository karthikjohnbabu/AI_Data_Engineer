# Bitbucket / git remote — VPN (not whitelist)

When `git fetch`, `git pull`, `git push`, or clone against Bitbucket
(`bitbucket.org` / `sharpgaming/...`) fails with any of:

- `To access this repository, an admin must whitelist your IP`
- `Could not read from remote repository`
- SSH / HTTPS auth seeming fine but remote unreachable for Bitbucket only

**That message is misleading for Prasath.** The fix is **connect the
corporate VPN**, not ask an admin to whitelist an IP.

## Required behaviour

1. **Say VPN** — tell the user to connect VPN (or confirm it is up). Do **not**
   diagnose as “IP whitelist” / “ask admin to whitelist”.
2. **Do not** merge onto a stale local `origin/dev` (or any tracking branch)
   while fetch is failing — undo or avoid that merge; remake after a successful
   `git fetch`.
3. After VPN is up, **retry** `git fetch` then the original push/merge/deploy
   step. Do not leave deploy half-done with only a local merge.
4. AWS SSO and Bitbucket VPN are separate — VPN does not replace
   `aws sso login`; SSO does not fix Bitbucket.

## Anti-patterns

- Telling the user “Bitbucket IP whitelist blocked push”
- Asking them to raise a whitelist ticket with Bitbucket/admin
- Pushing a merge built while `origin/*` could not be refreshed
