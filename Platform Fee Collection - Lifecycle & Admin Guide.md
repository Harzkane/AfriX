# Platform Fee Collection – Lifecycle & Admin Guide

**Last updated:** February 2026  
**Status:** Implemented and in use

This document describes the platform fee collection system, how fees flow from user actions into platform wallets, and how admins monitor and use the system.

---

## 1. Overview

The platform collects fees on:

| Flow | Fee (configurable) | Collected in token | Where it goes |
|------|--------------------|--------------------|----------------|
| **P2P Transfer** | 0.5% | Same as transfer (NT/CT/USDT) | Platform wallet for that token |
| **Token Swap** | 1.5% | Source token (e.g. NT → CT: fee in NT) | Platform wallet for source token |
| **Merchant payment** | e.g. 2% (per merchant) | Same as payment | Platform wallet for that token |

All fees are credited to **platform-owned wallets** (one per token: NT, CT, USDT). These wallets are owned by a **system user** (`platform@afritoken.com`) that **must never be used to log in** (no password is stored or needed for login).

---

## 2. One-Time Setup

### 2.1 Run migrations

From `afriX_backend`:

```bash
node migrations/runner.js
```

Relevant migrations:

- **20250212000000-create-notifications-and-settings.js** – Notifications (idempotent; safe to re-run).
- **20250217000000-add-fee-wallet-id-to-transactions.js** – Adds `transactions.fee_wallet_id` (idempotent).

Expected output:

```
✅ Database connected
{ event: 'migrating', name: '...' }
{ event: 'migrated', name: '...', durationSeconds: ... }
✅ Migrations executed successfully
```

### 2.2 Initialize platform user and fee wallets

Run **once** (or again safely; it will reuse existing user/wallets):

```bash
node scripts/init-platform-user.js
```

This will:

1. Create the platform system user `platform@afritoken.com` (if missing).
2. Create or reuse three wallets for that user: **NT**, **CT**, **USDT**.
3. Print platform user id, wallet ids, and current fee balances (initially 0).

**Platform user:**

- **No password needed.** A random password is set and not stored anywhere. This account must never be used to log in.
- It exists only to own the platform fee wallets.

### 2.3 Optional environment variables

In `.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLATFORM_USER_EMAIL` | `platform@afritoken.com` | Email of the platform system user |
| `FEE_COLLECTION_ENABLED` | `true` | Set to `false` to disable collecting fees (e.g. testing) |

---

## 3. Configuration

### 3.1 Platform config (`src/config/constants.js`)

- **PLATFORM_CONFIG**
  - `SYSTEM_USER_EMAIL` – Platform user email.
  - `FEE_COLLECTION_ENABLED` – Master switch for fee collection.

- **PLATFORM_FEES** (percent)

  - `P2P_TRANSFER`: 0.5  
  - `TOKEN_SWAP`: 1.5  
  - `MERCHANT_COLLECTION`: 2.0 (default; merchants can override)  
  - `AGENT_FACILITATION`: 1.0 (reserved for future use)

### 3.2 Key files

| File | Role |
|------|------|
| `src/services/platformService.js` | Platform user, platform wallets, `collectFee()`, balance helpers |
| `src/services/walletService.js` | Transfer + swap; calls `platformService.collectFee()` and sets `fee_wallet_id` |
| `src/services/transactionService.js` | Merchant payment; calls `platformService.collectFee()` and sets `fee_wallet_id` |
| `src/models/Transaction.js` | `fee`, `fee_wallet_id` on transactions |

---

## 4. User Lifecycle (Where Fees Are Collected)

### 4.1 P2P Transfer

1. User A sends tokens to User B (e.g. 1,000 NT).
2. Fee: 0.5% = 5 NT. User A is debited 1,005 NT; User B receives 1,000 NT.
3. **5 NT** is credited to the **platform NT wallet** in the same DB transaction.
4. A **Transaction** row is created with `type: 'transfer'`, `fee: 5`, `fee_wallet_id: <platform NT wallet id>`.

### 4.2 Token Swap

1. User swaps e.g. 10,000 NT → CT.
2. Fee: 1.5% = 150 NT (taken from source token). User is debited 10,000 NT; after fee, 9,850 NT is converted at rate to CT.
3. **150 NT** is credited to the **platform NT wallet**.
4. A **Transaction** row is created with `type: 'swap'`, `fee: 150`, `fee_wallet_id: <platform NT wallet id>`.

