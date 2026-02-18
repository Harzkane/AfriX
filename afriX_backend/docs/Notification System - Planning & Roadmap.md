# Notification System — Planning & Roadmap

This document summarizes what our goldmine docs specify, what we have today, and a phased plan to make notifications a first-class feature of the app.

**Implementation spec:** See **Notification System - Design (Fintech-Style).md** for the authoritative design: inbox-first, single `deliver()` API, typed notifications, granular preferences (push + email only; SMS out of scope).

---

## 1. What the docs say (goldmine)

### 1.1 API spec (`AfriToken API Documentation.md`)

- **GET /api/v1/notifications** — List user notifications (paginated, optional `unreadOnly`). Response includes `type` (e.g. `TOKENS_RECEIVED`), `title`, `message`, `data`, `isRead`, `createdAt`, plus `unreadCount`.
- **POST /api/v1/notifications/:id/read** — Mark one as read.
- **POST /api/v1/notifications/read-all** — Mark all as read.
- **PUT /api/v1/notifications/settings** — **Granular preferences** (not just on/off per channel):
  - **push**: `tokensReceived`, `tokensSent`, `requestReceived`, `agentUpdates`, `marketingMessages`
  - **email**: `transactionReceipts`, `weeklyReport`, `marketingMessages`
  - **sms**: `securityAlerts`, `largeTransactions`

So the **target** is: a **Notification** entity (inbox), plus **per-category settings** per channel (push/email/sms).

### 1.2 When to send (`AfriToken: Complete Transaction Flows.md` — §12 Notification Triggers)

**Push — Users:** Registration/welcome, tokens received/sent, request received/fulfilled, agent status, dispute updates, security (new device, password), promotional.

**Push — Agents:** New request, request urgent (>10 min), payment confirmed, transaction complete, dispute filed, deposit confirmed, performance alert, status change.

**Push — Merchants:** Payment received, daily summary, weekly report, link expired, failed payment.

**Email — Users:** Verification, password reset, receipt (optional), dispute, security, marketing (opt-in).  
**Email — Agents:** Application status, approval, training, dispute, performance.  
**Email — Admin:** New application, dispute, system alert, reports.

**SMS (critical only):** User verification (if email fails), suspicious login, large transaction (>$1000); Agent urgent request (>15 min), dispute filed, suspension.

**In-app:** Notification center (all push stored, unread badge, swipe/tap), plus toasts (balance, confirm, error, announcement).

### 1.3 Roadmap (`AfriToken: Complete Development Roadmap.md`)

- Phase 1: “Build user settings endpoints (language, theme, **notifications**)”.
- Phase 3: “Create agent notification system (push + SMS)”, “Create user notification on mint completion”, “Build agent notification for burn requests”.
- Later: “Implement transaction status notifications”, “Build notification toasts”, “Add merchant transaction notifications”, “Implement push notification campaigns”.

---

## 2. What we have today

### 2.1 Backend

| Area | Status |
|------|--------|
| **User model** | Three booleans: `push_notifications_enabled`, `email_notifications_enabled`, `sms_notifications_enabled` (defaults: true, true, false). |
| **Profile update** | `PUT /users/update` and `PUT /users/profile` both call `updateProfile`; it persists the three booleans and invalidates `user:${id}` cache. |
| **Push delivery** | `notificationService.sendPush(userIds, title, message, data)` — FCM only; no check of `push_notifications_enabled` before sending. |
| **FCM token** | User has `fcm_token`; endpoint to update it (e.g. `PUT /users/fcm-token`). |
| **Notification API** | **None.** No `GET/POST /notifications`, no `Notification` model, no `PUT /notifications/settings`. |
| **Email/SMS** | Email used for verification/password reset; no generic “notification” emails. No SMS sending service. |
| **Respecting prefs** | Push is sent regardless of user’s push/email/SMS toggles. |

### 2.2 Mobile

| Area | Status |
|------|--------|
| **Settings screen** | Profile → Notifications: three toggles (Push, Email, SMS) that call `PUT /users/profile` and update auth store. **Working.** |
| **Alert Types** | Transaction Updates, Security Alerts, Marketing & Promos — **placeholder only** (disabled toggles, “Coming soon”). |
| **In-app inbox** | No notification list, no unread badge, no “mark read”. |
| **Toasts** | Ad hoc; no unified “notification toast” system. |

---

## 3. Gaps (doc vs reality)

1. **No notification inbox** — No model, no GET/POST endpoints, no UI to list/read notifications.
2. **No granular settings** — Doc has per-category (e.g. `push.tokensReceived`); we only have channel on/off.
3. **Push doesn’t respect prefs** — We never check `user.push_notifications_enabled` (or FCM token) before sending.
4. **No email/SMS notification flows** — No “send this notification via email/SMS” based on user prefs or category.
5. **No SMS provider** — Twilio (or similar) not integrated for critical SMS.
6. **No notification creation** — When we send push (mint/burn/request/etc.), we don’t write a Notification record for the inbox.

---

## 4. Why this matters for the app

