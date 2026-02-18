# Docs vs Code — Gap Audit

**Purpose:** Align documentation with the actual backend, mobile, and web codebases. This audit compares what the docs (FAQ, Transaction Flows, Platform Overview, Agent/KYC guides) describe versus what is implemented.

**Scoped:** `afriX_backend`, `afriX-mobile`, `afrix-web` (as of audit date).

---

## 1. Backend — What Exists

### 1.1 Routes (from `src/app.js`)

| Prefix | Purpose |
|--------|--------|
| `/api/v1/auth` | Register, login, verify-email, resend-verification, forgot/reset-password, change-password, logout, me, **2FA**: setup, verify, disable, validate |
| `/api/v1/agents` | profile, dashboard, list, register, **kyc**: upload, status, resubmit, deposit, withdraw-request, withdraw-requests, deposit-history, deposit-address, `:agent_id`, `:agent_id/reviews`, review, review/:id/respond |
| `/api/v1/requests` | **User:** GET /user. **Agent:** GET /. **Mint:** POST /mint, POST /mint/:id/proof, GET /mint/:id, POST /mint/confirm, POST /mint/reject, DELETE /mint/:id. **Burn:** POST /burn, POST /burn/reject, POST /burn/:id/fiat-proof, GET /burn/:id, POST /burn/confirm |
| `/api/v1/wallets` | GET /, GET /rates, POST /swap, GET /:id, POST /transfer, POST /credit, POST /debit |
| `/api/v1/transactions` | POST /, POST /transfer, POST /pay-merchant, GET /, GET /pending-review, GET /:id, GET /:id/verify |
| `/api/v1/merchants` | register, profile, update profile, payment-request, transactions, regenerate-api-key, dashboard, verify, kyc/upload |
| `/api/v1/payments` | POST /process, GET /:id, GET /:id/verify, POST /:id/cancel |
| `/api/v1/escrows` | POST /lock, POST /:id/finalize, POST /:id/refund (admin), GET /:id |
| `/api/v1/disputes` | POST / (open), GET / (admin), GET /:id, POST /:id/resolve (admin) |
| `/api/v1/education` | GET /progress, GET /quiz/:module, POST /submit/:module |
| `/api/v1/notifications` | GET /, POST /read-all, POST /:id/read, GET /settings, PUT /settings |
| `/api/v1/config` | GET /countries, GET /currencies |
| `/api/v1/users` | GET /me, PUT /update, PUT /profile, GET /find-agents, GET /balances, GET /summary, GET /merchant, POST /fcm-token |
| `/api/v1/admin/*` | Dashboard, withdrawals, merchants, agents (stats, list, get, approve-kyc, reject-kyc, suspend, activate), users (stats, list, get, suspend, unsuspend, verify-email, reset-password, credit/debit/freeze/unfreeze wallet), operations (disputes, escrows, requests mint/burn, cancel), financial (transactions, wallets, payments), education (stats, progress, users, reset, complete), security (stats, issues, unlock, reset-attempts) |

### 1.2 Models (from `src/models`)

- User, Wallet, Transaction, Merchant, MerchantKyc, Agent, AgentKyc, AgentReview, MintRequest, BurnRequest, Escrow, Dispute, WithdrawalRequest, Education, Notification, UserNotificationSettings, ExchangeRate.

### 1.3 Notable implementation details

- **Burn flow:** Implemented via **requests** (POST /requests/burn creates escrow via `escrowService.lockForBurn`; confirm uses `escrowService.finalizeBurn`). There is no separate “user calls POST /escrows/lock then POST /requests/burn” in the app; burn is request-driven.
- **Disputes:** Open with `escrowId` or `mintRequestId`; resolve by admin. Tied to escrow or mint request, not a generic “transaction dispute” only.
- **Education:** Modules and quizzes live in `educationService.js` (e.g. WHAT_ARE_TOKENS, HOW_AGENTS_WORK); no separate content CMS.
- **Agent deposit:** POST /agents/deposit takes `amount_usd` and `tx_hash`; backend may verify on-chain (see `depositVerificationJob`, treasury config).

---

## 2. Gaps: Docs Say It, Code Doesn’t (or Differs)

### 2.1 Token request (user requests tokens from another user)

- **Docs:** User FAQ and “Complete Transaction Flows” describe a full **token request** flow: user A requests X NT from user B → B approves/rejects → if approved, transfer executes. Treated as a first-class flow.
- **Code:**  
  - **Backend:** No route or model for “token request” (no `TokenRequest` table, no `POST /requests/token-request` or similar).  
  - **Mobile:** `app/modals/request-tokens.tsx` is a **“Coming soon”** placeholder; no API calls.
