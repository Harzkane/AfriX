# Notification System — Design (Fintech-Style)

This document defines the notification logic and system for AfriX as a **modern fintech-style** implementation: inbox-first, typed events, granular preferences (push + email only), and a single delivery pipeline. **SMS is out of scope** for this design and can be added later without changing the core model.

---

## 1. Principles

| Principle | Meaning |
|-----------|--------|
| **Inbox-first** | Every user-facing event creates a **Notification** record. Push and email are **delivery channels**; the inbox is the source of truth. |
| **Single entry point** | All call sites use one API: `notificationService.deliver(userId, type, payload)`. No direct `sendPush` from controllers. |
| **Type-driven** | Each notification has a **type** (e.g. `TOKENS_MINTED`, `NEW_MINT_REQUEST`). Types drive copy, routing, and preference checks. |
| **Preference-respecting** | Before sending push: user has push on + category allowed + valid FCM token. Before sending email: user has email on + category allowed. |
| **Auditable** | We store what was created and when; optional delivery metadata (e.g. `push_sent_at`) for debugging. |
| **No SMS in scope** | Channels are **push** and **email** only. SMS can be added later as another channel with its own prefs. |

---

## 2. Data model

### 2.1 Notification (inbox)

Single table: **notifications**.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID or bigint PK | |
| `user_id` | FK → users.id | Recipient |
| `type` | string (see §3) | Notification type/category |
| `title` | string | Short title (e.g. "Tokens Minted!") |
| `message` | text | Body text |
| `data` | JSONB / JSON | Optional payload: `transactionId`, `requestId`, `amount`, etc. For deep links and UI. |
| `is_read` | boolean, default false | |
| `read_at` | timestamp null | When user marked it read |
| `created_at` | timestamp | |
| `push_sent_at` | timestamp null | Optional: when push was sent (for audit) |
| `email_sent_at` | timestamp null | Optional: when email was sent |

**Indexes:** `(user_id, created_at DESC)`, `(user_id, is_read)` for unread count.

**Retention:** Optional policy later (e.g. delete or archive after 90 days). Not required for v1.

### 2.2 User notification settings (granular)

Two options:

- **A) Separate table `user_notification_settings`**  
  One row per user. Columns: `user_id`, then booleans for each category per channel. Easy to add new categories later.

- **B) JSON column on `users`**  
  e.g. `notification_preferences JSONB`. Flexible but less explicit for queries and validation.

**Recommendation: A** — table with explicit columns. Clear for API and future additions.

**Columns (push + email only; no SMS):**

| Column | Default | Description |
|--------|---------|-------------|
| `user_id` | — | PK/FK users.id |
| **Push** | | |
| `push_transactions` | true | Tokens received/sent, mint/burn completed |
| `push_requests` | true | New request, request updated |
| `push_agent_updates` | true | Agent status, reviews, withdrawal approved/rejected |
| `push_security` | true | Login, password change (recommend always true) |
| `push_marketing` | false | Promos, news |
| **Email** | | |
| `email_transaction_receipts` | true | Receipt after mint/burn/transfer |
| `email_agent_updates` | true | Withdrawal status, reviews |
| `email_security` | true | Security-related |
| `email_marketing` | false | Newsletter, promos |
| `updated_at` | | |

**Backward compatibility:** Keep existing `users.push_notifications_enabled` and `users.email_notifications_enabled` as **master switches**. If master is false, no push/email is sent regardless of granular flags. When we read preferences: `push_enabled = user.push_notifications_enabled && settings.push_<category>`.

---

## 3. Notification types (enum)

Types drive (a) which preference category to check, and (b) default copy/templates. Map from current send sites and goldmine triggers.

### 3.1 User-facing (app user)

| Type | Preference category | When created | Push title example |
|------|---------------------|---------------|---------------------|
| `TOKENS_MINTED` | transactions | Agent confirms mint | "Tokens Minted!" |
| `MINT_REJECTED` | transactions | Agent rejects mint | "Mint Request Rejected" |
| `TOKENS_BURNED` | transactions | Burn confirmed | "Tokens Received!" (or burn-specific) |
| `BURN_REJECTED` | transactions | Agent rejects burn | "Burn Request Rejected" |
| `FIAT_SENT` | requests | Agent marks fiat sent (burn flow) | "Fiat Sent!" |
| `BURN_CONFIRMED` | transactions | User confirms burn | "Burn Confirmed!" |
| `NEW_REQUEST` | (agent-only) | — | — |

### 3.2 Agent-facing