### 4.3 Merchant Payment (Collection)

1. Customer pays merchant e.g. 5,000 NT; merchant fee 2% = 100 NT.
2. Customer is debited 5,000 NT; merchant receives 4,900 NT.
3. **100 NT** is credited to the **platform NT wallet**.
4. A **Transaction** row is created with `type: 'collection'`, `fee: 100`, `fee_wallet_id: <platform NT wallet id>`.

### 4.4 Mint / Burn (agents)

- Agent **commission** is tracked on the transaction (`fee` and agent earnings) and goes to the agent.
- Platform **facilitation** fee (e.g. 1%) is not yet collected; reserved for future use.

---

## 5. Admin Lifecycle

### 5.1 Viewing platform fee balances

**Endpoint:** `GET /api/v1/admin/financial/platform-fees/balances`  
**Auth:** Admin only.

Response example:

```json
{
  "success": true,
  "data": {
    "balances": {
      "NT": 255.5,
      "CT": 120.25,
      "USDT": 0
    },
    "wallet_ids": {
      "NT": "c4bb7786-5bd7-4268-b7b6-fd2465900370",
      "CT": "135800e5-5a71-404b-862f-30c14c4e6ae3",
      "USDT": "866a4ee2-c01c-4858-a74e-ff3fc00e9465"
    }
  }
}
```

Use this to see how much fee has been collected per token (NT, CT, USDT).

### 5.2 Platform fee report

**Endpoint:** `GET /api/v1/admin/financial/platform-fees/report`  
**Auth:** Admin only.  
**Query (optional):** `start_date`, `end_date`, `type` (e.g. `transfer`, `swap`, `collection`).

Response example:

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_transactions_with_fees": 150,
      "total_fees_collected": 1250.75
    },
    "by_type": [
      { "type": "transfer", "token_type": "NT", "count": 80, "total_fee": 400.5 },
      { "type": "swap", "token_type": "NT", "count": 45, "total_fee": 600.25 },
      { "type": "collection", "token_type": "NT", "count": 25, "total_fee": 250 }
    ],
    "by_token": {
      "NT": 1250.75,
      "CT": 0,
      "USDT": 0
    }
  }
}
```

Use this for reporting and analytics (by period and/or transaction type).

### 5.3 Other admin financial endpoints

- **Transaction stats:** `GET /api/v1/admin/financial/transactions/stats` – includes `total_fees_collected` (sum of `Transaction.fee`).
- **List transactions:** `GET /api/v1/admin/financial/transactions` – filter by type/status; each row has `fee` and `fee_wallet_id` when applicable.
- **Wallet stats / list:** `GET /api/v1/admin/financial/wallets/stats`, `GET /api/v1/admin/financial/wallets` – platform fee wallets appear as normal wallets owned by the platform user.

### 5.4 Disabling fee collection

Set in `.env`:

```env
FEE_COLLECTION_ENABLED=false
```

When disabled, fees are still **calculated and stored** on the transaction (`fee`), but **no amount is credited** to the platform wallets. Useful for testing or temporary rollback.

---

## 6. Data Model (Summary)

- **User**  
  - One system user: `platform@afritoken.com` (role admin). No login; random password, not stored.

- **Wallet**  
  - Platform has three wallets: NT, CT, USDT (same model as user wallets, `user_id` = platform user id).

- **Transaction**  
  - `fee`: amount taken as fee.  
  - `fee_wallet_id`: wallet that received the fee (platform wallet id when fee was collected).  
  - Used for transfer, swap, collection (and future agent facilitation).

---

## 7. Quick Reference

| Action | Command / Endpoint |
|--------|--------------------|
| Run migrations | `node migrations/runner.js` |
| Init platform user & wallets | `node scripts/init-platform-user.js` |
| Admin: fee balances | `GET /api/v1/admin/financial/platform-fees/balances` |
| Admin: fee report | `GET /api/v1/admin/financial/platform-fees/report?start_date=...&end_date=...&type=...` |

---

## 8. Changelog (Platform fee collection)

- **Feb 2026**
  - Added platform system user and NT/CT/USDT fee wallets.
  - Implemented fee collection in P2P transfer, token swap, and merchant collection.
  - Added `transactions.fee_wallet_id` and migration (idempotent).
  - Added admin endpoints: platform fee balances and platform fee report.
  - Made notifications migration idempotent so runner completes successfully.
