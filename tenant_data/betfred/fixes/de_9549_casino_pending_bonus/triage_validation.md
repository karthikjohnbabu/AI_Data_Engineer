# DE-9549 — triage validation (ground work) — BIG SUMMARY

**Open this first (MD):** this file  
**Open this first (browser):** `triage_validation.html` (same folder)

| | |
|---|---|
| **Ticket** | [DE-9549](https://betfred.atlassian.net/browse/DE-9549) — IN DEVELOPMENT (Prasath) |
| **Title** | Casino_PendingBonus migration findings (5 Critical, 5 Medium, 3 Enhancements) |
| **Related** | [DE-7392](https://betfred.atlassian.net/browse/DE-7392) Done — stood up IMS/report path; GBP/wagering stubbed 0 |
| **Epic** | DE-9432 |
| **Classification** | `source-system-gap` + Glue bugs (`bonus_bk`, `amount_gbp`) |
| **Last refresh** | **2026-09-08** — API missing-column ladder + one-stop triage |

**One-stop:** this file + **`triage_validation.html`** (same folder). Report pack under `validation/reports/` is secondary.

Live checks: Iceberg **1,109,827** actions / **312,122** pendings; tip currencies **GBP 311,372 / EUR 750**; prod gold **100%** `amount_gbp=0`. **bonus_bk** → ship `template_code`. **amount_gbp** → ask Playtech first (no AmountGBP in mapping xlsx); Option B = SGP FX only if they say no.

---

## 0. Big summary — explain like a layman

### What is this table?

`casino_pending_bonus` = one row per **casino bonus voucher** offered to a player (free spins, deposit match, etc.): how much, when it started, whether they accepted/redeemed it, status text, etc.

Reporting (Power BI) needs it on AWS. Old warehouse already has it on **SQL Server**.

### Why don’t the two warehouses match?

| Old fridge (SQL) | New fridge (AWS) |
|---|---|
| Full **Casino / BetfredWorld** database via **CDC** | Playtech **IMS report API** only |
| Sees vouchers waiting, approved on the shelf, silent cleanup | Only prints when something **happens at the till** (issue / accept / redeem / cancel / …) |
| ~**165.6 million** rows | ~**312 thousand** unique vouchers |

Ehsan on DE-7392: BetfredWorld table **won’t be CDC’d to AWS** — replaced by **IMS reports**. So the gap is **by design**, not a forgotten job.

### Three people to remember

| Who | Story | What to do |
|---|---|---|
| **Alice** | Issued → accepted → redeemed. On **both** sides | Compare her fields (amount, redeemed, …). After fix, also `bonus_bk` |
| **Bob** | Waiting for approval / on shelf / auto-cleanup. **SQL only** | **Do not** “fix in Glue”. Document as expected SQL-only |
| **Carol** | On both sides, but AWS `amount_gbp` / wagering = **0** | Heal amount_gbp (GBP copy + EUR FX); wagering still exclude |

### One real Glue bug we found (not in the original 5+5+3 list)

Glue line 96: `a.code AS bonus_bk`.  
`code` = till **receipt line number** (~5.5e8).  
Legacy `BonusBK` / Mark’s **Template code** = product catalogue id (~36k–45k).  
**Fix:** `a.template_code AS bonus_bk`. Proved in Athena 2026-09-07 (0/312k where code equals template).

### What “done” means for this ticket

**Not** SQL rows = Redshift rows.  
**Yes** = Alice intersection looks good on agreed fields + Bob/Carol documented + known Glue fixes shipped + API feed healthy.

---

## 1. Related tickets & story

| Ticket | Status | Role |
|---|---|---|
| **DE-7392** | **Done** | Bridie asked for dim on AWS. Mark: need `DER_Bonus_Actions` + `Reporting___Player_bonus_information`. Sowmiya: lambda/configs/dim job. Mark said BonusBK=`a.code` (superseded by Excel Template code). **BonusWagering** always zero since Aug 2025 — **not** a clear AmountGBP=0 instruction (Sowmiya mapped AmountGBP←`a.amount`). |
| **DE-9549** | **IN DEVELOPMENT** | Complex-dim migration findings against the Glue job that DE-7392 created. |
| **DE-8303** | Closed | Linked from DE-7392 (web handler) — historical, not active for close. |
| **PR #716** | Merged era | LEFT JOIN / UTC / NULL preserve work Ravi referenced. |

---

## 1b. Related tickets — closed-claim audit (DE-7392)

**Why DE-7392 closed:** IMS/report path stood up; dim job + API configs in prod; daily export running. Done ≠ “AmountGBP must stay 0 forever.”

| Claim we inherited | Exact quote / who | Column(s) named | Live check | Keep / supersede |
|---|---|---|---|---|
| amount_gbp leave 0 as DE-7392 stub | Inferred from “stubs”; **no** Mark quote naming AmountGBP=0 | Mis-attributed to AmountGBP | Glue `CAST(0)`; Sowmiya mapped AmountGBP←amount; SQL has real AmountGBP | **Supersede** — ship GBP copy + EUR FX |
| BonusWagering always 0 | Mark 2026-04-01: “always zero (since 21 Aug 2025)” | **BonusWagering** | Prod gold 312k/312k = 0; no feed field | **Keep** — exclude until source |
| BonusBK = a.code | Mark 2026-04-01 | BonusBK / a.Code | Athena 0/312k code=template; Excel Template code | **Supersede** → `template_code` |

---

## 2. Issue-by-issue board (every Jira finding + extras)

For each: **layman meaning** · **can we fix in Glue?** · **justification** · **validation** · **status**.

### Critical (from DE-9549 description)

#### C1 — `amount_gbp` hardcoded to 0
- **Layman:** AWS writes **£0 on every row**. Feed is GBP + EUR only.
- **Why zero?** Glue `CAST(0 …)`. DE-7392 Mark “always zero” was **BonusWagering**; Sowmiya mapped AmountGBP ← `a.amount`. Not “FX missing.”
- **Missing-column ladder (API path) — do in this order:**
  1. **Exhausted:** Playtech DSR mapping xlsx (**CasinoPendingBonus** + **columns mapping**, incl. hidden rows) — **no AmountGBP / no GBP string**; curls xlsx — no AmountGBP; Iceberg DER/player-bonus — **Amount** + **currency_code** only; legacy GBP via **Casino.ExchangeRate** / **IMSCurrency** + Accept→Start (not on AWS feed today).
  2. **Ask why** AmountGBP is not on DER / player-bonus reports.
  3. **Ask Playtech first** (via Elena/Andrew): add AmountGBP **or** publish IMS Currency / Conversion rate for AWS **or** confirm N/A + rate date (legacy Accept→Start).
  4. **Option B only if Playtech says no:** GBP → `amount_gbp = amount`; EUR → LEFT JOIN **sgp_currency** + **sgp_currency_exchange_rate** (bk 2→4) on agreed rate date — platform approximation; parity vs SQL not guaranteed (legacy used Casino rates).
- **Test SQL (2026-09-07):** when AmountGBP ≠ 0, **99.05%** equal Amount; **409,907** true FX (~0.86).
- **Live EUR `3998057901`:** SQL AmountGBP **0.8591** ≈ SGP action-day rate **0.85898** (useful for Option B design only).
- **Status:** **OPEN — vendor ask first**; do not ship Option B as the default until Playtech answers.

#### C2 — `bonus_wagering` hardcoded to 0
- **Layman:** Wagering remaining blanked. Mark: zero since 21 Aug 2025 on new path.
- **Customer sense?** Do **not** use in AWS PBI until a real source is agreed; prefer SQL or exclude.
- **Validation:** **312,122 / 312,122** = 0.

#### C3 — `message_id` mapped from `bonus_name`
- **Layman:** Column called message_id holds a **bonus name** string instead of a message id.
- **Can Glue fix?** **No change needed** — Jira status: legacy SQL does the same (`bonus_name AS message_id`); logic **confirmed correct**.
- **Status:** **Accepted as-is**.

#### C4 — UTC → UK local missing on dates
- **Layman:** Times were up to 1 hour wrong vs SQL near BST.
- **Can Glue fix?** **Yes — done.** `FROM_UTC_TIMESTAMP(..., 'Europe/London')` on start/end/request/accept/redeem (+ DLM path).
- **Status:** **Fixed in tip.**

#### C5 — Watermark only on action table, not reporting table
- **Layman:** If only the “dates” table updates, incremental run might miss it.
- **Can Glue fix?** Tip already ORs `a.ds_tsprocessed` **or** `b.ds_tsprocessed`. Jira also said “main table only” for similar tickets — current code **already watches both**.
- **Status:** **Addressed in tip** (verify after next deploy if any old build lacked it).

### Medium

#### M1 — `bonus_admin_code` NULL → -1
- **Layman:** Blank admin became fake **-1**.
- **Fix:** Preserve NULL (`a.admin_code AS bonus_admin_code`).
- **Validation:** Aug intersection **100%** match on `bonus_admin_code`.
- **Status:** **Fixed.**

#### M2 — `free_spins_remaining` NULL → 0
- **Layman:** Blank free-spins became fake **0**.
- **Fix:** Preserve NULL from source.
- **Validation:** Aug intersection **~93%** match (residual null/value drift).
- **Status:** **Fixed** (residuals acceptable / investigate only if needed).

#### M3 — `redeemed` from redeem date, not a flag
- **Layman:** We infer “redeemed?” from whether a redeem date exists.
- **Can Glue fix differently?** **No** — Nathan/Andrew confirmed correct; no direct flag on report.
- **Validation:** Aug intersection **~95.7%** on `redeemed`.
- **Status:** **Accepted.**

#### M4 — No BonusID / PlayerID surrogates
- **Layman:** Old SQL invented till-receipt numbers (IDENTITY). AWS uses real business codes.
- **Can Glue recreate?** **Should not** — Nathan/Andrew: not a gap; check downstream doesn’t need IDENTITY ints.
- **Status:** **Accepted** (document for consumers).

#### M5 — `date_last_modified` semantics
- **Layman:** Not a pure “row updated in warehouse” stamp; built from lifecycle dates (LEAST/GREATEST) + UK convert.
- **Can match SQL 1:1?** Often **no** — SQL business change vs AWS formula + bulk reload stamps (19 Aug 2026).
- **Validation:** Aug DLM compare **0%** on DLM; RS bulk stamp proven.
- **Status:** **Document / exclude from gate**; use `start_date` for windows.

### Enhancements (nice-to-haves)

| E# | Item | Status |
|---|---|---|
| E1 | ROW_NUMBER dedup on `action_date` | **In tip** |
| E2 | DynamoDB watermark | **In tip** |
| E3 | Hash `pending_bonus_id` | **In tip** |

### Extra findings (comments + our validation — not in original 5/5/3)

#### X1 — Population gap (Bob) / source-system-gap
- **Layman:** SQL fridge ≫ AWS fridge.
- **Glue fix?** **No.**
- **Validation:** Full SQL ~165.6M vs gold ~312k; Aug SQL-only **1.44M**.
- **Status:** **By design** — close on Alice only.

#### X2 — INNER JOIN silent delete → LEFT JOIN
- **Layman:** Missing reporting row used to delete the whole bonus.
- **Status:** **Fixed** (PR #716 / tip LEFT JOIN).

#### X3 — API down / API version switch (Elena Aug)
- **Layman:** Printer off → no till receipts.
- **Validation 2026-09-07:** feed **live** (S3/Athena through today). Personal Report Viewer AAS login **optional** (Prasath blocked — not required).
- **Status:** **Ops OK now**; keep watching freshness.

#### X4 — Status / type vocabulary clash
- **Layman:** SQL says `waiting`/`removed`; AWS says `Issued`/`Wagering completed`.
- **Glue fix?** Translation table or **exclude from gate**.
- **Validation:** ~0% status/type match on Aug intersection.
- **Status:** **Exclude / map later.**

#### X5 — `bonus_bk` = action `code` instead of `template_code` (**NEW**)
- **Layman:** Wrong label on the coupon product.
- **Glue fix?** **Yes — must ship** line 96.
- **Evidence:** Mark Excel Template code = `casino.Bonuses.code`; Athena 0/312k code=template; tip vs gold flips all sample keys.
- **Note:** Mark’s DE-7392 comment said BonusBK=`a.code` — **superseded** by his workbook + live numbers.
- **Status:** **OPEN — ship fix + reload.**

#### X6 — `player_bk` = Playtech `player_code` ≠ `CasinoPlayerID`
- **Layman:** Two different player number systems.
- **Glue fix?** Needs crosswalk — **follow-up**, not Alice amount gate.
- **Validation:** 0% on Aug intersection.
- **Status:** **OPEN follow-up.**

#### X7 — Possible false BK pairs / wild start_date gaps
- **Layman:** Same pending number, start dates years apart → maybe not the same voucher story.
- **Action:** Spot-check Alice keys after `template_code` fix; prefer start_date windows.
- **Status:** **Watch on re-gate.**

---

## 3. What CAN be done vs CANNOT (decision matrix)

| Goal | Can? | How / why not |
|---|---|---|
| Make AWS row count = SQL | **Cannot** | Different source pipes |
| Interim `amount_gbp` for GBP rows | **After Playtech answer** | Option B piece if vendor N/A |
| Full FX `amount_gbp` (EUR→GBP) | **Ask Playtech first** | Option A: AmountGBP or IMS Currency; Option B: SGP only if no |
| Real `bonus_wagering` | **Ask Playtech / product** | Related wagering fields exist under other names; Mark said always 0 since Aug 2025 |
| Fix UK dates / NULLs / LEFT JOIN | **Done** | In tip |
| Fix `bonus_bk` | **Can — do next** | `template_code` |
| Match status words | **Not without map** | Exclude for close |
| Match player ids | **Not without crosswalk** | Follow-up |
| Prove API healthy | **Can without UI** | S3 + Athena |
| Login Report Viewer yourself | **Optional** | AAS entitlement; skip for ticket |

---

## 4. Validation checks (evidence log)

| Check | Pair / engine | Result | Date |
|---|---|---|---|
| Aug DLM compare | test SQL → prod RS | SQL 1.49M · RS 295k · ∩ 57k · 0 full match | 2026-09-03 |
| Best Alice fields | same | amount 95.5% · redeemed 95.7% · admin 100% · free spins 93% | 2026-09-03 |
| Full population | SQL / Iceberg / RS | 165.6M / 312k pendings / 312k gold | 2026-09-03–07 |
| Carol stubs | prod RS | 312122/312122 gbp=0 & wagering=0 | **2026-09-07** |
| API freshness | Athena | max `ds_tsprocessed` **2026-09-07 00:48 UTC** · 1.11M actions | **2026-09-07** |
| `code` vs `template_code` | Athena tip | **0 equal / 312,122** latest | **2026-09-07** |
| Tip vs gold amount | 52 keys | **52/52** | 2026-09-07 |
| Tip template vs gold bonus_bk | 52 keys | **0/52** until reload | 2026-09-07 |
| Mark workbook | local xlsx | Template code = Bonuses.code | 2026-09-07 |
| Report Viewer UI | AAS login | Prasath **no access** — not required | 2026-09-07 |
| Test SQL keyed BonusBK join | VPN | Timeout — re-run when VPN up | 2026-09-07 |

---

## 5. Links followed (inventory)

| Link | Result |
|---|---|
| https://admin.betfred.com/reportviewer/api/report/execute/export | Live prod API path; `DER_Bonus_Actions` |
| https://admin.betfred.com/reportviewer/ | UI; AAS login required |
| [DE-7392](https://betfred.atlassian.net/browse/DE-7392) | Parent delivery story; IMS replace CDC; Mark mapping; stubs |
| [DE-9549](https://betfred.atlassian.net/browse/DE-9549) | Findings table + comments (Ravi/Elena/Andrew) |
| Mark SharePoint / **Playtech - DSR-reports-field-mappings -PT m.xlsx** | **CasinoPendingBonus** + **columns mapping** (unhide rows): Template code → casino.Bonuses.code (row 10); **AmountGBP not present** anywhere in workbook |
| **betfred_reports_curls (pt casino).xlsx** | Report IDs / curls; **no AmountGBP** |
| Legacy `usp_etl_table_transform_2_casino_pendingbonus` | AmountGBP via **Casino.ExchangeRate** ×2 + Accept→Start; rates from **IMSCurrency** |
| Bitbucket api-configuration-data.tf | Private 404; use DynamoDB |
| Report Execution API / Viewer Guide PDFs | On ticket; human field review still useful |
| PR #716 | LEFT JOIN / UTC era |

---

## 5b. AmountGBP — missing-column ladder (2026-09-08)

| Step | Result |
|---|---|
| 1. Mapping + schema exhaust | No AmountGBP on DER / player-bonus mapping or Iceberg; have Amount + currency_code |
| 2. Why missing on API? | **OPEN — ask Playtech** |
| 3. Ask vendor first | Add AmountGBP **or** land IMS Currency / Casino.ExchangeRate equiv **or** confirm N/A |
| 4. Option B if no | SGP **sgp_currency** + **sgp_currency_exchange_rate**; rate date TBD (legacy Accept→Start; SGP action_date was exploratory only) |

---

## 6. Close criteria (updated)

1. Product accepts Bob gap (source-system-gap).  
2. Ship **`a.template_code AS bonus_bk`** + gold **reload**.  
3. **AmountGBP:** Playtech answer recorded; then Option A or Option B; gold reload.  
4. Re-compare Alice (prefer `start_date` / Iceberg keys): amount, redeemed, admin, free spins; exclude wagering/status/type/DLM as agreed (GBP per decision).  
5. Document Carol + player_bk follow-up.  
6. API freshness green (Athena/S3).  
7. Jira **Post-deploy prod validation** with BK overlap (test SQL → prod RS).

**Do not** Done on Aug DLM full-count FAIL alone.  
**Do not** ship SGP FX as default before Playtech answers.

---

## 7. Next actions for Prasath

1. Patch Glue L96 → `template_code` (Glue bug — independent of Playtech).  
2. Elena/Andrew → Playtech: AmountGBP / IMS Currency / rate date (attach mapping xlsx).  
3. Only after Playtech: implement Option A or Option B; DEV + reload.  
4. VPN → re-check SQL BonusBK vs template on sample keys.  
5. Paste closeout on Jira when Alice gate passes.  
6. Skip Report Viewer unless IT grants AAS.

---

## 8. Report pack

| File | Use |
|---|---|
| **`triage_validation.md` / `.html`** | **Primary** — this big summary |
| `de_9549_final_verdict.html` | Extra diagrams / tip walkthrough |
| `de_9549_how_to_close_*.html` | Jira paste A/B |
| `athena_verdict/` | Raw tip extracts |
| `prod_2026-08/` | Aug compare artefacts |
| Mark xlsx | Field mapping source |

---

## Appendix A — Aug DLM numbers (short)

SQL 1,494,618 · RS 294,894 · ∩ 57,204 · SQL-only 1,437,414 · RS-only 237,690 · all-cols equal **0**.  
Reproduce: `compare.py` profile `casino_pending_bonus.yaml` `--start 2026-08-01 --end 2026-08-31` with `.env.prod`.

## Appendix B — Glue tables

`a` = `ptcasino_der_bonus_actions` · `b` = `ptcasino_reporting_player_bonus_information` · gold = `dimension.casino_pending_bonus` · control = DynamoDB watermark.

---

*Refreshed 2026-09-07 — full Jira 5C/5M/3E + X1–X7 extras + live validation.*