| Type | Preference category | When created | Push title example |
|------|---------------------|---------------|---------------------|
| `NEW_MINT_REQUEST` | requests | User uploads proof | "New Mint Request" |
| `NEW_BURN_REQUEST` | requests | User creates burn request | "New Burn Request" |
| `DEPOSIT_CONFIRMED` | agent_updates | Admin confirms agent deposit | "Deposit Confirmed" |
| `WITHDRAWAL_REQUESTED` | agent_updates | Agent submits withdrawal | "Withdrawal Requested" |
| `WITHDRAWAL_APPROVED` | agent_updates | Admin approves | "Withdrawal Approved" |
| `WITHDRAWAL_REJECTED` | agent_updates | Admin rejects | "Withdrawal Rejected" |
| `WITHDRAWAL_PAID` | agent_updates | Admin marks paid | "Withdrawal Paid!" |
| `NEW_REVIEW` | agent_updates | User leaves review | "New Review Received! ⭐" |

### 3.3 Security (both; always allow if channel on)

| Type | Preference category | When created |
|------|---------------------|--------------|
| `SECURITY_LOGIN` | security | New device / suspicious login (future) |
| `SECURITY_PASSWORD` | security | Password change (future) |

### 3.4 Marketing (optional later)

| Type | Preference category |
|------|---------------------|
| `MARKETING_PROMO` | marketing |

**Category → preference flags:**

- **transactions** → `push_transactions`, `email_transaction_receipts`
- **requests** → `push_requests` (agents)
- **agent_updates** → `push_agent_updates`, `email_agent_updates`
- **security** → `push_security`, `email_security`
- **marketing** → `push_marketing`, `email_marketing`

---

## 4. Single delivery API

### 4.1 Service signature

```js
// notificationService.deliver(userId, type, options)
// options: { title?, message?, data?, sendPush?: true, sendEmail?: true }
// If title/message omitted, use defaults from NOTIFICATION_DEFAULTS[type]
await notificationService.deliver(mintRequest.user_id, "TOKENS_MINTED", {
  title: "Tokens Minted!",
  message: `Your ${amount} ${token_type} tokens have been minted`,
  data: { requestId: mintRequest.id, transactionId: txn?.id, amount, token_type },
});
```

### 4.2 Internal flow (pseudo)

1. **Create** — Insert into `notifications` (user_id, type, title, message, data, is_read: false).
2. **Load user + settings** — Get `user` (push_notifications_enabled, email_notifications_enabled, fcm_token, email) and `user_notification_settings` (or defaults).
3. **Push** — If `options.sendPush !== false` and user.push_notifications_enabled and category push flag and user.fcm_token: call FCM; set `push_sent_at` (optional).
4. **Email** — If `options.sendEmail !== false` and user.email_notifications_enabled and category email flag: render template by type, send email; set `email_sent_at` (optional).
5. Return the created notification (or id) for logging.

All existing `sendPush(…)` call sites are replaced with `deliver(…)` with the appropriate type and options. No code path should call `sendPush` directly.

---

## 5. REST API

### 5.1 Inbox

- **GET /api/v1/notifications**  
  Query: `page`, `limit`, `unreadOnly` (boolean).  
  Response: `{ success, data: [ { id, type, title, message, data, is_read, read_at, created_at } ], unreadCount, pagination }`.  
  Auth: only current user’s notifications.

- **POST /api/v1/notifications/:id/read**  
  Mark one as read (set `is_read = true`, `read_at = now`). Return updated notification.  
  Auth: only if notification.user_id === req.user.id.

- **POST /api/v1/notifications/read-all**  
  Mark all current user’s as read. Return `{ markedCount }`.

### 5.2 Preferences

- **GET /api/v1/notifications/settings**  
  Return current user’s notification settings (channel master switches from user + granular from user_notification_settings).  
  Example: `{ push: { enabled, transactions, requests, agentUpdates, security, marketing }, email: { enabled, transactionReceipts, agentUpdates, security, marketing } }`.  
  No SMS in response.

- **PUT /api/v1/notifications/settings**  
  Body: same shape. Update `users.push_notifications_enabled` / `email_notifications_enabled` and rows in `user_notification_settings`. Validate booleans. Return updated settings.

**Note:** Existing **PUT /users/profile** can continue to accept the three master switches (`push_notifications_enabled`, `email_notifications_enabled`, `sms_notifications_enabled`) for backward compatibility; internally they update `users` and optionally sync to the same logic. Or we migrate the mobile to use only PUT /notifications/settings for notification prefs. Recommendation: keep PUT /users/profile for the three toggles; PUT /notifications/settings for granular. Both read from same user + user_notification_settings.

---

## 6. Mapping current send sites to deliver()

