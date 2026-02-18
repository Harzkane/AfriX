# Send, Receive and Swap — Full Lifecycle Documentation

This document describes the **end-to-end lifecycle** of **Send Tokens** (P2P transfer), **Receive Tokens** (how receiving works), and **Swap Tokens** (in-app conversion between NT, CT, USDT) from the mobile app through the backend to the admin dashboard, including data flow, fees, and where each appears.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Send Tokens (P2P Transfer) Lifecycle](#2-send-tokens-p2p-transfer-lifecycle)
3. [Receive Tokens Lifecycle](#3-receive-tokens-lifecycle)
4. [Swap Tokens Lifecycle](#4-swap-tokens-lifecycle)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Admin Dashboard](#6-admin-dashboard)
7. [API Reference](#7-api-reference)
8. [Database and Side Effects](#8-database-and-side-effects)
9. [Code verification (backend & mobile)](#9-code-verification-backend--mobile)

---

## 1. Overview

| Flow | What happens | Backend | Outcome |
|------|--------------|---------|---------|
| **Send** | User A sends tokens to User B (by email). | Single API call: debit A, credit B, create TRANSFER transaction. | Instant; B sees balance increase. |
| **Receive** | User B does not call an API to "receive". B shares QR or email; A scans/enters and **sends**; the same Send API credits B. | Receive = other side of Send. | B's wallet is credited when A completes transfer. |
| **Swap** | User converts tokens from one type to another (e.g. NT → CT) in their own wallets. | Single API call: debit from_wallet, credit to_wallet, create SWAP transaction. | Instant; one balance down, other up. |

- **Send** and **Swap** are **single-step, synchronous** operations: no pending states, no agent, no escrow. They complete immediately or fail with an error.
- **Receive** is **passive**: the receiver only provides a way to be identified (QR containing email + token type, or shareable email). The actual credit happens when someone else calls the Send API targeting that email.

---

## 2. Send Tokens (P2P Transfer) Lifecycle

### 2.1 Flow summary

```
Sender: Choose recipient (email or scan QR) → Enter amount + optional note → Confirm (optional biometric)
         ↓
Backend: Validate recipient exists, not self; check balance; deduct (amount + 0.5% fee) from sender;
         credit amount to receiver; create TRANSFER transaction (status COMPLETED).
         ↓
Result:  Sender and receiver balances updated; both can see the transaction in Activity / transaction history.
```

There are **no pending or expiry states** for Send. The operation is atomic: either it succeeds (balances updated, transaction created) or it fails (no balance change).

### 2.2 Step-by-step (user + backend)

#### Step 1: Sender identifies recipient

- **Mobile:** Send Tokens → either **enter recipient email** or **scan recipient’s QR code**.
- **QR path:** Send → Scan QR → camera scans AfriToken "receive" QR (JSON: `type: "afritoken_receive", email, token`). App pre-fills recipient email and token type, then goes to amount.
- **Manual path:** Send → enter email → continue to amount.
- **Backend:** Not called yet.

#### Step 2: Sender enters amount and optional note

- **Mobile:** Amount screen: token type (NT/CT/USDT), amount (presets or custom), optional note. Fee (0.5%) is calculated and shown; total = amount + fee. User must have balance ≥ total.
- **Mobile screens:** `modals/send-tokens/index.tsx` (email or scan) → `modals/send-tokens/amount.tsx` → `modals/send-tokens/confirm.tsx`.

#### Step 3: Sender confirms (optional biometric)

- **Mobile:** Confirm screen shows recipient, amount, fee, total. User taps Confirm; app may prompt for **biometric** (Face ID / Touch ID) if enabled, then calls API.
- **API:** `POST /api/v1/wallets/transfer`  
  **Body:** `{ to_email, amount, token_type, description? }`
- **Backend (`walletService.transfer`):**
  - Resolve recipient by `to_email`; 404 if not found; 400 if recipient is self.
  - Fee = amount × 0.005 (0.5%); totalDebit = amount + fee.
  - In a single DB transaction:
    - Debit sender wallet: balance -= totalDebit; update total_sent.
    - Credit receiver wallet: balance += amount (no fee deducted from receiver); update total_received; create receiver wallet if needed.
    - Create `Transaction`: type `TRANSFER`, status `COMPLETED`, amount, fee, token_type, from_user_id, to_user_id, from_wallet_id, to_wallet_id, description.
  - Return transaction to client.
- **Mobile:** On success: refresh wallets, navigate to success screen; on error show message.

### 2.3 Send: Fees and validations

| Item | Value / rule |
|------|------------------|
| **Fee** | 0.5% of amount (FEE_RATE = 0.005 in `walletService.transfer`). Deducted from sender only. |
| **Recipient** | Must be registered user (email lookup). Cannot send to self. |
| **Balance** | Sender needs balance ≥ amount + fee. |
| **Frozen wallet** | If sender wallet is frozen, transfer is rejected (403). |

### 2.4 Send: Where it appears

- **Sender:** Activity / transaction list (outgoing TRANSFER); wallet balance decreased.
- **Receiver:** Activity / transaction list (incoming TRANSFER); wallet balance increased; can be notified via push if implemented.
- **Admin:** Financials → Transactions (filter by type: transfer); transaction detail shows from_user, to_user, amount, fee, token_type. User detail and wallet detail pages show related transactions.

---

## 3. Receive Tokens Lifecycle

### 3.1 Flow summary

**Receive** is not a separate backend operation. It is the **receiver side** of a Send:

1. Receiver **shares** a way to be identified: **QR code** (encoding email + token type) and/or **email** (copy or share).
2. Sender **uses** that (scan QR or enter email) and performs **Send** (see §2).
3. Backend **credits** the receiver when the transfer is processed.

So the "Receive" flow in the app is **only** about generating and sharing the QR/email; the actual receipt of tokens happens when someone sends to that email.

### 3.2 Step-by-step (receiver UX)

#### Step 1: User opens Receive

- **Mobile:** Home or wallet → **Receive** → `modals/receive-tokens/index.tsx`.

#### Step 2: User selects token type and shares identity

- **Token type:** NT, CT, or USDT (which token they want to receive).
- **QR code:** Rendered from JSON: `{ type: "afritoken_receive", email: user.email, token: tokenType, version: "1.0" }`. Sender can scan this to pre-fill recipient email and token type in the Send flow.
- **Email:** Shown and can be copied or shared (e.g. "Send me NT tokens on AfriToken! My email: …").
- **Wallet address:** If the user has a `blockchain_address` on the wallet, it is shown and can be copied (for display only; P2P transfer in-app uses **email**, not blockchain address).
- **Share:** User can tap Share to send the message (email + optional wallet) to another app.

#### Step 3: Sender sends to that email

- When a sender uses the same email (via QR or manual entry) and completes a transfer, the **receiver’s wallet** is credited. Receiver sees the incoming transaction in Activity and updated balance.

### 3.3 Receive: QR code format

| Field | Description |
|-------|-------------|
| `type` | Must be `"afritoken_receive"` so the Send scan screen accepts it. |
| `email` | Recipient’s email (used by backend to resolve user and wallet). |
| `token` | Optional; token type (NT, CT, USDT) to pre-fill in Send. |
| `version` | Optional; e.g. `"1.0"`. |

Invalid or non-AfriToken QR codes are rejected on scan with an alert.

### 3.4 Receive: Where it appears

- **Receiver:** Same as Send for the receiver: Activity (incoming TRANSFER), wallet balance. No separate "receive" API or table; it’s the same TRANSFER transaction with `to_user_id` = receiver.
- **Admin:** Same as Send: Financials → Transactions (transfer), user and wallet views.

---

## 4. Swap Tokens Lifecycle

### 4.1 Flow summary

```
User: Choose from_token, to_token, amount → See estimated receive (rate from backend) → Confirm
       ↓
Backend: Validate from ≠ to; get exchange rate; check balance; in one transaction:
         debit from_wallet, credit to_wallet (same user), create SWAP transaction (COMPLETED).
       ↓
Result:  User’s from-wallet balance decreased, to-wallet balance increased; transaction visible in Activity.
```

Swap is **atomic and synchronous**. No pending state, no agent, no timeouts.

### 4.2 Exchange rates

Rates are defined in **backend** `config/constants.js` (`EXCHANGE_RATES`). Example keys:

- `NT_TO_CT`, `NT_TO_USDT`
- `CT_TO_NT`, `CT_TO_USDT`
- `USDT_TO_NT`, `USDT_TO_CT`

`getExchangeRate(fromToken, toToken)` returns the rate (e.g. 1 NT = X CT). Same token returns 1.0. The mobile app fetches the rate via `GET /api/v1/wallets/rates?from=NT&to=CT` before confirming, and the swap API uses the same rate source. **No fee** is applied in the current swap implementation (receiveAmount = amount × rate).

### 4.3 Step-by-step (user + backend)

#### Step 1: User selects tokens and amount

- **Mobile:** Swap Tokens → choose **From** token (NT/CT/USDT) and **To** token (must differ). Enter amount. App fetches rate and shows **estimated receive**.
- **API (optional for UI):** `GET /api/v1/wallets/rates?from=NT&to=CT`  
  **Response:** `{ success, data: { from, to, rate, timestamp } }`
- **Mobile screens:** `modals/swap-tokens/index.tsx` (amount, from/to, estimated receive) → continue to confirm.

#### Step 2: User confirms swap

- **Mobile:** Confirm screen shows from token, amount, to token, estimated receive, rate. User taps Confirm.
- **API:** `POST /api/v1/wallets/swap`  
  **Body:** `{ from_token, to_token, amount }`
- **Backend (`walletService.swap`):**
  - Same token type → 400.
  - getExchangeRate(fromToken, toToken); receiveAmount = amount × rate.
  - In one DB transaction:
    - Debit from_wallet (same user): balance -= amount; update total_sent.
    - Credit to_wallet (same user): balance += receiveAmount; update total_received; create to_wallet if needed.
    - Create `Transaction`: type `SWAP`, status `COMPLETED`, amount (from amount), token_type = from_token, from_user_id = to_user_id = userId, from_wallet_id, to_wallet_id, description and metadata (from_token, to_token, exchange_rate, received_amount).
  - Return transaction and updated balances.
- **Mobile:** On success: refresh wallets, navigate to success screen.

### 4.4 Swap: Validations

| Check | Backend behavior |
|-------|-------------------|
| Same token | 400: "Cannot swap same token type". |
| Insufficient balance | 400: "Insufficient balance for swap". |
| Frozen wallet | 403: "Wallet is frozen". |
| Missing params | 400: user id, from_token, to_token required. |

### 4.5 Swap: Where it appears

- **User:** Activity (SWAP transaction); both wallets (from decreased, to increased).
- **Admin:** Financials → Transactions (filter by type: swap); transaction detail shows one user, two wallets, amount, received_amount in metadata, exchange_rate.

---

## 5. Data Flow Diagrams

### 5.1 Send (P2P Transfer) — data flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SEND TOKENS (P2P TRANSFER)                         │
└─────────────────────────────────────────────────────────────────────────────┘

  [Sender App]                    [Backend]                      [Receiver]
       │                              │                               │
       │  POST /wallets/transfer      │                               │
       │  { to_email, amount,         │                               │
       │    token_type, description }  │                               │
       │ ──────────────────────────► │                               │
       │                              │  Resolve recipient by email    │
       │                              │  Check balance (amount + 0.5%)  │
       │                              │  Debit sender wallet            │
       │                              │  Credit receiver wallet        │
       │                              │  Create TRANSFER transaction   │
       │                              │  (COMPLETED)                    │
       │  ◄──────────────────────────│                               │
       │  { transaction }             │                               │
       │                              │                               │
       │  (balance updated)           │  (both wallets updated)       │  (balance updated)
       │                              │                               │
```

### 5.2 Receive — relationship to Send

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECEIVE = SHARE IDENTITY → SENDER SENDS                   │
└─────────────────────────────────────────────────────────────────────────────┘

  [Receiver]                [Receiver App]              [Sender]              [Backend]
      │                           │                        │                     │
      │  Open Receive              │                        │                     │
      │ ──────────────────────────►│                        │                     │
      │  Show QR { email, token }  │                        │                     │
      │  Show email (copy/share)   │                        │                     │
      │                           │   Scan QR or get email   │                     │
      │                           │ ◄───────────────────────│                     │
      │                           │                        │  POST /transfer      │
      │                           │                        │  to_email = receiver  │
      │                           │                        │ ────────────────────►│
      │                           │                        │                     │  Credit
      │                           │                        │                     │  receiver
      │  Activity + balance       │                        │  ◄──────────────────│
      │  (incoming TRANSFER)      │                        │                     │
      │ ◄────────────────────────│                        │                     │
```

### 5.3 Swap — data flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SWAP TOKENS (SAME USER)                              │
└─────────────────────────────────────────────────────────────────────────────┘

  [User App]                          [Backend]
       │                                   │
       │  GET /wallets/rates?from=&to=     │  (optional: show rate before confirm)
       │ ───────────────────────────────►│
       │  ◄───────────────────────────────│  { rate }
       │                                   │
       │  POST /wallets/swap               │
       │  { from_token, to_token, amount } │
       │ ───────────────────────────────►│
       │                                   │  getExchangeRate()
       │                                   │  receiveAmount = amount × rate
       │                                   │  Debit from_wallet (user)
       │                                   │  Credit to_wallet (user)
       │                                   │  Create SWAP transaction (COMPLETED)
       │  ◄───────────────────────────────│
       │  { transaction, balances }       │
       │                                   │
       │  (both wallets updated in one tx) │
```

### 5.4 State summary (Send & Swap)

Unlike Buy (mint) and Sell (burn), **Send** and **Swap** have no multi-step state machine:

| Operation | States | Notes |
|-----------|--------|--------|
| **Send** | N/A | Single API call → COMPLETED or error. No pending. |
| **Swap** | N/A | Single API call → COMPLETED or error. No pending. |
| **Receive** | N/A | No dedicated API; receiver is credited when a Send targets their email. |

Transaction record status for both is **COMPLETED** on success.

---

## 6. Admin Dashboard

### 6.1 Where Send, Receive and Swap appear

| Area | Send (Transfer) | Receive | Swap |
|------|------------------|----------|------|
| **Financials → Transactions** | Yes: type = transfer. Filter by type, user, date. | Same as Send (receiver side = incoming transfer). | Yes: type = swap. |
| **Financials → Wallets** | Wallet detail shows outgoing/incoming transfers. | Same wallet detail (incoming). | Wallet detail shows swap (debit from one, credit to other). |
| **Users → [User] → Transactions** | Outgoing and incoming transfers for that user. | Incoming transfers. | Swaps for that user. |
| **Dashboard overview** | Transaction counts and volume (e.g. recent_24h, total_fees) include transfer and swap. | Included in transfer stats. | Included in transaction stats. |

### 6.2 Admin actions

- **View** all transactions (transfers and swaps) in Financials → Transactions; filter by type, user_id, status, date.
- **View** a single transaction: amount, fee (for transfer), from_user, to_user, from_wallet, to_wallet, token_type, description, metadata (for swap: from_token, to_token, exchange_rate, received_amount).
- **No cancel/refund** for Send or Swap in the same way as mint/burn: they are final once completed. Disputes or manual adjustments would be handled outside this flow (e.g. admin credit/debit or support).

---

## 7. API Reference

### 7.1 Send (Transfer)

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| POST | `/api/v1/wallets/transfer` | User (sender) | Send tokens to another user by email. Body: `to_email`, `amount`, `token_type`, `description?`. Returns created transaction (COMPLETED). |

### 7.2 Receive

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| — | — | — | No dedicated receive API. Receiver is credited when another user calls `POST /wallets/transfer` with receiver’s email. |

### 7.3 Swap

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| GET | `/api/v1/wallets/rates?from=NT&to=CT` | User | Get exchange rate for display (estimated receive). |
| POST | `/api/v1/wallets/swap` | User | Execute swap. Body: `from_token`, `to_token`, `amount`. Returns transaction and balances. |

### 7.4 Wallets (used by Send/Swap)

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| GET | `/api/v1/wallets/` | User | List my wallets (balance, token_type). Used to show balance before send/swap. |

---

## 8. Database and Side Effects

### 8.1 Send (transfer) — on success

- **Wallet (sender):** `balance` -= amount + fee; `total_sent` increased; `transaction_count` += 1.
- **Wallet (receiver):** `balance` += amount; `total_received` increased; `transaction_count` += 1. Wallet created if not exists.
- **Transaction:** One row: type `TRANSFER`, status `COMPLETED`, amount, fee, token_type, from_user_id, to_user_id, from_wallet_id, to_wallet_id, description.

### 8.2 Swap — on success

- **Wallet (from):** `balance` -= amount; `total_sent` increased; `transaction_count` += 1.
- **Wallet (to, same user):** `balance` += receiveAmount; `total_received` increased; `transaction_count` += 1. Wallet created if not exists.
- **Transaction:** One row: type `SWAP`, status `COMPLETED`, amount (source amount), token_type = from_token, from_user_id = to_user_id, from_wallet_id, to_wallet_id, metadata (from_token, to_token, exchange_rate, received_amount).

### 8.3 Receive

- No separate table or side effect. Receiving is the **receiver side** of a TRANSFER: receiver’s wallet and transaction record are updated as in §8.1 when a sender calls `POST /wallets/transfer` with the receiver’s email.

---

## 9. Code verification (backend & mobile)

This document was checked against the following code:

### Backend (afriX_backend)

| File | What was verified |
|------|-------------------|
| `src/services/walletService.js` | `transfer()`: toUserEmail lookup, FEE_RATE 0.005, totalDebit, self-check, frozen check, Transaction type TRANSFER/COMPLETED. `swap()`: getExchangeRate, same-token check, frozen check, Transaction type SWAP/COMPLETED, metadata (from_token, to_token, exchange_rate, received_amount). |
| `src/controllers/walletController.js` | `transfer`: body to_email, amount, token_type, description; calls walletService.transfer. `swap`: body from_token, to_token, amount; calls walletService.swap. `getExchangeRates`: query params from, to; returns rate. |
| `src/routes/wallets.js` | GET `/`, GET `/rates`, POST `/swap`, POST `/transfer` (all under authenticate). Mounted at `/api/v1/wallets` in app.js. |
| `src/config/constants.js` | EXCHANGE_RATES (NT_TO_CT, CT_TO_NT, etc.), getExchangeRate(fromToken, toToken). |
| `src/models/Wallet.js` | token_type, balance, pending_balance, virtual available_balance. |

**Note:** The backend also exposes `POST /api/v1/transactions/transfer` (body: `to_user_id`, amount, token_type, description) in `transactionController.userTransfer`. The **mobile app uses only** `POST /api/v1/wallets/transfer` (by email). This doc describes the email-based flow.

### Mobile (afriX-mobile)

| File | What was verified |
|------|-------------------|
| `src/stores/slices/transferSlice.ts` | executeTransfer: POST `/wallets/transfer` with to_email, amount, token_type, description (note). calculateFee: 0.005. |
| `src/stores/slices/swapSlice.ts` | executeSwap: POST `/wallets/swap` with from_token, to_token, amount. fetchExchangeRate: GET `/wallets/rates` params from, to. |
| `app/modals/send-tokens/index.tsx` | Token type selector; recipient email input; "Scan QR Code" button to `/modals/send-tokens/scan-qr`. |
| `app/modals/send-tokens/scan-qr.tsx` | Parses QR with type `afritoken_receive`, email, token; setRecipient(email), setTokenType(token); navigates to amount. |
| `app/modals/send-tokens/amount.tsx` | amount, note, fee, available_balance check; continue to confirm. |
| `app/modals/send-tokens/confirm.tsx` | Optional biometric; executeTransfer(); fetchWallets(); success screen. |
| `app/modals/receive-tokens/index.tsx` | QR payload: type, email, token, version; copy email, share; wallet address if present. |
| `app/modals/swap-tokens/index.tsx` | fromToken, toToken, amount, fetchExchangeRate, estimatedReceive; continue to confirm. |
| `app/modals/swap-tokens/confirm.tsx` | executeSwap(); fetchWallets(); success. |
| `src/stores/slices/walletSlice.ts` | getWalletByType(tokenType) from wallets; wallet has available_balance (from API). |
| `src/constants/api.ts` | API_ENDPOINTS.WALLETS.TRANSFER = `/wallets/transfer`; base URL from EXPO_PUBLIC_API_URL. |

---

**Document version:** 1.0  
**Last updated:** February 2025  
**Backend reference:** `walletService.js` (transfer, swap), `walletController.js`, `config/constants.js` (EXCHANGE_RATES, getExchangeRate).  
**Mobile reference:** `modals/send-tokens/`, `modals/receive-tokens/`, `modals/swap-tokens/`; `transferSlice.ts`, `swapSlice.ts`.
