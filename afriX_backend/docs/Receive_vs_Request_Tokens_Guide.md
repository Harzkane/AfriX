# Receive Tokens vs. Request Tokens — System Architectural Guide

This document thoroughly explains the architectural and operational differences between **Receive Tokens** and **Request Tokens** in AfriExchange to prevent confusion across design, mobile development, backend API integrations, and e-commerce merchant rails.

---

## Executive Summary

In AfriExchange, **Receive Tokens** and **Request Tokens** serve two completely different financial functions:

1. **Receive Tokens**: Represents your **permanent account identity** (wallet address & email). It is static, reusable, open-ended, and creates no database state when displayed.
2. **Request Tokens**: Represents a **dynamic single-use payment invoice** (`RQST-XXXXXX`). It specifies an exact amount, token type, and note, creates a tracked database transaction, dispatches push notifications, and blocks duplicate payments once completed.

---

## Technical Comparison Matrix

| Feature | 📥 Receive Tokens | 📩 Request Tokens |
| :--- | :--- | :--- |
| **Primary Purpose** | Display your permanent receiving credentials to receive payments anytime. | Issue a specific single-use payment invoice or shareable checkout link. |
| **Amount Specification** | **Open / Flexible** — The sender inputs whatever amount they wish to transfer. | **Fixed / Exact** — Locked to the requested amount (e.g. `10,000.00 NT`, `$50.00 USDT`). |
| **QR Code Type** | **Static Reusable QR** — Encodes email address and blockchain wallet address. | **Dynamic Single-Use QR & URL** (`https://afri-x.vercel.app/pay/RQST-XXXXXX`). |
| **Lifespan** | **Permanent** — Never expires; can be printed or displayed indefinitely. | **Time-Limited / Managed** — 1, 3, 7, 30 days, or manual cancellation. |
| **Backend State** | **No server record created** on display — runs completely client-side. | **Creates a `COLLECTION` Transaction record** in PostgreSQL database (`status: PENDING`). |
| **Single-Use Enforcement** | **No** — Senders can scan and send multiple times to the same wallet. | **YES** — Once paid, server marks `status = COMPLETED`. Rescanning blocks duplicate payments with *"Request Already Paid"*. |
| **Modes Supported** | Single account view (NT, CT, USDT wallet selection). | **Personal P2P** (splits/friends) vs **Merchant Invoice** (commercial checkout). |
| **Target Notifications** | None generated on QR display. | Dispatches **Instant Push & FCM Alerts** (`"PAYMENT_REQUEST_RECEIVED"`) to target email. |
| **History & Management** | N/A (not tracked as separate entities). | **My Requests History Dashboard** (`app/modals/request-tokens/my-requests.tsx`) with status filtering & cancellation. |

---

## System Workflows

```
                           +-------------------------------------+
                           |            USER INTENT              |
                           +------------------+------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
      [ WANT PERMANENT DEPOSIT QR ]                    [ WANT SPECIFIC PAYMENT LINK/INVOICE ]
                     |                                                 |
                     v                                                 v
           RECEIVE TOKENS FLOW                               REQUEST TOKENS FLOW
     (app/modals/receive-tokens/)                      (app/modals/request-tokens/)
                     |                                                 |
  +------------------+------------------+           +------------------+------------------+
  | Displays Static Email & Wallet      |           | Creates DB Record (RQST-XXXXXX) |
  | Address QR (No Server Payload)      |           | Encodes Hosted Payment Link QR   |
  +------------------+------------------+           +------------------+------------------+
                     |                                                 |
                     v                                                 v
        Sender scans static QR                            Sender scans RQST-XXXXXX QR
                     |                                                 |
  +------------------+------------------+           +------------------+------------------+
  | Pre-populates recipient email       |           | 1. Queries backend: GET /requests/id|
  | Sender types ANY custom amount      |           | 2. Verifies status === "pending" |
  | Multiple payments allowed           |           | 3. Auto-fills recipient, amount, |
  +-------------------------------------+           |    token, note & locks request ID|
                                                    | 4. Blocks repay if COMPLETED     |
                                                    +----------------------------------+
```

