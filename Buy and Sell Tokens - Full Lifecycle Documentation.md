# Buy Tokens and Sell Tokens — Full Lifecycle Documentation

This document describes the **end-to-end lifecycle** of **Buy Tokens** (mint) and **Sell Tokens** (burn) from the mobile app through the backend to the admin dashboard, including states, timeouts, disputes, and admin actions.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Buy Tokens (Mint) Lifecycle](#2-buy-tokens-mint-lifecycle)
3. [Sell Tokens (Burn) Lifecycle](#3-sell-tokens-burn-lifecycle)
4. [State Reference](#4-state-reference)
5. [Timeouts and Background Jobs](#5-timeouts-and-background-jobs)
6. [Disputes](#6-disputes)
7. [Admin Dashboard](#7-admin-dashboard)
8. [API Reference](#8-api-reference)
9. [Database and Side Effects](#9-database-and-side-effects)

---

## 1. Overview

| Flow | User action | Agent action | Outcome |
|------|-------------|--------------|---------|
| **Buy (Mint)** | User wants tokens. Pays fiat to agent (bank/mobile money), uploads proof. | Agent verifies payment in their account and confirms. | User receives tokens; agent’s capacity decreases. |
| **Sell (Burn)** | User wants cash. Locks tokens in escrow and gives bank details. | Agent sends fiat to user and uploads proof. | User confirms receipt → tokens burned and agent’s capacity increases; or user/agent rejects or disputes. |

- **Mint** has **no escrow**: user pays fiat first; agent confirms; then system mints tokens to user.
- **Burn** uses **escrow**: user’s tokens are locked first; agent sends fiat; user confirms (or disputes); then tokens are burned and agent capacity increased (or escrow refunded).

---

## 2. Buy Tokens (Mint) Lifecycle

### 2.1 Flow summary

```
User: Create request → (optional: cancel) → Pay fiat → Upload proof
       ↓
Agent: Receives notification → Verifies payment in bank → Confirm OR Reject
       ↓
If Confirm: Backend mints tokens to user, deducts agent capacity, creates MINT transaction.
If Reject: Request marked rejected; user notified (no tokens, no refund of fiat — that’s off-platform).
If User cancels: Only allowed while status = PENDING (before proof upload).
If Expired: Cron expires PENDING requests after 30 minutes; PROOF_SUBMITTED gets 24h for agent to respond.
```

### 2.2 Mint request statuses (backend)

| Status | Meaning |
|--------|--------|
| `pending` | Request created; user has not uploaded payment proof yet. User can cancel (DELETE). Expires in **30 minutes** if no proof. |
| `proof_submitted` | User uploaded proof; agent must confirm or reject. Expiry extended to **24 hours** so user doesn’t see “expired” while waiting. |
| `confirmed` | Agent confirmed; tokens minted to user. **Terminal success.** |
| `rejected` | Agent rejected (e.g. payment not seen). **Terminal.** |
| `expired` | Cron set this (e.g. PENDING past 30 min). **Terminal.** |
| `cancelled` | User cancelled (only when PENDING) or admin cancelled. **Terminal.** |
| `disputed` | User opened a dispute (e.g. “agent didn’t mint after I paid”). **Terminal for request; dispute handled separately.** |

### 2.3 Step-by-step (user + agent + backend)

#### Step 1: User creates mint request

- **Mobile:** Buy Tokens → choose token type (NT/CT) and amount → Select Agent → **Create request.**
- **API:** `POST /api/v1/requests/mint`  
  **Body:** `{ agent_id, amount, token_type }`
- **Backend:**
  - Education check (e.g. must complete “what_are_tokens” if enforced).
  - Self-mint check (user cannot mint from themselves if they are an agent).
  - Creates `MintRequest` with `status: pending`, `expires_at: now + 30 min`.
- **Mobile screens:** `modals/buy-tokens/index.tsx` (amount, token) → `modals/buy-tokens/select-agent.tsx` → request created then navigates to payment instructions.

#### Step 2: User pays fiat and uploads proof

- **User:** Pays agent via bank transfer or mobile money (off-platform). Then in app: **Upload proof** (screenshot + optional reference).
- **API:** `POST /api/v1/requests/mint/:request_id/proof`  
  **Content-Type:** `multipart/form-data` — `proof` (file), optional `bank_reference`
- **Backend:**
  - Validates request is `pending` and belongs to user.
  - Uploads file to R2/S3; sets `payment_proof_url`, `status: proof_submitted`, `expires_at: now + 24h`.
  - Sends notification to agent: “User uploaded payment proof for X NT/CT”.
- **Mobile:** `modals/buy-tokens/payment-instructions.tsx` (shows agent bank details) → `modals/buy-tokens/upload-proof.tsx` → then status screen.

**Alternative:** User can **cancel** before uploading proof: `DELETE /api/v1/requests/mint/:request_id`. Only allowed when `status === pending`.

#### Step 3: Agent confirms or rejects

- **Agent (mobile):** Agent app → Requests tab → sees mint request → checks their bank/mobile money → **Confirm** or **Reject** (with reason).
- **Confirm API:** `POST /api/v1/requests/mint/confirm`  
  **Body:** `{ request_id, bank_reference? }`
  - Backend: Validates `proof_submitted`, not expired. Calls `transactionService.processAgentMint()` → creates MINT transaction, credits user wallet, deducts agent capacity. Sets request `status: confirmed`. Notifies user: “Tokens minted!”
- **Reject API:** `POST /api/v1/requests/mint/reject`  
  **Body:** `{ request_id, reason }`
  - Backend: Validates pending or proof_submitted. Sets `status: rejected`. Notifies user with reason.

#### Step 4: User sees result

- **Mobile:** `modals/buy-tokens/status.tsx` polls `GET /api/v1/requests/mint/:request_id` (or user opens Activity). On `confirmed`: success UI; user can **rate agent** (`POST /api/v1/agents/review`).

### 2.4 Mint: Where it appears

- **User:** Activity tab (combined with transactions); Buy flow status screen; transaction detail after confirm.
- **Agent:** Agent dashboard Requests; request detail screen (confirm/reject).
- **Admin:** Operations → Request Management → Mint tab; list and detail ` /operations/requests/mint/[id] `. Admin can **cancel** a mint request (any non-confirmed status) with a reason.

### 2.5 Mint: Disputes

- If user paid but agent did not confirm (or user believes they paid correctly), user can **open a dispute** linked to the **mint request** (not escrow).
- **API:** `POST /api/v1/disputes`  
  **Body:** `{ mint_request_id, reason, details }` (and optionally `agent_id`).
- Backend: Sets mint request `status: disputed`; creates `Dispute` with `mint_request_id`. Admin reviews in **Operations → Disputes** (or **Disputes** in sidebar), can escalate and resolve.

---

## 3. Sell Tokens (Burn) Lifecycle

### 3.1 Flow summary

```
User: Create burn request (amount, agent, bank details) → Tokens locked in escrow
       ↓
Agent: Receives notification → Sends fiat to user → Uploads fiat proof
       ↓
User:  Receives notification → Confirms "I received the money" OR Disputes "I didn't receive it"
       ↓
If Confirm: Backend finalizes burn (tokens burned, agent capacity increased), transaction completed.
If Dispute: Dispute created; admin resolves (e.g. refund from escrow or side with agent).
If Agent rejects (before sending fiat): Escrow refunded, request rejected.
If Expired (agent didn’t send fiat in 30 min): Cron refunds escrow, request expired.
If Expired (user didn’t confirm/dispute in 30 min after fiat_sent): Cron opens auto-dispute.
```

### 3.2 Burn request statuses (backend)

| Status | Meaning |
|--------|--------|
| `escrowed` | Tokens locked in escrow; agent must send fiat and upload proof. Expires in **30 minutes** (agent must act). |
| `fiat_sent` | Agent uploaded fiat proof; user must confirm receipt or dispute. New **30-minute** timer. |
| `confirmed` | User confirmed receipt; burn finalized (tokens burned, agent capacity increased). **Terminal success.** |
| `rejected` | Agent rejected (e.g. can’t do it); escrow refunded. **Terminal.** |
| `expired` | Cron: either escrowed past 30 min (refund) or fiat_sent past 30 min (auto-dispute). **Terminal.** |
| `cancelled` | User cancelled before agent sent fiat, or admin cancelled; escrow refunded. **Terminal.** |
| `disputed` | User disputed or auto-dispute opened; dispute record created. **Terminal for request; dispute handled separately.** |

Note: There is no `pending` for burn in the same way as mint — as soon as the request is created, tokens are moved to escrow and status is `escrowed`.

### 3.3 Escrow statuses (relevant to burn)

| Escrow status | Meaning |
|---------------|--------|
| `locked` | Tokens held; waiting for agent to send fiat and confirm, or timeout/refund. |
| `completed` | Burn finalized (tokens burned, agent capacity increased). |
| `refunded` | Tokens returned to user (reject, cancel, or expiry before fiat_sent; or admin/dispute resolution). |
| `disputed` | Dispute opened; escrow frozen until resolution. |

### 3.4 Step-by-step (user + agent + backend)

#### Step 1: User creates burn request (tokens locked)

- **Mobile:** Sell Tokens → amount, token type → Select Agent → Enter **bank details** (where user wants to receive fiat) → Confirm.
- **API:** `POST /api/v1/requests/burn`  
  **Body:** `{ agent_id, amount, token_type, bank_account }`
- **Backend:**
  - Education check (e.g. “what_are_tokens” + “how_agents_work” if enforced).
  - Self-burn check (user cannot burn to themselves as agent).
  - **Escrow:** `escrowService.lockForBurn()`:
    - Deducts `amount` from user wallet `balance` → adds to `pending_balance`.
    - Creates `Transaction` (type BURN, status PENDING).
    - Creates `Escrow` (status `locked`, linked to transaction).
  - Creates `BurnRequest` with `status: escrowed`, `escrow_id`, `expires_at: now + 30 min`.
  - Notifies agent: “User wants to sell X NT/CT”.
- **Mobile:** `(tabs)/sell-tokens/index.tsx` → `sell-tokens/select-agent.tsx` → `sell-tokens/bank-details.tsx` → `sell-tokens/confirm.tsx` → then status screen.

**User can cancel** while status is `escrowed`: not exposed as a simple “Cancel” in all UIs; admin can cancel (refunds escrow).

#### Step 2: Agent sends fiat and uploads proof

- **Agent:** Sends Naira/XOF to user’s given bank account (off-platform). Then in app: **Upload fiat proof** (screenshot + optional reference).
- **API:** `POST /api/v1/requests/burn/:request_id/fiat-proof`  
  **Content-Type:** `multipart/form-data` — `proof` (file), optional `bank_reference`
- **Backend:**
  - Validates request is `escrowed`, not expired, and caller is the request’s agent.
  - Uploads file; sets `fiat_proof_url`, `agent_bank_reference`, `status: fiat_sent`, `expires_at: now + 30 min`.
  - Notifies user: “Agent sent fiat. Confirm receipt within 30 mins.”

**Alternative:** Agent can **reject** (e.g. can’t fulfill): `POST /api/v1/requests/burn/reject` with `request_id` and `reason`. Backend calls `escrowService.refundEscrow()`, sets request `rejected`, notifies user.

#### Step 3: User confirms receipt or disputes

- **User (mobile):** Status screen shows “Agent sent fiat” → **Yes, I received it** or **No, I didn’t receive it** (dispute).
- **Confirm API:** `POST /api/v1/requests/burn/confirm`  
  **Body:** `{ request_id }`
  - Backend: Validates `fiat_sent`, user is request owner. Calls `escrowService.finalizeBurn(escrow_id)`:
    - Reduces user’s `pending_balance` (tokens “burned”).
    - Increases agent’s `available_capacity` (and commission/earnings if applicable).
    - Marks transaction COMPLETED, escrow COMPLETED.
  - Sets request `status: confirmed`. Notifies agent: “Burn confirmed!”
- **Dispute:** User calls `POST /api/v1/disputes` with `escrow_id` (and reason, details). Backend marks escrow `disputed`, creates `Dispute`. Admin resolves later (e.g. refund user from escrow or side with agent).

#### Step 4: Expiry (cron)

- **Escrowed past 30 min:** Cron finds `BurnRequest` with `status: escrowed` and `expires_at < now`. Calls `escrowService.refundEscrow()`; sets request `expired`. User gets tokens back.
- **Fiat_sent past 30 min:** Cron finds `BurnRequest` with `status: fiat_sent` and `expires_at < now`. Calls `disputeService.openDispute()` (auto-dispute); sets request `disputed`. Admin reviews (e.g. agent proof vs user claim).

### 3.5 Burn: Where it appears

- **User:** Activity; Sell flow status screen (`sell-tokens/status.tsx`); transaction detail after confirm.
- **Agent:** Agent dashboard Requests; request detail (upload fiat proof or reject).
- **Admin:**
  - **Operations → Request Management → Burn tab:** list and detail ` /operations/requests/burn/[id] `. Admin can **cancel** burn request (reason required); backend refunds escrow and sets request `cancelled`.
  - **Operations → Escrows:** list and detail of escrows (locked, completed, refunded, disputed). Admin can **force-finalize** or **process-expired** in some flows.
  - **Operations → Disputes** (or **Disputes**): list and detail of disputes (including auto-disputes from fiat_sent timeout); escalate and resolve.

### 3.6 Burn: Disputes

- **User-initiated:** User taps “I didn’t receive it” → `POST /disputes` with `escrow_id`, `reason`, `details`. Escrow status → `disputed`; `BurnRequest` → `disputed`.
- **Auto-dispute:** When user doesn’t confirm or dispute within 30 min of `fiat_sent`, cron opens a dispute with reason “auto_expired” and agent proof URL in details.
- **Resolution:** Admin resolves in Disputes (e.g. refund user from escrow, or dismiss in favor of agent). Resolve endpoint: `POST /api/v1/admin/operations/disputes/:id/resolve` (or `POST /api/v1/disputes/:id/resolve` with admin auth).

---

## 4. State Reference

### 4.1 Mint request state diagram (simplified)

```
[pending] ──(user uploads proof)──► [proof_submitted] ──(agent confirm)──► [confirmed]
    │                                        │
    │ (user cancel / admin cancel)           │ (agent reject)
    ▼                                        ▼
[cancelled]                              [rejected]

[pending] ──(30 min no proof)──► [expired]   (cron)
[proof_submitted] ──(user opens dispute)──► [disputed]
```

### 4.2 Burn request state diagram (simplified)

```
[escrowed] ──(agent uploads fiat proof)──► [fiat_sent] ──(user confirm)──► [confirmed]
    │                                              │
    │ (agent reject → refund escrow)               │ (user dispute)
    ▼                                              ▼
[rejected]                                    [disputed]

[escrowed] ──(30 min no fiat proof)──► [expired] (cron refunds escrow)
[fiat_sent] ──(30 min no user action)──► [disputed] (cron opens auto-dispute)
```

### 4.3 Escrow (burn only)

```
locked ──(finalizeBurn)──► completed
locked ──(refundEscrow)──► refunded
locked ──(openDispute)──► disputed
```

---

## 5. Timeouts and Background Jobs

| What | When | Action |
|------|------|--------|
| **Mint PENDING** | 30 minutes after create, no proof | Cron sets status `expired`. |
| **Mint PROOF_SUBMITTED** | No automatic expiry in cron for this status; expiry field set to 24h so UI doesn’t show “expired” while waiting for agent. | Agent must confirm or reject (manual). |
| **Burn ESCROWED** | 30 minutes after create, agent hasn’t sent fiat | Cron refunds escrow via `refundEscrow`, sets request `expired`. |
| **Burn FIAT_SENT** | 30 minutes after agent uploaded proof, user hasn’t confirmed or disputed | Cron calls `disputeService.openDispute` (auto-dispute), sets request `disputed`. |

**Cron:** `expireRequests` in `src/jobs/expireRequests.js` runs every **5 minutes** (scheduler in `src/jobs/scheduler.js`).

**Constants:**  
- `THIRTY_MINUTES = 30 * 60 * 1000` (ms).  
- `PROOF_SUBMITTED_EXPIRY_MS = 24 * 60 * 60 * 1000` (24h for mint after proof).

---

## 6. Disputes

- **Mint dispute:** Linked to `mint_request_id`. User claims e.g. “I paid but agent didn’t mint.” No escrow; resolution is admin-driven (e.g. manual mint for user, or dismiss).
- **Burn dispute:** Linked to `escrow_id`. User claims “I didn’t receive fiat.” Escrow is locked in `disputed`; admin can resolve by refunding user (refundEscrow) or closing in agent’s favor.
- **Auto-dispute (burn):** When `fiat_sent` expires without user confirm/dispute, cron opens a dispute with escalation level AUTO; admin reviews agent proof and user (in)action.
- **Admin:** Disputes list and detail under **Operations → Disputes** (or **Disputes**). Actions: escalate, resolve (with action, optional penalty, notes).

---

## 7. Admin Dashboard

### 7.1 Where Buy (Mint) and Sell (Burn) appear

| Area | Mint | Burn |
|------|------|------|
| **Operations → Request Management** | Tab “Mint”: list with filters (status, agent, user). Row links to `/operations/requests/mint/[id]`. | Tab “Burn”: list with filters. Row links to `/operations/requests/burn/[id]`. |
| **Operations → Escrows** | — | List of escrows (burn creates escrow). Detail `/operations/escrows/[id]`. |
| **Operations → Disputes** | Mint disputes (mint_request_id). | Burn disputes (escrow_id). Detail `/operations/disputes/[id]`. |
| **Financials → Transactions** | MINT and BURN transactions appear in transaction list and detail. | Same. |
| **Dashboard overview** | Request stats (e.g. pending_mint) in overview API. | Pending burn, escrow stats. |

### 7.2 Admin actions

| Action | Mint | Burn |
|--------|------|------|
| **View list** | GET `/admin/operations/requests/mint` (query: status, agent_id, user_id, expired, limit, offset) | GET `/admin/operations/requests/burn` (same) |
| **View one** | GET `/admin/operations/requests/mint/:id` | GET `/admin/operations/requests/burn/:id` |
| **Cancel** | POST `/admin/operations/requests/mint/:id/cancel` Body: `{ reason }`. Sets status `cancelled`. | POST `/admin/operations/requests/burn/:id/cancel` Body: `{ reason }`. Refunds escrow, sets status `cancelled`. |
| **Escrows** | — | List GET `/admin/operations/escrows`, detail GET `/admin/operations/escrows/:id`, force-finalize, process-expired |
| **Disputes** | List, detail, escalate, resolve (same dispute UI for mint and burn) | Same |

### 7.3 Dashboard overview API

- **GET** `/api/v1/admin/dashboard/overview` returns (among other things) `requests.pending_mint`, `requests.pending_burn`, `requests.pending_total`, and escrow/dispute counts. Used by the main dashboard “Requires Attention” and metrics.

---

## 8. API Reference

### 8.1 Mint (Buy Tokens)

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| POST | `/api/v1/requests/mint` | User | Create mint request. Body: `agent_id, amount, token_type`. |
| POST | `/api/v1/requests/mint/:request_id/proof` | User | Upload payment proof (multipart: `proof` file, optional `bank_reference`). |
| GET | `/api/v1/requests/mint/:request_id` | User or Agent | Get mint request detail. |
| POST | `/api/v1/requests/mint/confirm` | Agent | Confirm payment received; mints tokens to user. Body: `request_id, bank_reference?`. |
| POST | `/api/v1/requests/mint/reject` | Agent | Reject request. Body: `request_id, reason`. |
| DELETE | `/api/v1/requests/mint/:request_id` | User | Cancel request (only when status = pending). |
| GET | `/api/v1/requests/user` | User | List current user’s mint and burn requests. |
| GET | `/api/v1/requests` | Agent | List agent’s mint and burn requests. |

**Admin:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/admin/operations/requests/mint` | List mint requests (query: status, agent_id, user_id, expired, limit, offset). |
| GET | `/api/v1/admin/operations/requests/mint/:id` | Get mint request. |
| POST | `/api/v1/admin/operations/requests/mint/:id/cancel` | Cancel mint request. Body: `{ reason }`. |

### 8.2 Burn (Sell Tokens)

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| POST | `/api/v1/requests/burn` | User | Create burn request; locks tokens in escrow. Body: `agent_id, amount, token_type, bank_account`. |
| GET | `/api/v1/requests/burn/:request_id` | User or Agent | Get burn request detail. |
| POST | `/api/v1/requests/burn/:request_id/fiat-proof` | Agent | Upload fiat sent proof (multipart: `proof`, optional `bank_reference`). |
| POST | `/api/v1/requests/burn/reject` | Agent | Reject burn; refunds escrow. Body: `request_id, reason`. |
| POST | `/api/v1/requests/burn/confirm` | User | Confirm fiat received; finalizes burn. Body: `{ request_id }`. |

**Admin:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/admin/operations/requests/burn` | List burn requests. |
| GET | `/api/v1/admin/operations/requests/burn/:id` | Get burn request. |
| POST | `/api/v1/admin/operations/requests/burn/:id/cancel` | Cancel burn and refund escrow. Body: `{ reason }`. |
| GET | `/api/v1/admin/operations/escrows` | List escrows. |
| GET | `/api/v1/admin/operations/escrows/:id` | Get escrow. |
| POST | `/api/v1/admin/operations/escrows/:id/force-finalize` | Force finalize (admin override). |
| POST | `/api/v1/admin/operations/escrows/process-expired` | Process expired escrows. |

### 8.3 Disputes

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| POST | `/api/v1/disputes` | User | Open dispute. Body: `escrow_id` (burn) or `mint_request_id` (mint), `reason`, `details`. |
| GET | `/api/v1/disputes/:id` | User or Admin | Get dispute. |
| GET | `/api/v1/disputes` | Admin | List disputes. |
| POST | `/api/v1/disputes/:id/resolve` | Admin | Resolve dispute. |
| GET | `/api/v1/admin/operations/disputes` | Admin | List with filters. |
| GET | `/api/v1/admin/operations/disputes/:id` | Admin | Get dispute. |
| POST | `/api/v1/admin/operations/disputes/:id/escalate` | Admin | Escalate. |
| POST | `/api/v1/admin/operations/disputes/:id/resolve` | Admin | Resolve (action, penalty_amount_usd?, notes?). |

---

## 9. Database and Side Effects

### 9.1 Mint (confirm path)

- **MintRequest:** status → `confirmed`; `confirmed_at`, `bank_reference` set.
- **Transaction:** new row type `MINT`, status COMPLETED; from_user = agent, to_user = user; amount, token_type, metadata (request_id).
- **Wallet (user):** balance increased by amount (same token_type).
- **Agent:** `available_capacity` decreased (by amount converted to USDT equivalent); optional commission/earnings updated.
- **Notifications:** User “Tokens minted!”; optional agent notification.

### 9.2 Burn (confirm path)

- **BurnRequest:** status → `confirmed`.
- **Escrow:** status → `completed`; metadata may store finalize_evidence.
- **Transaction (existing burn tx):** status → COMPLETED; metadata updated.
- **Wallet (user):** `pending_balance` decreased by amount (tokens “burned”).
- **Agent:** `available_capacity` increased (USDT equivalent); `total_burned`, `total_earnings`/commission updated.
- **Notifications:** User and agent notified.

### 9.3 Burn (refund path — reject, cancel, or escrowed expiry)

- **Escrow:** status → `refunded`. User wallet: `pending_balance` decreased, `balance` increased (tokens returned).
- **Transaction:** status may stay PENDING or be updated to REFUNDED/cancelled depending on implementation.
- **BurnRequest:** status → `rejected`, `cancelled`, or `expired`.

### 9.4 Dispute creation (burn)

- **Escrow:** status → `disputed`.
- **BurnRequest:** status → `disputed`.
- **Dispute:** new row with escrow_id, opened_by_user_id, agent_id, reason, details, status OPEN, escalation_level (e.g. AUTO for auto-dispute).

---

**Document version:** 1.0  
**Last updated:** February 2025  
**Backend reference:** `requestController.js`, `escrowService.js`, `disputeService.js`, `expireRequests.js`, `adminOperationsController.js`, `constants.js` (MINT_REQUEST_STATUS, BURN_REQUEST_STATUS, ESCROW_STATUS).
