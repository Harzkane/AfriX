# Kaalis Store and AfriExchange: How the Two Platforms Work Together

## Purpose

This document explains **why** Kaalis Store and AfriExchange were integrated, **how** the implementations fit together at runtime, and **what each system owns**. It complements detailed specs (`MERCHANT_INTEGRATION_GUIDE.md`, `KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md`, webhook payload reference, admin runbook).

---

## Why this integration exists

### The problem

Kaalis Store needed reliable checkout and settlement for **XOF** markets. Traditional payment gateways and aggregators did not provide dependable coverage for what Kaalis needed. Without a workable rail, XOF-country buyers and sellers could not complete the commerce loop reliably.

### The decision

Kaalis connected to **AfriExchange**, which already provided:

- Merchant identity and **settlement wallets** (token-based)
- **Collections** (customer pays into the merchant settlement model)
- Wallet linking for users (buyers and sellers can hold and move **CT** and related flows)
- **Agent-assisted** token conversion when participants want fiat or liquidity off-platform

AfriExchange therefore acts as the **XOF-oriented payment and settlement layer**, while Kaalis remains the **commerce platform** (catalog, orders, marketplace vendors, payout orchestration).

### What changed after integration

- **XOF-country buyers** can link an AfriExchange wallet and pay through the AfriExchange rail at checkout.
- **Vendors** can link wallets and receive payout flows that settle through AfriExchange where that path applies.
- Operations gained **visibility** (settings, webhooks, health signals) instead of relying only on environment variables and tribal knowledge.

---

## Division of responsibility

### Kaalis Store owns

- Storefront, cart, and checkout **UX**
- Orders, order status, and marketplace **business rules**
- Vendor accounts, vendor balances in Kaalis, and **payout records**
- Admin tooling for payouts, platform settings, and **rail configuration** (NGN vs XOF)
- Calling AfriExchange **when** the active journey is XOF / AfriExchange

### AfriExchange owns

- **Merchant** identity linked to a settlement wallet
- **Token** wallets, ledger movements, and merchant **collections**
- **Partner integration APIs** used by Kaalis for collections and payouts (see below)
- **Merchant portal** (overview, collections, wallet assets, sell-through-agent, API & webhooks)
- Signing **webhooks** back to Kaalis for payout status updates
- Admin supervision of merchants, agents, disputes, and financial views

### Integration rule

The two systems communicate through **HTTP APIs** and **signed webhooks**, not shared databases. Kaalis keeps commerce truth; AfriExchange keeps settlement and wallet truth for the AfriExchange side of the flow.

---

## Active payment rail split (current model)

At a high level:

| Context | Typical rail |
|--------|----------------|
| Nigeria / **NGN** | Paystack, OPay (Kaalis-native providers) |
| **XOF** markets | **AfriExchange** |

Token strategy for the live Kaalis ↔ AfriExchange path is documented as **CT-first** for operational clarity (`TOKEN_STRATEGY_NOTE_CT_NT_USDT.md`). The platform remains architecturally multi-token (`NT`, `USDT`, etc.) where relevant.

---

## How the implementation is wired

### 1. Kaalis checkout → AfriExchange collection

When checkout uses the AfriExchange path for an order, Kaalis backend calls AfriExchange’s **Kaalis-specific integration** endpoint to create a **collection** tied to Kaalis metadata (order id, buyer context). AfriExchange records the merchant collection against the **linked Kaalis merchant** and settles to that merchant’s settlement wallet model.

This uses the dedicated routes under `/api/v1/integrations/kaalis/` (authenticated with the integration API key), not the generic browser-only merchant shop flow alone.

### 2. Vendor payouts → AfriExchange payout APIs

For vendor settlements that use the AfriExchange rail, Kaalis triggers payout creation via the same integration surface (`/integrations/kaalis/payouts`). AfriExchange creates the payout transaction with Kaalis references (payout id, vendor id) so reconciliation stays traceable.

### 3. AfriExchange → Kaalis webhooks

AfriExchange sends **signed** HTTP callbacks to Kaalis (e.g. payout lifecycle updates). Kaalis verifies signatures, updates **VendorPayout** state, and records **webhook health** for operators. The exact contract (headers, events, idempotency) is defined in `KAALIS_AFRIEXCHANGE_WEBHOOK_PAYLOAD_REFERENCE.md`.

### 4. User and vendor wallet linking

Kaalis UI directs users to the **AfriExchange web app** (URL from environment) to create or link accounts. That keeps wallet and KYC-style flows on AfriExchange while Kaalis stores the association needed for checkout and payout eligibility.

### 5. Kaalis admin: AfriExchange integration settings

Kaalis **Admin → Settings** includes an **AfriExchange** section: linked merchant id, web URL, callback URL, token strategy notes, rail toggles, secret **configured/missing** (not raw secrets), and last webhook context. This implements the “make the integration operable” goal from the merchant platform plan.

### 6. AfriExchange admin and merchant portal

On AfriExchange, operators use **admin** merchant views; the **Kaalis** merchant uses the **merchant portal** for day-to-day visibility (collections, balances, API & webhooks, sell-through-agent). `integration_health` on the merchant profile supports last-webhook style visibility for the AfriExchange side.

---

## How this was achieved (engineering summary)

1. **Stabilize** XOF routing in Kaalis so only the intended providers apply (NGN vs XOF).
2. **Implement** server-to-server calls from Kaalis to AfriExchange **integration** endpoints for **collections** and **payouts**.
3. **Implement** secure **webhook intake** on Kaalis with HMAC verification and idempotent processing.
4. **Align** environment configuration on both sides (API URL, integration key, webhook secret, linked merchant id).
5. **Surface** configuration and health in **Kaalis admin** and integration documentation for support and engineering.
6. **Iterate** with end-to-end testing (checkout, payout, webhooks, failures, duplicates) until the flow was production-trustworthy.

The phase-by-phase build narrative and status lives in [`KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md`](../../../KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md) at the workspace level (one directory above the `AfriExchange` folder).

---

## Reference documentation map

| Topic | Document |
|-------|-----------|
| Generic merchant integration (any ecommerce) | `MERCHANT_INTEGRATION_GUIDE.md` |
| Kaalis-specific env and flows | `KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md` |
| Webhook payloads and verification | `KAALIS_AFRIEXCHANGE_WEBHOOK_PAYLOAD_REFERENCE.md` |
| Operator procedures | `KAALIS_AFRIEXCHANGE_ADMIN_RUNBOOK.md` |
| Kaalis admin UI expectations | `KAALIS_AFRIEXCHANGE_INTEGRATION_SETTINGS_SPEC.md` |
| Merchant portal product direction | `KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md` |
| Token messaging | `TOKEN_STRATEGY_NOTE_CT_NT_USDT.md` |

---

## Bottom line

Kaalis and AfriExchange were integrated because **AfriExchange solved a concrete XOF gateway and settlement gap** that Kaalis could not fill with traditional providers alone. Kaalis continues to own **commerce**; AfriExchange owns **merchant settlement, wallets, and the token rails** for the integrated path. The result is a **reference marketplace integration**: complex enough to prove the model for other platforms considering AfriExchange Merchant.
