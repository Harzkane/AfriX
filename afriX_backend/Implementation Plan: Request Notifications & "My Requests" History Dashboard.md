# Implementation Plan: Request Notifications & "My Requests" History Dashboard

Add instant push/email notifications for targeted payment requests and create a dedicated **"My Requests"** history screen allowing users to track, share, and cancel active pending payment request links.

---

## Technical Architecture & Distinction Analysis

### 1. Personal P2P vs Merchant Invoice: How the App Distinguishes Them
- **Mobile App**: Uses `mode: "p2p"` vs `mode: "merchant"`.
  - **Personal P2P**: Tailored for casual requests between friends/contacts (e.g. lunch, bills, split payments).
  - **Merchant Invoice**: Tailored for commercial transactions (stores, invoices, services) with custom reference IDs and formatted payment links.
- **Backend**: Both use the core `Transaction` engine (type `collection` / `transfer`). If the creator has a registered `Merchant` profile, `merchant_id` is automatically attached; otherwise it runs as a non-merchant commercial request link.

### 2. E-Commerce Integration Rails: Path A vs Path B
- **Path A (Direct Merchant Hosted Checkout & App Invoicing)**:
  - **This is what the mobile "Merchant Invoice" mode uses!**
  - Generates a direct payment link (`https://afri-x.vercel.app/pay/RQST-XXXXXX`) or QR code where buyers pay directly into the merchant's wallet.
- **Path B (Marketplace Vendors & Partner API Rails - e.g., Kaalis Store)**:
  - Dedicated server-to-server integration (`/api/v1/integrations/kaalis/*`).
  - Handles automated checkout collections, escrow holds, vendor payouts, and signed webhooks across third-party e-commerce platforms.

---

## User Review Required

> [!IMPORTANT]
> **Recipient Email Delivery**: When a request specifies a `recipient_email`, the backend will look up the recipient user account and dispatch an in-app notification & FCM push notification (`"PAYMENT_REQUEST_RECEIVED"`).

> [!TIP]
> **"My Requests" Dashboard**: We will add a **"My Requests"** tab inside the `request-tokens` modal (or accessible from the header), displaying all created requests with live status badges (`Pending`, `Paid`, `Cancelled`), 1-tap reshare, and a **Cancel Request** action.

---

## Proposed Changes

### 1. Backend (`afriX_backend`)

#### [MODIFY] [merchantController.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/controllers/merchantController.js)
- When `createPaymentRequest` runs:
  - If `customer_email` or `recipient_email` matches an existing user in the database, invoke `deliver(targetUser.id, "PAYMENT_REQUEST_RECEIVED", ...)` to send an instant push notification.

#### [MODIFY] [requestController.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/controllers/requestController.js)
- Enhance `getUserRequests` endpoint to return all payment request transactions (`type: "collection"`) created by the authenticated user (`to_user_id: req.user.id`), including live `status`, `reference`, `amount`, `token_type`, `description`, `created_at`, and `expires_at`.
- Add `POST /api/v1/requests/payment-request/:id/cancel` endpoint to mark a pending payment request as `cancelled`.

#### [MODIFY] [requests.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/routes/requests.js)
- Register `POST /payment-request/:id/cancel` route.

---

### 2. Mobile App (`afriX-mobile`)

#### [MODIFY] [requestSlice.ts](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/src/stores/slices/requestSlice.ts)
- Add state and actions:
  - `userRequests`: List of user's payment requests.
  - `fetchUserRequests()`: Call `GET /requests/user` (or `/requests/my-payment-requests`).
  - `cancelPaymentRequest(reqId)`: Call `POST /requests/payment-request/:id/cancel`.

#### [NEW] [my-requests.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens/my-requests.tsx)
- Create **My Requests** screen:
  - Filter pills: `All`, `Pending`, `Paid`, `Cancelled`.
  - Item cards displaying:
    - Request ID (`RQST-XXXXXX`) & mode badge (`P2P` or `Merchant`).
    - Target amount & token type (`10,000 NT`).
    - Status pill (`Pending` in Amber, `Paid` in Green, `Cancelled` in Muted).
    - Recipient email or note.
    - Quick actions: **[ 📋 Copy Link ]**, **[ 📤 Share QR ]**, **[ ❌ Cancel ]**.

#### [MODIFY] [index.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens/index.tsx)
- Add a **"My Requests History"** button in the header so users can switch between creating a request and viewing past/active requests.

---

## Verification Plan

### Automated Tests
- Typecheck mobile app:
  ```bash
  cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile
  npx tsc --noEmit
  ```

### Manual Verification
1. Create a payment request targeting a recipient email address → Verify push notification triggered.
2. Open **My Requests** history screen → Verify created request is listed with `Pending` status.
3. Test 1-tap copy link & 1-tap cancel from the list screen.
4. Fulfill the request with second user → Verify status updates to `Paid` in real-time.
