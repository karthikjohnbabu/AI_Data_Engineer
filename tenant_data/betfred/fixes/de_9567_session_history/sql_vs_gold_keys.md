# Session history — SQL columns vs gold keys (2026-08-26)

## SQL Server `Dimension.SessionHistory` (test Unity)

| Column | Type | Role |
|---|---|---|
| **SessionHistoryID** | bigint IDENTITY | Warehouse surrogate (SQL-only) |
| **PlayerID** | int | Player surrogate from `Sharp.Player` |
| **PlayerBK** | int | Player business key |
| **LoginDate** | datetime2 | Session start |
| **LogoutDate** | datetime2 | Session end |

## Redshift `dimension.session_history` (DEV = same shape)

| Column | Role |
|---|---|
| **bvt_action_id** | Login event id from BVT — **MERGE grain** (not IDENTITY) |
| **player_bk** | = SQL PlayerBK |
| **logindate** / **logoutdate** | = LoginDate / LogoutDate |
| **ds_tsprocessed** | Platform audit |

No `session_history_id`, no `player_id`.

---

## Other dims we worked — surrogate pattern

| Dim | SQL IDENTITY / surrogate | Redshift gold MERGE / player keys | Copies SQL IDENTITY? |
|---|---|---|---|
| **deposit_limit_history** | `DepositLimitHistoryID` IDENTITY; `PlayerID` int | MERGE `player_deposit_limit_bk`; `sgp_player_id` (hash) + `customer_id_legacy`; **no** `deposit_limit_history_id` | **No** |
| **timeout** | `TimeoutID` IDENTITY; `PlayerID` int | MERGE `sgp_timeout_id`; `player_bk` + `sgp_player_id`; **no** `timeout_id` | **No** |
| **session_history** | `SessionHistoryID` IDENTITY; `PlayerID` int | MERGE `bvt_action_id`; `player_bk` only; **no** `session_history_id` / `player_id` | **No** |

**Why no surrogate here:** same platform rule as DLH / timeout — gold uses a **stable source key** for MERGE, not a Redshift IDENTITY twin of SQL’s `*ID`. For sessions that key is the BVT login id (`bvt_action_id`). SQL `SessionHistoryID` is created only because SQL INSERT doesn’t carry a source session id.

## Field match — SQL vs RS (live 2026-08-26)

| SQL column | RS column | Match? |
|---|---|---|
| SessionHistoryID (IDENTITY) | — | **No** — platform uses source key instead |
| PlayerID | — | **No** — meeting: `player_bk` enough |
| PlayerBK | player_bk | **Yes** (int) |
| LoginDate | logindate | **Yes** (datetime / timestamp) |
| LogoutDate | logoutdate | **Yes** |
| — | bvt_action_id | **RS-only** — MERGE grain (BVT login id) |
| — | ds_tsprocessed | **RS-only** — platform audit |

**Business fields that compare:** 3/3 mapped (`PlayerBK`, `LoginDate`, `LogoutDate`).  
**Not 1:1 schema clone:** SQL surrogates absent on RS; RS has event id + audit.