- **Gap:** Documentation describes a feature that is **not implemented**. Either implement the feature or **update docs** to state that “Request tokens from a friend” is planned / coming soon, and remove or soften the step-by-step flow until it exists.

### 2.2 Merchant payment links / pay merchant in mobile

- **Docs:** FAQ and Platform Overview describe merchants creating payment links, customers paying via link or QR, 2% fee, instant settlement.
- **Code:**  
  - **Backend:** Implemented: `POST /merchants/payment-request`, `POST /payments/process`, etc.  
  - **Mobile:** No screens or flows for “pay a merchant” (no merchant QR scan, no payment link handler, no `payments/process` in `api.ts` or stores).  
- **Gap:** **Backend is ready; mobile app does not yet support paying merchants.** Docs imply end-to-end UX. Either add merchant payment UX to the app or document that “merchant payments are available via API / web; in-app merchant pay coming later.”

### 2.3 Agent deposit: “verify on blockchain” vs “submit tx_hash”

- **Code:** Agent calls `POST /agents/deposit` with `amount_usd` and `tx_hash`. Backend uses `blockchainService.verifyDeposit(txHash, amountUsd)` to verify on-chain, then credits capacity. No background job that auto-detects incoming transfers to the treasury.
- **Docs (updated):** Agent Handbook and Platform Overview now state: agent sends USDT to treasury, then **submits tx_hash + amount** in the app; **backend verifies on-chain**; no automatic on-chain detection without the agent submitting the hash.

### 2.4 Escrow: “user confirms receipt” as separate step

- **Docs:** Burn flow says: agent sends fiat → user gets prompt “Did you receive it?” → user confirms → then escrow finalizes.
- **Code:** Burn confirm is `POST /requests/burn/confirm` (user). Backend uses `escrowService.finalizeBurn`. The “confirm receipt” step is the same as this user confirm call; there isn’t a separate “agent sent fiat” state that only then shows “confirm receipt” in the API (the flow may be implemented in mobile UI with status polling).  
- **Gap:** Low. Ensure Transaction Flows doc matches the actual API (single user confirm endpoint) and that mobile status screens (e.g. “Agent sent cash – confirm?”) are documented as the UX that satisfies this step.

### 2.5 Request expiration and auto-refund

- **Docs:** e.g. “After 30 minutes agent doesn’t act → escrow refunded, request expired.”
- **Code:** `expireRequests.js` and similar jobs exist; exact timing (30 min vs 24h for proof-submitted mint) is in code constants.  
- **Gap:** Docs should state the **actual** timeouts (e.g. 30 min for burn escrow, 24h for mint after proof) or point to a single “timeouts” section so support and agents aren’t surprised.

---

## 3. Gaps: Code Exists, Docs Under‑describe or Miss

### 3.1 Notifications (in-app inbox and preferences)

- **Code:** Backend: `GET/POST /notifications`, `GET/PUT /notifications/settings`. Mobile: `notificationSlice.ts` calls `/notifications`; settings/notification-inbox screens exist.
- **Docs:** Notification system design docs exist; User FAQ doesn’t clearly describe “notification inbox” and “notification preferences” in the app.
- **Gap:** Add a short “Notifications” subsection to the User FAQ (in-app inbox, mark read, preferences) and mention in Platform Overview.

### 3.2 2FA (TOTP) and login flow

- **Code:** Backend: `/auth/2fa/setup`, verify, disable, validate. Mobile: security screen, 2FA setup/disable modals.
- **Docs:** FAQ mentions “Enable 2FA if available”; security section doesn’t describe TOTP setup (QR, code entry) or login with 2FA step.
- **Gap:** Add 2FA to User FAQ (how to enable, how login works when 2FA is on) and, if present, to the security/testing docs.

### 3.3 FCM / push token registration

- **Code:** Backend: `POST /users/fcm-token`. Mobile: `pushNotifications.ts` and registration on login.
- **Docs:** Not described in User FAQ or Platform Overview.
- **Gap:** Optional: one line in FAQ or Overview (“We use push notifications for transaction and request updates; you can manage them in Settings”).

### 3.4 Config endpoints (countries, currencies)

- **Code:** `GET /config/countries`, `GET /config/currencies` (public). Used for registration/agent flows.
- **Docs:** Not listed in API or “how to integrate” docs.
- **Gap:** If you publish an API doc, add these. Otherwise low priority.

### 3.5 Admin: full route list and capabilities