- **Trust** — Users need to know they’ll be notified for important events (tokens received, disputes, security).
- **Retention** — Timely push/email for requests and completions keeps agents and users engaged.
- **Compliance** — Security and large-transaction SMS are part of the documented design.
- **Support** — “Check your notifications” is a standard support answer; we need a real inbox.
- **Preference control** — Granular settings reduce opt-outs and align with the doc.

---

## 5. Brainstorm: scope and phases

### Phase A — Foundation (inbox + respect channel toggles)

**Goal:** Notifications exist as data, and we stop sending push when the user has turned it off.

- **Backend**
  - Add **Notification** model: `user_id`, `type` (enum or string), `title`, `message`, `data` (JSON), `is_read`, `read_at`, `created_at`. Index `user_id` + `created_at`, and `user_id` + `is_read` for unread count.
  - **Create notification** helper: when we would send a push (mint complete, request received, etc.), **first** insert a Notification row for that user, then call `sendPush` **only if** `user.push_notifications_enabled` and `user.fcm_token` present.
  - Add **GET /notifications** (paginated, optional unread only), **POST /notifications/:id/read**, **POST /notifications/read-all**. Auth: current user’s notifications only.
- **Mobile**
  - Notification center screen: list from GET /notifications, unread badge (e.g. on profile or tab), mark read on tap and “mark all read”.
- **Docs**
  - Keep API doc as target; add a short “current implementation” note: inbox + channel toggles done; granular settings in Phase B.

**Outcome:** Every push-worthy event creates an in-app notification; push is sent only if the user has push enabled. No new channels (email/SMS) yet.

---

### Phase B — Granular settings (per category)

**Goal:** Align with doc’s **PUT /notifications/settings** and mobile “Alert Types”.

- **Backend**
  - Extend **User** (or new **UserNotificationSettings**): store JSON or columns for push/email/sms categories (e.g. `push_tokens_received`, `push_marketing`, `email_transaction_receipts`, `sms_security_alerts`, `sms_large_transactions`). Defaults: security/large-transaction SMS on; marketing off.
  - Add **PUT /notifications/settings** (and optionally **GET**) with body like the doc. Validate and save.
  - When creating a notification, set a **category** (e.g. `TOKENS_RECEIVED`, `REQUEST_RECEIVED`, `MARKETING`). When sending push/email/SMS, check both channel on and category flag.
- **Mobile**
  - Notifications settings: keep channel toggles; replace “Coming soon” with real toggles for Transaction updates, Security alerts, Marketing & promos, wired to PUT /notifications/settings.
- **Backward compatibility**
  - If no granular settings stored, fall back to channel-level only (current three booleans).

**Outcome:** Users can turn off marketing but keep transaction/security alerts; backend and doc match.

---

### Phase C — Email and SMS delivery

**Goal:** Critical and optional notifications can be sent by email and/or SMS according to prefs.

- **Email**
  - Templates for: transaction receipt, dispute update, security alert, marketing (opt-in). Use existing email service; trigger from same “create notification” flow when category + `email_*` pref allow.
- **SMS**
  - Integrate Twilio (or similar). Send only for: verification (fallback), security alerts, large-transaction confirmation. Respect `sms_notifications_enabled` and granular `sms_security_alerts` / `sms_large_transactions`.
- **Send logic**
  - One place (e.g. `notificationService.notify(userId, category, payload)`) that: creates Notification row, then for each channel (push/email/SMS) checks prefs and sends.

**Outcome:** Doc’s email/SMS triggers are implementable; we respect both channel and category.

---

### Phase D — Polish and scale

- **Real-time:** WebSocket event for “new notification” so the app can update badge/list without polling.
- **Merchant notifications:** Payment received, daily summary, etc., as in doc.
- **Admin:** Optional dashboard for “notification delivery” metrics, or just use logs.
- **Campaigns:** Marketing pushes (respecting marketing opt-out) later.

---

## 6. Open decisions

1. **Storage for granular settings** — Separate table `user_notification_settings` vs. JSON column on User. Separate table is clearer for many categories and future additions.
2. **Notification types** — Enum in code + DB (e.g. `TOKENS_RECEIVED`, `REQUEST_RECEIVED`, `AGENT_UPDATE`, `DISPUTE`, `SECURITY`, `MARKETING`) so we can map to doc’s triggers and to category flags.
3. **SMS provider** — Twilio is referenced in the roadmap; confirm and add to env (e.g. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`).
4. **Email templates** — Where they live (backend repo vs. SendGrid/Postmark UI) and how we pass variables (transaction link, dispute id, etc.).
5. **Mobile notification center** — New top-level tab vs. screen under Profile. Doc suggests “notification bell with unread count”; often this is in the header with a stack/screen for the list.

---

## 7. Suggested next steps

1. **Stakeholder alignment** — Confirm Phase A (inbox + respect push toggle) as the first milestone.
2. **Schema** — Add `Notification` model and migration; define `type` enum and indexes.
3. **Audit send sites** — List every place we call `sendPush` (requestController, agentService, adminWithdrawalController, etc.); add “create Notification + check push pref” there or in a wrapper.
4. **Implement GET/POST notifications** and minimal notification center UI.
5. **Then** plan Phase B (granular settings + PUT /notifications/settings) and wire mobile Alert Types to it.

This keeps the doc as the north star while we deliver value incrementally and avoid big-bang rewrites.