| Current call site | Recipient | Type | Category |
|-------------------|-----------|------|----------|
| requestController: uploadMintProof → agent | agent.user_id | `NEW_MINT_REQUEST` | requests |
| requestController: confirmMint → user | mintRequest.user_id | `TOKENS_MINTED` | transactions |
| requestController: rejectMint → user | mintRequest.user_id | `MINT_REJECTED` | transactions |
| requestController: createBurnRequest → agent | request.agent_id | `NEW_BURN_REQUEST` | requests |
| requestController: rejectBurn → user | burnRequest.user_id | `BURN_REJECTED` | transactions |
| requestController: confirmFiatSent → user | request.user_id | `FIAT_SENT` | requests |
| requestController: confirmBurn → agent | request.agent_id | `BURN_CONFIRMED` | agent_updates |
| agentService: deposit confirmed → agent | agent.user_id | `DEPOSIT_CONFIRMED` | agent_updates |
| agentService: withdrawal requested → agent | agent.user_id | `WITHDRAWAL_REQUESTED` | agent_updates |
| agentService: new review → agent | agent.user_id | `NEW_REVIEW` | agent_updates |
| adminWithdrawalController: approved → agent | request.agent.user_id | `WITHDRAWAL_APPROVED` | agent_updates |
| adminWithdrawalController: paid → agent | agent.user_id | `WITHDRAWAL_PAID` | agent_updates |
| adminWithdrawalController: rejected → agent | request.agent.user_id | `WITHDRAWAL_REJECTED` | agent_updates |

Each becomes: `deliver(userId, type, { title, message, data })` with type-specific defaults where possible.

---

## 7. Email templates (fintech-style)

- **Transaction receipt** — Used for TOKENS_MINTED, TOKENS_BURNED (and P2P if we add). Include: amount, token type, date, reference/link to transaction. Branded, clear CTA to open app.
- **Request update** — NEW_MINT_REQUEST / NEW_BURN_REQUEST for agents: “You have a new request; open the app to respond.”
- **Agent update** — WITHDRAWAL_APPROVED, WITHDRAWAL_REJECTED, WITHDRAWAL_PAID, DEPOSIT_CONFIRMED: short, actionable.
- **Security** — SECURITY_*: “If this wasn’t you, secure your account.”

Templates live in backend (e.g. `emailTemplates/notificationReceipt.js`) or in Resend/sendgrid as templates with variables. Prefer backend-owned templates for versioning and code review.

---

## 8. Mobile app (high level)

- **Notification center** — New screen (e.g. under Profile or tab): list from GET /notifications, pull-to-refresh, tap to mark read and optionally deep link (using `data.requestId`, `data.transactionId`).
- **Unread badge** — From GET /notifications?unreadOnly=true&limit=1 or a small GET /notifications/unread-count; show on Profile or header.
- **Settings** — Profile → Notifications: keep **channel toggles** (Push, Email) wired to master switches. Replace “Coming soon” **Alert Types** with granular toggles wired to **PUT/GET /notifications/settings** (Transaction updates, Security, Agent updates, Marketing). Remove SMS toggle from UI or leave as “Coming soon” for later.

---

## 9. Implementation order

1. **Schema** — Add `notifications` table; add `user_notification_settings` table (or migration adding columns). Migrations for both.
2. **Constants** — Define NOTIFICATION_TYPES and category mapping in code (e.g. `config/constants.js` or `services/notificationService.js`).
3. **notificationService** — Implement `deliver(userId, type, options)`: create notification, then push/email with pref checks. Keep existing `sendPush` as internal helper; add optional `sendNotificationEmail(type, user, payload)`.
4. **Replace call sites** — Replace every `sendPush(...)` with `deliver(..., type, { title, message, data })` using the table in §6.
5. **Routes** — Notifications router: GET/POST notifications, POST read, POST read-all; GET/PUT /notifications/settings. Auth middleware; ensure user can only see own notifications and settings.
6. **Settings controller** — GET/PUT notification settings (read/update user + user_notification_settings).
7. **Mobile** — Notification center screen, unread count, then granular settings UI wired to PUT/GET /notifications/settings.

---

## 10. Out of scope (for later)

- **SMS** — No SMS sending or SMS preference flags in this design. Can be added as another channel and preference table later.
- **Merchant notifications** — Separate flow; same pattern (deliver by type, preferences per merchant).
- **WebSocket** — Real-time “new notification” event can be added so the app updates badge without polling.
- **Retention/archival** — Optional; not required for v1.

This design gives you an inbox-first, preference-respecting, fintech-style notification system (push + email only) that matches the goldmine docs and current product, and leaves room for SMS and more channels later.
