# Implementation Plan: Request Tokens Engine & Merchant Invoice System

Transform the **Request Tokens** feature in AfriExchange from a placeholder into a unified **Request Tokens & Merchant Invoicing Engine**. This system bridges Peer-to-Peer (P2P) payment requests and Merchant E-Commerce Payment Links (Path A & Path B integration rails).

---

## Technical Overview & Background

AfriExchange currently supports two primary transaction models:
1. **P2P Direct Transfers & Swaps**: Users send tokens via email or wallet address (`/wallets/transfer`, `/wallets/swap`).
2. **Merchant E-Commerce Integration Rails**:
   - **Path A (Standard Single Merchant)**: Merchant backend creates payment requests (`POST /api/merchants/payment-request`), generating a hosted payment link or QR context for checkout.
   - **Path B (Marketplace Vendors - e.g. Kaalis Store)**: Marketplace vendor collections and payouts (`/api/v1/integrations/kaalis/*`) with signed webhooks.

Currently, the mobile app's `request-tokens.tsx` screen is a static "Coming Soon" teaser. By implementing a unified **Request Tokens Engine**, we enable:
- **P2P Requests**: Regular users can request specific amounts from friends, contacts, or buyers with an instant pay link and QR code.
- **Merchant Quick Invoicing & Links**: Merchants can create custom payment requests directly from mobile, track payment status in real-time, copy shareable checkout links, and trigger automated webhook callbacks when paid.

---

## User Review Required

> [!IMPORTANT]
> **Unified Request Schema**: We propose unifying P2P token requests and Merchant payment links into a single `payment_requests` database table on the backend, distinguished by `request_type` (`"p2p"` vs `"merchant"`). This ensures a single unified tracking dashboard for both casual users and commercial merchants.

> [!TIP]
> **Shareable Payment Links**: Requests will support deep-linking (e.g. `afriX://pay/:requestId` or web `https://afriexchange.com/pay/:requestId`), enabling recipients or buyers outside the app to open the payment view instantly.

---

## Open Questions

> [!IMPORTANT]
> 1. **Expiration & Time-to-Live (TTL)**: Should P2P requests have a default expiration (e.g. 7 days or custom slider 1-30 days), or stay active until manually cancelled?
> 2. **Notifications**: When a user creates a request targeting another user's email, should the backend automatically send an In-App Push Notification & Email alert to the recipient?

---

## Proposed Changes

### 1. Backend (`afriX_backend`)

#### [MODIFY] [constants.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/config/constants.js)
- Add `REQUEST_STATUS`: `PENDING`, `COMPLETED`, `CANCELLED`, `EXPIRED`.
- Add `REQUEST_TYPES`: `P2P`, `MERCHANT`.

#### [NEW] [PaymentRequest Model](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/models/PaymentRequest.js)
- Schema for token & payment requests:
  - `id`: UUID (Primary Key)
  - `requester_id`: User / Merchant UUID
  - `recipient_email`: Target email (optional for generic payment links)
  - `amount`: Number (Request token amount)
  - `token_type`: `NT`, `CT`, `USDT`
  - `description` / `note`: String
  - `request_type`: `"p2p"` | `"merchant"`
  - `merchant_id`: Linked merchant UUID (optional)
  - `status`: `"pending"` | `"completed"` | `"cancelled"` | `"expired"`
  - `payment_tx_id`: Linked transaction UUID upon fulfillment
  - `expires_at`: Timestamp
  - `created_at`, `updated_at`

#### [NEW] [requestController.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/controllers/tokenRequestController.js)
- Endpoints:
  - `POST /api/requests/create`: Create a P2P or Merchant token request.
  - `GET /api/requests/list`: List sent & received requests with filters (`pending`, `completed`, `cancelled`).
  - `GET /api/requests/:id`: Fetch single request details (public/authenticated for link payment).
  - `POST /api/requests/:id/pay`: Fulfill request (deducts requester's target amount from payer's wallet, credits requester, marks status `"completed"`).
  - `POST /api/requests/:id/cancel`: Cancel pending request.

#### [NEW] [requests.js Routes](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/routes/tokenRequests.js)
- Mount routes under `/api/v1/requests` (or `/api/requests`).

---

### 2. Mobile App (`afriX-mobile`)

#### [NEW] [useRequestStore.ts](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/src/stores/slices/requestSlice.ts)
- Zustand store managing:
  - `requests`: Sent & Received token requests list.
  - `activeRequest`: Currently selected request.
  - `createRequest(data)`: API call to create request.
  - `fetchRequests()`: Fetch user requests.
  - `payRequest(requestId)`: Execute payment for received request.
  - `cancelRequest(requestId)`: Cancel request.

#### [MODIFY] [request-tokens.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens.tsx)
- Transform from "Coming Soon" teaser into interactive **Create Request & Invoice Screen**:
  - **Header**: Title "Request Tokens", subtitle "Request tokens from contacts or create merchant invoices."
  - **Toggle Pill**: `[ 👤 Personal P2P ]` vs `[ 🏪 Merchant Invoice ]`
  - **Token & Amount Selection**: Side-by-side token cards (`NT`, `CT`, `USDT`), amount input + quick preset chips (`1,000`, `5,000`, `10,000`, `MAX`).
  - **Recipient / Note Field**: Email address or optional merchant invoice reference.
  - **Primary CTA**: `[ 📩 Send Token Request -> ]`
  - **Live Request History Tab**: Scrollable list of pending & past requests with status badges (`Pending`, `Paid`, `Cancelled`).

#### [NEW] [pay-request.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/pay-request.tsx)
- Fulfill Request Screen when clicking a share link or notification:
  - Request summary card: Requester info, amount requested, token type, note/invoice ref.
  - Wallet balance indicator & insufficient balance check.
  - `[ 🔒 Pay Request Now ⚡ ]` primary action button.

#### [MODIFY] [en.json & fr.json](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/src/i18n/translations/en.json)
- Add complete translation dictionary keys for `request_tokens` flow in English & French.

---

## Verification Plan

### Automated Tests
- Run TypeScript compilation across `afriX-mobile`:
  ```bash
  cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile
  npx tsc --noEmit
  ```
- Run backend syntax check:
  ```bash
  cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend
  node -c src/app.js
  ```

### Manual Verification
- Test P2P token request creation, QR code generation, and 1-tap copy link.
- Test merchant invoice request creation and link sharing.
- Test fulfilling a request from recipient wallet and verifying wallet balance update.
