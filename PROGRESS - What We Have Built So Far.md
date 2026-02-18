# AfriExchange (AfriX) — Progress: What We Have Built So Far

This document describes **what is implemented** across the backend, admin web dashboard, and mobile app as of the audit date. It is based on a direct review of the codebases.

---

## Table of Contents

1. [Backend (afriX_backend)](#1-backend-afrix_backend)
2. [Admin Web Dashboard (afrix-web)](#2-admin-web-dashboard-afrix-web)
3. [Mobile App (afriX-mobile)](#3-mobile-app-afrix-mobile)
4. [Cross-Stack Summary](#4-cross-stack-summary)

---

## 1. Backend (afriX_backend)

### 1.1 Stack & entrypoint

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** PostgreSQL (Sequelize ORM)
- **Cache:** Redis (optional; in-memory fallback)
- **Entry:** `server.js` → `src/app.js`; mounts all routes under `/api/v1` (or `API_VERSION` from env)
- **Health:** `GET /health`
- **Start:** `npm start` (or `node server.js`); DB connection test and table init on boot; cron scheduler loaded

### 1.2 API route groups

| Base path | Purpose |
|-----------|--------|
| **/api/v1/auth** | Registration, login, email verification, resend verification, forgot/reset password, change password, logout, `GET /me`. **2FA:** setup, verify, disable, validate (TOTP). |
| **/api/v1/agents** | Profile (get/update), dashboard, list active agents, register. **KYC:** upload, status, resubmit (multipart). Deposit (submit tx), withdraw-request, list withdraw-requests, deposit-history, deposit-address. Get by id, reviews, submit review, respond to review. |
| **/api/v1/requests** | **User:** GET /user (my mint/burn requests). **Agent:** GET / (agent’s mint/burn queue). **Mint:** POST /mint, POST /mint/:id/proof, GET /mint/:id, POST /mint/confirm, POST /mint/reject, DELETE /mint/:id. **Burn:** POST /burn, GET /burn/:id, POST /burn/reject, POST /burn/:id/fiat-proof, POST /burn/confirm. |
| **/api/v1/wallets** | List my wallets, GET /rates (exchange rates), POST /swap, GET /:id, POST /transfer (P2P by email), POST /credit, POST /debit. |
| **/api/v1/transactions** | POST / (create), POST /transfer (user transfer), POST /pay-merchant, GET / (list paginated), GET /pending-review, GET /:id, GET /:id/verify. |
| **/api/v1/merchants** | Register, get/update profile, payment-request (create), transactions, regenerate-api-key, dashboard summary, verify, kyc/upload. |
| **/api/v1/payments** | POST /process (customer pay merchant), GET /:id, GET /:id/verify, POST /:id/cancel. |
| **/api/v1/escrows** | POST /lock (lock for burn), POST /:id/finalize, POST /:id/refund (admin), GET /:id. |
| **/api/v1/disputes** | POST / (open dispute), GET / (admin list), GET /:id, POST /:id/resolve (admin). |
| **/api/v1/education** | GET /progress, GET /quiz/:module, POST /submit/:module. |
| **/api/v1/notifications** | GET / (inbox), POST /read-all, POST /:id/read, GET /settings, PUT /settings. |
| **/api/v1/config** | GET /countries, GET /currencies (public). |
| **/api/v1/users** | GET /me (profile + wallets), PUT /update, PUT /profile, GET /find-agents, GET /balances, GET /summary, GET /merchant, POST /fcm-token. |
| **/api/v1/admin** | See [Admin routes](#12-admin-routes) below. |

### 1.3 Admin routes (summary)

- **Dashboard:** GET /admin/dashboard/overview (single-call metrics).
- **Withdrawals:** pending, list (with filters), get one, approve, mark paid, reject, stats.
- **Merchants:** list, get one, approve, reject.
- **Agents:** stats, list (filters), get one, approve-kyc, reject-kyc, suspend, activate.
- **Users:** stats, list (filters), get one, suspend, unsuspend, verify-email, reset-password, credit-wallet, debit-wallet, freeze-wallet, unfreeze-wallet.
- **Operations:** Disputes (stats, list, get one, escalate, resolve). Escrows (stats, list, get one, force-finalize, process-expired). Requests (stats, list mint/burn, get one, cancel mint/burn).
- **Financial:** Transactions (stats, list, get one, refund, flag). Wallets (stats, list, get one). Payments (stats, list).
- **Education:** stats, progress list, users with education, get user progress, reset progress, mark complete.
- **Security:** stats, list issues (locked, failed logins, unverified), unlock user, reset login attempts.

### 1.4 Data models (Sequelize)

| Model | Purpose |
|-------|--------|
| **User** | Auth, roles (user/agent/merchant/admin), security audit fields (locked, failed attempts, last unlocked/reset by). |
| **Wallet** | Per-user per-token (NT, CT, USDT); balance, pending_balance, blockchain_address. |
| **Transaction** | Canonical ledger: type (transfer, swap, mint, burn, collection, credit, debit, agent_deposit, agent_withdrawal), status, amount, fee, from/to user/wallet, merchant_id, agent_id. |
| **Merchant** | Linked to User; settlement_wallet_id; business details. |
| **MerchantKyc** | Merchant KYC documents and status. |
| **Agent** | Linked to User; tier (starter, standard, premium, platinum); status; deposit/capacity; withdrawal_address; deposit_address; list/display fields. |
| **AgentKyc** | Agent KYC documents and status (upload, status, resubmit). |
| **AgentReview** | User → Agent reviews; linked to transaction. |
| **MintRequest** | User buy from agent: user_id, agent_id, amount, token_type, status (pending, proof_submitted, confirmed, rejected, expired), payment_proof_url, expires_at. |
| **BurnRequest** | User sell to agent: user_id, agent_id, amount, token_type, escrow_id, status (pending, escrowed, fiat_sent, confirmed, rejected, expired), user_bank_account, fiat_proof_url, expires_at. |
| **Escrow** | Locked tokens for burn: from_user_id, agent_id, transaction_id, status (e.g. active, finalized, disputed, refunded). |
| **Dispute** | Linked to escrow and/or mint_request; opened_by_user_id, agent_id; status; resolution. |
| **WithdrawalRequest** | Agent withdrawal requests; status (pending, approved, rejected, paid). |
| **Education** | Per-user per-module progress (e.g. what_are_tokens, how_agents_work, understanding_value, safety_security). |
| **Notification** | In-app notification inbox; user_id, title, body, read, etc. |
| **UserNotificationSettings** | Per-user preferences (push, email, sms toggles). |
| **ExchangeRate** | Stored rates for tokens (used for swap/display). |

### 1.5 Services (business logic)

- **agentService:** Register, get/update profile, dashboard, list active agents, KYC upload/status/resubmit, deposit, withdrawal request, deposit-address, get by id, reviews, submit review, respond to review.
- **escrowService:** lockForBurn, finalizeBurn, refundEscrow (used by requestController for burn flow).
- **requestController (logic):** createMintRequest, uploadMintProof, confirmMint, rejectMint, cancelMintRequest; createBurnRequest (creates escrow via escrowService), confirmFiatSent, confirmBurn (user confirm receipt), rejectBurn; getUserRequests, getAgentRequests.
- **transactionService:** User transfers, swap, mint/burn transaction records, pay merchant.
- **walletService:** transfer (P2P by email), swap, balance checks.
- **disputeService:** openDispute (by escrow_id or mint_request_id), resolveDispute.
- **notificationService:** create/deliver in-app notifications (and optional push/email).
- **educationService:** getProgress, getQuiz(module), submitQuiz (modules: what_are_tokens, how_agents_work, understanding_value, safety_security).
- **userService:** getProfile, updateProfile, findAgents, getBalances, getSummary, getMerchantProfile, updateFcmToken.
- **merchantService, paymentVerificationService, commissionService, referralService, emailService, r2Service (Cloudflare R2/S3), blockchainService, terminologyService.**

### 1.6 Background jobs

- **scheduler.js:** Runs `expireRequests` every 5 minutes.
- **expireRequests.js:** Expires PENDING mint requests; refunds expired ESCROWED burn requests; opens auto-dispute for expired FIAT_SENT burn requests.
- Other job files present (e.g. autoDisputeJob, depositVerificationJob, agentPerformanceJob, transactionCleanupJob, rateUpdateJob, educationReminderJob) — wiring in scheduler may vary; `expireRequests` is the one explicitly required in `server.js`.

### 1.7 Middleware

- **auth:** authenticate (JWT), authorizeAdmin, optionalAuth.
- **agentAuth:** requireAgent (user must have agent record).
- **validation:** validateRegistration, validateLogin, validatePaymentRequest, validateUUID, validateMintRequest, validateBurnRequest, etc.
- **upload:** Multer; used for KYC (agents, merchants), mint proof, burn fiat proof.
- **sanitizeInput, rateLimiter, helmet, cors, morgan, errorHandler, terminologyChecker.**

### 1.8 Config & constants

- **constants.js:** Token types (NT, CT, USDT), user roles, transaction types/statuses, agent status/tiers, mint/burn request statuses, dispute status/types, education modules, platform fees, agent config (tiers, deposit thresholds), escrow config (e.g. expiry minutes), transaction limits, merchant enums.
- **database.js, config.js, redis.js, treasury.js, blockchain.js, cloudflare.js, merchantTiers.js.**

### 1.9 Migrations

- **Users, wallets, transactions, agents, merchants, agent_wallets, education progress, exchange rates, FCM token on users, agent list fields, agent mobile money, security audit on users, notifications and settings, mint_request_id on disputes,** etc. (see `migrations/` for full list.)

---

## 2. Admin Web Dashboard (afrix-web)

### 2.1 Stack

- **Framework:** Next.js (App Router)
- **UI:** React, Tailwind CSS, shadcn/ui-style components (Button, Card, Input, Table, Dialog, Sheet, Tabs, Badge, etc.), Lucide icons.
- **State:** React hooks (useState, useEffect); custom hooks that call the backend.
- **API client:** Axios instance in `lib/api.ts`; base URL from `NEXT_PUBLIC_API_URL` or `http://localhost:5001/api/v1`; JWT from `localStorage` (and cookies for middleware).

### 2.2 Auth

- **Login:** `app/login/page.tsx` — POST /auth/login; checks `user.role` is admin or super_admin; stores token in cookie and localStorage; redirects to dashboard.
- **Middleware:** `middleware.ts` — protects dashboard routes; redirects to /login if no auth.

### 2.3 Layout & navigation

- **Dashboard layout:** `app/(dashboard)/layout.tsx` — sidebar + header; “AfriExchange Admin” branding.
- **Sidebar:** Overview, User Management, Agent Hub, Financials, Merchants, Operations, Disputes, Security, Education, Withdrawals. Sub-items under Financials: Transaction History, Wallet Assets.

### 2.4 Pages (what exists)

| Route | Purpose |
|-------|--------|
| **/** | Dashboard overview: metrics cards (users, agents, TVL, transactions, disputes, etc.), charts (sales, order status, user growth, token distribution, agent tier), “Requires Attention” (pending KYC, withdrawals, disputes, escrows, flagged tx). Data from GET /admin/dashboard/overview. |
| **/users** | User list with filters; links to user detail. |
| **/users/[id]** | User detail: profile, suspend/unsuspend, verify email, reset password, credit/debit/freeze/unfreeze wallet. |
| **/agents** | Agent list with filters; links to agent detail. |
| **/agents/[id]** | Agent detail: profile, approve/reject KYC, suspend/activate. |
| **/merchants** | Merchant list. |
| **/merchants/[id]** | Merchant detail; approve/reject. |
| **/financials** | Financial overview (links to transactions & wallets). |
| **/financials/transactions** | Transaction list with filters; link to detail. |
| **/financials/transactions/[id]** | Single transaction detail; refund, flag. |
| **/financials/wallets** | Wallet list; filters. |
| **/financials/wallets/[id]** | Wallet detail; freeze/unfreeze via user. |
| **/operations** | Operations overview (disputes, escrows, requests). |
| **/operations/disputes** | Dispute list; link to detail. |
| **/operations/disputes/[id]** | Dispute detail; escalate, resolve. |
| **/operations/escrows** | Escrow list; link to detail. |
| **/operations/escrows/[id]** | Escrow detail; force-finalize. |
| **/operations/requests** | Mint/burn request list; cancel mint/burn. |
| **/operations/requests/mint/[id]** | Single mint request. |
| **/operations/requests/burn/[id]** | Single burn request. |
| **/disputes** | Disputes list (duplicate nav; same operations disputes). |
| **/disputes/[id]** | Dispute detail. |
| **/withdrawals** | Withdrawal request list; filters. |
| **/withdrawals/[id]** | Withdrawal detail; approve, mark paid, reject. |
| **/education** | Education stats; progress list; links to user progress. |
| **/education/users/[id]** | User education progress; reset, mark complete. |
| **/security** | Security stats; list of issues (locked, failed logins, unverified). |
| **/security/users/[id]** | User security detail; unlock, reset attempts. |

### 2.5 Hooks (API integration)

- **useAdminDashboard:** GET /admin/dashboard/overview.
- **useAgents:** stats, list, get one, approve-kyc, reject-kyc, suspend, activate.
- **useUsers:** stats, list, get one, suspend, unsuspend, verify-email, reset-password, credit-wallet, debit-wallet, freeze-wallet, unfreeze-wallet.
- **useMerchants:** list, get one, approve, reject.
- **useWithdrawals:** stats, list, pending, get one, approve, mark paid, reject.
- **useDisputes:** stats, list, get one, escalate, resolve.
- **useOperations:** combined stats (disputes, escrows, requests); list disputes, escrows, mint/burn requests; cancel mint/burn.
- **useFinancials:** transaction/wallet/payment stats and lists; refund, flag; freeze/unfreeze.
- **useEducation:** stats, progress list, users with education, get user progress, reset, mark complete.
- **useSecurity:** stats, issues list, unlock, reset attempts.

### 2.6 Components

- **Charts:** SalesChart, OrderStatusChart, UserGrowthChart, TokenDistributionChart, AgentTierChart.
- **RequiresAttention:** summary of pending items (KYC, withdrawals, disputes, escrows, flagged).
- **Sidebar, Header, mode-toggle, theme-provider.** UI primitives: button, card, input, table, dialog, tabs, badge, etc.
- **disputes/dispute-table;** **alert-dialog, alert, form, textarea, select, label.**

---

## 3. Mobile App (afriX-mobile)

### 3.1 Stack

- **Framework:** Expo (React Native) with Expo Router (file-based routing).
- **UI:** React Native, react-native-paper, expo-linear-gradient, Ionicons, SafeAreaView.
- **State:** Zustand stores (auth, wallet, agent, education, mintRequest, burn, transfer, swap, notification).
- **API:** Axios client in `src/services/apiClient.ts`; base URL from `EXPO_PUBLIC_API_URL` or default; JWT from SecureStore; 401/403 handling and optional 2FA/deposit error handling.
- **Auth storage:** Expo SecureStore (auth_token, refresh if used).
- **Push:** expo-notifications; FCM token sent to backend (POST /users/fcm-token).
- **Biometrics:** expo-local-authentication (Face ID / Touch ID) for app lock when returning from background (optional; stored in SecureStore).

### 3.2 App structure (Expo Router)

- **Root:** `app/_layout.tsx` — auth init, global redirect (authenticated → home, else → welcome), app lock (biometric on resume), `useIncomingTransferListener` for global transfer updates.
- **Auth group:** `(auth)/` — welcome, register, check-email, login, verify, two-factor, forgot-password, resend-verification, reset-password.
- **Tabs (main app):** `(tabs)/` — Home (index), Activity, Agents, Profile; Settings and sell-tokens flows are under tabs but hidden from tab bar.
- **Modals:** buy-tokens, send-tokens, receive-tokens, swap-tokens, request-tokens (placeholder “Coming soon”), become-agent, agent-deposit, agent KYC and registration, agent edit profile/bank details, agent withdrawal request/success, rate-agent.
- **Agent area:** `agent/` — dashboard, requests, profile, deposit, deposit-history, withdrawal-history, request-details/[id], transaction-details/[id], reviews.
- **Other:** education (index), settings (security, notifications, change-password, notification-inbox), help-support (index, faq), transaction-details/[id].

### 3.3 Auth flow (implemented)

- **Welcome** → Register or Login.
- **Register** → email, password, name, country → POST /auth/register → Check email screen.
- **Verify email** → code entry → POST /auth/verify-email → then login redirect.
- **Login** → POST /auth/login → if 2FA required, redirect to two-factor screen → POST /auth/2fa/validate → then home.
- **Forgot password** → POST /auth/forgot-password → Reset password (token) → POST /auth/reset-password.
- **Resend verification** → POST /auth/resend-verification.
- **Change password** (in settings) → POST /auth/change-password.
- **Logout** → clear token; redirect to welcome.
- **Biometric app lock:** optional; when enabled, returning from background prompts Face ID/Touch ID; failure leaves app “locked” until success.

### 3.4 Home & wallet

- **Home (`(tabs)/index`):** Displays balances (from GET /wallets or /users/balances/summary); quick actions: Buy, Send, Receive, Swap, Sell, Request (opens “Coming soon” modal). Recent transactions from GET /transactions.
- **Rates:** GET /wallets/rates for swap and agent display (e.g. AgentCard).
- **Transfer (send):** Modals send-tokens (index → amount → scan-qr or email → confirm → success). POST /wallets/transfer (to_email, amount, token_type).
- **Receive:** receive-tokens modal (show QR / share); no backend call (receiver gets tokens via transfer).
- **Swap:** swap-tokens modal (from/to token, amount); POST /wallets/swap.
- **Activity:** GET /transactions + GET /transactions/pending-review + GET /requests/user; combined list with filters (all, mint, burn, swap, transfer, credit, debit); tap to transaction-details/[id] or request status.

### 3.5 Buy tokens (mint flow)

- **Entry:** Home or modal “Buy Tokens” → buy-tokens/index (token type, amount) → select-agent → payment-instructions (agent bank details, timer) → upload-proof (screenshot + reference) → status screen.
- **API:** POST /requests/mint, POST /requests/mint/:id/proof, GET /requests/mint/:id (polling); cancel: DELETE /requests/mint/:id. Agent: POST /requests/mint/confirm or reject.
- **Status:** Pending → Proof submitted → Confirmed (tokens received) or Rejected/Expired. Rate agent after success (POST /agents/review).

### 3.6 Sell tokens (burn flow)

- **Entry:** Home “Sell” → sell-tokens/index (amount, token type) → select-agent → bank-details (user’s bank for receiving fiat) → confirm → status screen.
- **API:** POST /requests/burn (creates escrow), GET /requests/burn/:id. Agent: POST /requests/burn/:id/fiat-proof, POST /requests/burn/reject. User: POST /requests/burn/confirm (confirm receipt of fiat).
- **Status:** Escrowed → Fiat sent (user must confirm or dispute) → Confirmed or Rejected/Expired. Dispute: POST /disputes from status screen.

### 3.7 Agents (user view)

- **List:** GET /agents/list (and /users/find-agents if used); AgentCard shows rating, response time, capacity (from wallet store rates).
- **Detail:** `agents/[id]` — agent info, reviews (GET /agents/:id/reviews); “Buy from this agent” entry.

### 3.8 Agent mode (user is agent)

- **Become agent:** Modal become-agent → agent-registration (POST /agents/register with country, currency, withdrawal_address) → KYC flow (modals agent-kyc: personal-info, upload-documents, status) → POST /agents/kyc/upload, GET /agents/kyc/status.
- **Deposit:** agent-deposit modal or agent/deposit screen; GET /agents/deposit-address; POST /agents/deposit (amount_usd, tx_hash).
- **Dashboard:** agent/(tabs)/dashboard — stats, pending requests.
- **Requests:** agent/(tabs)/requests — list; request-details/[id] for mint/burn (confirm, reject, upload fiat proof).
- **Profile:** agent/(tabs)/profile; edit modals (edit-profile, edit-bank-details).
- **Withdrawal:** withdrawal-request modal; POST /agents/withdraw-request; withdrawal-success modal. Withdrawal history: agent/withdrawal-history.
- **Reviews:** agent/reviews (GET /agents/:id/reviews; respond via POST /agents/review/:id/respond).

### 3.9 Disputes (user)

- **Open dispute:** From mint or burn status screen (e.g. “I didn’t receive it”); POST /disputes with escrow_id or mint_request_id, reason, details. Resolved by admin (web); user sees status in app if we expose it (e.g. dispute detail or activity).

### 3.10 Education

- **Screen:** education/index — GET /education/progress; GET /education/quiz/:module; POST /education/submit/:module. Modules: what_are_tokens, how_agents_work, etc. Used for gating (backend can require modules before mint/burn).

### 3.11 Notifications & settings

- **Inbox:** settings/notification-inbox — GET /notifications; POST /:id/read, POST /read-all; GET/PUT /notifications/settings.
- **Settings:** security (2FA enable/disable, biometric, change password), notifications (preferences), change-password.
- **Profile:** profile tab; profile/edit (PUT /users/profile or /update); GET /auth/me or /users/me.

### 3.12 Help & support

- **Screens:** help-support/index, help-support/faq — in-app help text and FAQ (no backend).

### 3.13 Request tokens (placeholder)

- **Modal:** modals/request-tokens.tsx — “Coming soon” message; no API. Backend has no token-request (user requests from friend) flow.

### 3.14 Stores (Zustand)

- **authSlice:** login, register, logout, initAuth, user, tokens, 2FA state.
- **walletSlice:** fetchWallets, fetchRates (GET /wallets/rates), balances.
- **agentSlice:** listAgents, getAgent, agent profile (for agent user).
- **educationSlice:** progress, quiz, submit.
- **mintRequestSlice:** createMint, uploadProof, cancel, confirm (agent); open dispute.
- **burnSlice:** createBurn, confirmFiatSent (agent), confirm (user), reject (agent); open dispute.
- **transferSlice:** transfer (POST /wallets/transfer).
- **swapSlice:** swap (POST /wallets/swap); uses /wallets/rates.
- **notificationSlice:** fetch notifications (GET /notifications), mark read, settings.

### 3.15 Hooks & services

- **useIncomingTransferListener:** Polls GET /transactions?limit=1; triggers wallet refresh on new incoming transfer.
- **apiClient:** Axios; SecureStore token; interceptors for 401, 403 (non-agent), 400 self-transfer, deposit/2FA errors.
- **pushNotifications:** Register for push; get token; send to backend (FCM).

---

## 4. Cross-Stack Summary

### 4.1 Implemented end-to-end

| Flow | Backend | Web admin | Mobile |
|------|---------|-----------|--------|
| **User registration & login** | ✅ | — | ✅ (including 2FA step) |
| **Email verification** | ✅ | — | ✅ |
| **Password reset** | ✅ | — | ✅ |
| **P2P transfer** | ✅ | — | ✅ (send by email; receive via QR/share) |
| **Token swap** | ✅ | — | ✅ |
| **Buy from agent (mint)** | ✅ | View/cancel mint requests | ✅ (full flow + rate agent) |
| **Sell to agent (burn)** | ✅ | View/cancel burn requests | ✅ (full flow + dispute) |
| **Escrow (burn)** | ✅ | View escrows; force-finalize; process expired | Used internally in burn flow |
| **Disputes** | ✅ | List, escalate, resolve | ✅ Open from mint/burn status |
| **Agent registration & KYC** | ✅ | Approve/reject KYC | ✅ (upload, status, resubmit) |
| **Agent deposit** | ✅ | — | ✅ (deposit-address, submit deposit) |
| **Agent withdrawal request** | ✅ | List, approve, mark paid, reject | ✅ (request, success, history) |
| **Agent mint/burn queue** | ✅ | — | ✅ (requests, request-details) |
| **Agent reviews** | ✅ | — | ✅ (submit, respond) |
| **User profile & settings** | ✅ | — | ✅ (edit, security, 2FA, notifications) |
| **Education modules** | ✅ | Stats, progress, reset, mark complete | ✅ (progress, quiz, submit) |
| **Notifications (inbox + prefs)** | ✅ | — | ✅ |
| **Admin dashboard** | ✅ | ✅ Overview, users, agents, merchants, financials, operations, disputes, withdrawals, education, security | — |
| **Pay merchant in app** | ✅ Backend ready | — | 🔜 **Coming soon** |
| **Merchant (backend & admin)** | ✅ Register, payment-request, pay, dashboard, KYC | ✅ List, approve, reject | — |

### 4.2 Not implemented (or placeholder)

- **Token request (user requests from friend):** **Coming soon.** Backend has no API yet; mobile has "Coming soon" modal. FAQ updated to mark as coming soon.
- **Pay merchant in app:** **Coming soon.** Backend supports payment-request and /payments/process; in-app "pay merchant" (scan QR, payment link) is not yet in the mobile app.
- **WebSocket:** Backend has `websocket/` (server, handlers); not verified if mobile or web use it for live updates (mobile uses polling for activity/transfers).

### 4.3 Agent deposit flow (clarification)

- **Current implementation:** The agent **submits** the transaction hash and amount (POST /agents/deposit with `amount_usd` and `tx_hash`) after sending USDT to the platform treasury address. The backend **verifies the transaction on the blockchain** (via `blockchainService.verifyDeposit`) and then credits the agent’s capacity. There is **no automatic on-chain detection** of deposits without the agent submitting the tx hash (no background job that scans the treasury address for new incoming transfers). So: **submit tx_hash + amount → backend verifies on-chain → capacity updated.**

### 4.4 Optional / config-dependent

- **Redis:** Used if enabled; else in-memory cache.
- **Blockchain:** Config and blockchainService present; actual on-chain mint/burn may depend on env (e.g. testnet).
- **Push (FCM):** Backend accepts FCM token; mobile registers; delivery depends on Firebase/APNs setup.
- **Email (Resend):** Used for verification, password reset, etc.; depends on env config.

---

**Document version:** 1.0  
**Last updated:** February 2025  
**Based on:** Direct inspection of `afriX_backend`, `afrix-web`, and `afriX-mobile` codebases.