- **Code:** Admin has many routes (dashboard, agents, users, withdrawals, merchants, operations, financials, education, security) as in Section 1.1.
- **Docs:** Admin testing guides and some route lists exist; no single “admin API map” that matches `admin.js` completely.
- **Gap:** Add or update an **Admin API / route map** (or “Admin capabilities”) doc that lists every admin route and main query/body params so frontend and QA match the backend.

### 3.6 Education: modules and gating

- **Code:** `EDUCATION_MODULES` in constants; educationService has quizzes; progress and submit endpoints.
- **Docs:** education-content.md and design docs exist; User FAQ doesn’t say “you may need to complete a short quiz before some actions” if that’s applied.
- **Gap:** If education is required for certain actions (e.g. first mint/burn), say so in the FAQ; otherwise note “optional learning modules” where relevant.

---

## 4. Mobile vs Backend

### 4.1 API surface used by mobile

- **In `api.ts`:** Auth, wallets (list, by id, transfer), agents (list, by id, profile, register, review, requests, deposit-address), education (progress, quiz, submit), requests (user, mint, burn).  
- **Actually used in app (from grep/read):**  
  - `/transactions`, `/transactions/pending-review`, `/transactions/:id`  
  - `/wallets/rates`, `/wallets/swap` (walletSlice, swapSlice)  
  - `/notifications` (notificationSlice)  
  - `/disputes` (POST from mint/burn slices)  
  - `/auth/2fa/setup`, `/auth/2fa/disable` (security)  
  - `/users/fcm-token` (likely in auth flow)  
  - `/requests/user`, mint and burn endpoints  

- **Gap:** `api.ts` is missing: `wallets/rates`, `wallets/swap`, `transactions` (list, pending-review, by id), `notifications`, `disputes`, 2FA and FCM. Either add these to `API_ENDPOINTS` for consistency and future use, or document “see apiClient usage across stores/screens” as the source of truth.

### 4.2 Merchant payments in app

- **Mobile:** No merchant payment UI (no pay-merchant, no payment link handling).
- **Gap:** Already covered in Section 2.2; either implement or document as “coming later.”

---

## 5. Web Admin vs Backend

- **Dashboard pages:** Dashboard overview, users, agents, merchants, disputes, operations (requests mint/burn, escrows), financials (transactions, wallets), education, security, withdrawals.
- **Hooks:** useAgents, useUsers, useDisputes, useWithdrawals, useOperations, etc., calling the admin routes above.
- **Gap:** Backend admin routes and web usage are aligned; the main gap is **documentation** (single admin route/capability map), not missing features.

---

## 6. Recommendations (priority)

| Priority | Action |
|----------|--------|
| **High** | **Token request:** **Done.** User FAQ and Platform Overview now mark "Request tokens from friend" as **coming soon**. |
| **High** | **Merchant payments:** **Done.** Progress doc and Platform Overview mark **pay merchant in app** as **coming soon**; backend/API ready. |
| **Medium** | **Agent deposit:** **Done.** Agent Handbook and Platform Overview now describe: agent submits tx_hash + amount → backend verifies on-chain; no auto-detect. |
| **Medium** | **User FAQ:** Add short sections for **Notifications** (inbox, preferences), **2FA** (enable, login with 2FA), and optionally **push/FCM**. |
| **Medium** | **Admin:** Create or update an **Admin route/capability map** (list of all admin endpoints and main params) so it matches `src/routes/admin.js`. |
| **Low** | **Mobile `api.ts`:** Add missing endpoints (transactions, wallets/rates, wallets/swap, notifications, disputes, 2FA, fcm-token) for consistency and onboarding. |
| **Low** | **Education:** In FAQ, mention optional (or required) learning modules and where they appear in the app. |

---

## 7. Quick reference: backend routes not in mobile `API_ENDPOINTS`

These are used or could be used by the app but are not listed in `afriX-mobile/src/constants/api.ts`:

- `GET/POST /wallets/rates`, `POST /wallets/swap`
- `GET /transactions`, `GET /transactions/pending-review`, `GET /transactions/:id`
- `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/:id/read`, `GET/PUT /notifications/settings`
- `POST /disputes`
- `POST /auth/2fa/setup`, `POST /auth/2fa/verify`, `POST /auth/2fa/disable`, `POST /auth/2fa/validate`
- `POST /users/fcm-token`
- `GET /config/countries`, `GET /config/currencies`

---

**Version:** 1.0  
**Audit date:** February 2025  
**Next:** Re-run after implementing token request or merchant pay, and after doc updates.
