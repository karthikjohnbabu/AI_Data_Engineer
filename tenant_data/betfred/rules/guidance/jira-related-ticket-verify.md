# Related / closed Jira tickets — question & verify

When the active ticket (`DE-*`) **links to**, **cites**, or **inherits behaviour
from** another Jira issue that is **Done / Closed / Resolved** (or “leave as-is”
/ “accepted stub” language):

## Hard rule

**Done ≠ proven still correct.** Do not copy a closed ticket’s conclusions into
triage, compare excludes, PRs, or standup as settled fact until verified.

Worked failure (DE-9549 ← DE-7392): triage treated `amount_gbp = 0` as
“DE-7392 stub / leave hardcoded.” Live read showed Mark’s “always zero” was
**BonusWagering**, while Sowmiya mapped **AmountGBP ← `a.amount`**. The Glue
hardcode was job behaviour, not a clear Done-ticket instruction for GBP.

## Required when a related ticket appears

1. **Fetch** the related issue (description + comments), not only the link text
   on the current ticket.
2. **Ask why it closed** — what was the Done criterion? Dim stood up? API live?
   Full field parity? Explicit “leave column X = 0 forever”?
3. **Attribute map** — for every claim we inherit (`hardcoded 0`, BonusBK =
   `a.code`, exclude from compare, etc.):
   | Claim | Who said it | About which column? | Still true live? |
   Quote **column names** exactly — never expand “zeros” / “stubs” to sibling
   measures without proof.
4. **Verify live** — Glue tip, Iceberg/Redshift, and/or test SQL. If live
   disagrees with the closed comment, **supersede** the comment (document who
   / when / evidence). Mark’s DE-7392 `BonusBK = a.code` vs Excel
   `template_code` is the other worked example.
5. **Write it down** in `triage_validation.md` (or DA / PR notes): section
   **Related tickets — closed-claim audit** with PASS/FAIL per claim.

## Fail triage / ground work if

- We cite a Done ticket as the reason to leave a measure wrong, and there is
  **no** closed-claim audit table, **or**
- We attribute a stub/zero to the wrong column without quoting the comment.

## Anti-patterns

- “Ticket says leave hardcoded” without opening that ticket’s comments
- “DE-XXXX stubbed GBP and wagering” when only one column was named
- Treating Done as “do not reopen engineering judgment”
- Skipping live check because the related ticket is old

## Related

- Skill `dimension-triage` § Related / closed tickets
- Rule `jira-comment-links-follow` (follow links; this rule = verify claims)
- Skill `dimension-devils-advocate-unit-test` (L3 must re-check inherited claims)