---

## Deep Dive: Receive Tokens

### 1. File Locations
- Mobile Screen: [app/modals/receive-tokens/index.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/receive-tokens/index.tsx)
- Payload format:
  ```json
  {
    "type": "afritoken_receive",
    "email": "user@example.com",
    "token": "NT",
    "address": "0x1234...5678",
    "version": "1.0"
  }
  ```

### 2. How the Scanner Handles It
When scanned in **Send Tokens** (`app/modals/send-tokens/scan-qr.tsx`), the scanner parses the email or address, pre-populates `recipientEmail`, and navigates to the **Enter Amount** screen. The user is free to input any amount.

---

## Deep Dive: Request Tokens

### 1. File Locations
- Mobile Creator Screen: [app/modals/request-tokens/index.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens/index.tsx)
- Mobile Share Screen: [app/modals/request-tokens/share.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens/share.tsx)
- Mobile History Dashboard: [app/modals/request-tokens/my-requests.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens/my-requests.tsx)
- Mobile Detail Screen: [app/modals/request-tokens/detail.tsx](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile/app/modals/request-tokens/detail.tsx)
- Backend Controller: [requestController.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/controllers/requestController.js) & [merchantController.js](file:///Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/controllers/merchantController.js)

### 2. Database Record Creation
Creating a payment request executes `POST /api/v1/requests/payment-request`, inserting a pending `Transaction` record:
- `reference`: `"RQST-8F3A7K"`
- `type`: `"collection"`
- `status`: `"pending"`
- `to_user_id`: Creator UUID
- `amount`: Requested token amount (formatted to 2 decimal places)
- `token_type`: `"NT"` | `"CT"` | `"USDT"`
- `metadata`: `{ recipient_email, mode, expiration_days, privacy }`

### 3. How the Scanner Handles It
When a `RQST-XXXXXX` link or QR code is scanned:
1. Scanner immediately executes `GET /api/v1/requests/payment-request/RQST-XXXXXX`.
2. If `status === "completed"`, it displays the **"Request Already Paid"** alert and pops back instantly using `router.back()`.
3. If `status === "pending"`, it resolves the creator's email, pre-populates recipient, amount, token type, and note, attaches `requestId = "RQST-8F3A7K"`, and shows a **`PAYMENT REQUEST ATTACHED`** badge on the amount & confirm screens.
4. Upon transfer confirmation (`POST /api/v1/wallets/transfer`), the transfer succeeds and the backend atomically updates `RQST-8F3A7K` status to `"completed"`.

---

## E-Commerce & Integration Rails

### Personal P2P vs Merchant Invoice
- **Personal P2P (`mode: "p2p"`)**: Created by casual users for peer-to-peer transfers (rent, splitting lunch, debt reimbursement).
- **Merchant Invoice (`mode: "merchant"`)**: Created by merchants for business checkouts. Uses Path A hosted payment links (`https://afri-x.vercel.app/pay/RQST-XXXXXX`) and links `merchant_id`.

### Integration Rail Mapping
- **Path A (Direct Hosted Checkout & App Invoicing)**: Implemented via `/api/v1/requests/payment-request` and `/api/v1/merchants/payment-request`. Serves direct mobile invoicing and merchant checkout links.
- **Path B (Marketplace Vendors - e.g. Kaalis Store)**: Implemented via `/api/v1/integrations/kaalis/*`. Handles automated server-to-server checkout collections, vendor payouts, and signed webhooks across external platforms.

---

## Developer Rules to Prevent Confusion

1. **NEVER use Receive Tokens logic for payment requests**: Receive Tokens does not track state or lock amounts. Payment requests MUST always generate a `RQST-` reference.
2. **ALWAYS enforce 2 decimal places**: Token amounts across both flows must format using `formatAmount(amount, tokenType)` (e.g. `10,000.00 NT`, `50.00 USDT`).
3. **DO NOT mutate single-use status**: A completed `RQST-` reference can never be reverted to pending. Once `completed`, attempts to re-pay will be rejected by both mobile scanner and backend validation.
