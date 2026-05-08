# AfriExchange Merchant Integration Guide

## Who this guide is for

This guide is for:

- ecommerce platform teams
- merchant engineering teams
- technical merchants
- internal teams integrating platforms like Kaalis with AfriExchange

It explains how an external commerce platform can connect to AfriExchange Merchant Platform for:

- payment collections
- merchant wallet settlement
- webhook-based confirmation flows
- later merchant token operations

This guide is intentionally broader than Kaalis, but Kaalis is the reference proof that this model works.

---

## What AfriExchange Merchant Platform is

AfriExchange Merchant Platform is not just a payment form.

It is a merchant infrastructure layer that combines:

- merchant registration and verification
- payment request generation
- merchant transaction history
- settlement wallet ownership
- webhook-based payment updates
- merchant token operations
- optional agent-assisted off-ramp flow

In practical terms, it can help ecommerce businesses that:

- struggle with regional gateway coverage
- need better XOF support
- want token-based merchant settlement
- need a merchant wallet plus settlement model

---

## Current Kaalis lesson

Kaalis integrated with AfriExchange because XOF gateway coverage was difficult and unreliable for the exact use case we needed.

That produced a working pattern:

- Kaalis handles storefront and order experience
- AfriExchange handles merchant collection and settlement side
- Kaalis uses AfriExchange merchant identity and callbacks
- the linked merchant wallet becomes the settlement destination

Today the active Kaalis rail is effectively:

- `CT`

That is the practical live path today.

Future-ready design should still remain open to:

- `NT`
- `USDT`

---

## High-level integration model

There are two major stages:

### Stage 1: Merchant onboarding

Before technical integration, the merchant must exist and be approved inside AfriExchange.

### Stage 2: Platform integration

After approval, the ecommerce/backend platform connects technically using merchant identity, API credentials, and webhook configuration. 

**Choosing your path:** Merchants can review and select their integration path (Path A or Path B) in the **Integration Hub** within the merchant portal. Path A is the default active path for standard ecommerce integrations.

---

## Stage 1: Merchant onboarding

### Step 1: Create user account

The merchant owner begins as a normal AfriExchange user.

### Step 2: Register as merchant

Use:

- `POST /api/v1/merchants/register`

Merchant registration includes business details such as:

- business name
- display name
- business type
- email
- phone
- country
- city
- address
- default token

### Step 3: Merchant verification

The merchant completes KYC/compliance requirements and submits required business documents.

### Step 4: Admin approval

AfriExchange admin reviews the merchant and approves the account.

### Step 5: Merchant setup readiness

After approval, the merchant should have:

- merchant id
- settlement wallet id
- default token
- API key capability
- webhook URL field

---

## Stage 2: Platform integration

Once the merchant account is approved, the external ecommerce/backend platform can connect.

Core integration pieces:

- merchant id
- API key
- webhook secret or verification model
- webhook URL
- payment request flow
- reconciliation strategy

### Authentication model for Path A

Path A merchant routes now support **merchant API key authentication** for backend-to-backend ecommerce integrations.

Supported patterns:

- `Authorization: Bearer <MERCHANT_API_KEY>`
- `x-merchant-api-key: <MERCHANT_API_KEY>`
- `x-api-key: <MERCHANT_API_KEY>`

This is separate from the merchant portal login flow, which still uses the merchant user's normal JWT session.

---

## Core objects an ecommerce platform should understand

### Merchant ID

This identifies the merchant account inside AfriExchange.

Use it to:

- understand which merchant account is linked
- reconcile payments and merchant identity

### Settlement Wallet

This is the wallet where merchant collection settlement lands.

Important:

- settlement is token-based
- the token type matters operationally

### Default Token

This is the merchant’s primary token context.

Today common cases are:

- `CT`
- `NT`
- `USDT`

For Kaalis today:

- `CT` is the live practical default

### API Key

Used for merchant-side technical access and secure backend actions.

### Webhook URL

This is where AfriExchange sends server-to-server event updates.

---

## API Keys and Sandbox Testing

AfriExchange currently uses a **Single-Key Architecture** for merchant integrations.

Unlike some platforms that issue separate `test_keys` and `live_keys`, AfriExchange issues:
- One **Live API Key** per merchant.
- One **Live Webhook Secret** per merchant.

### How the Sandbox Works
To allow merchants to verify their integration safely without processing real money, the platform provides a **Sandbox Ping Webhook** endpoint (`/api/v1/merchants/sandbox/ping-webhook`).

When a merchant triggers a ping:
1. The system generates a simulated test event (`sandbox.ping`).
2. The event is signed using the merchant's **actual live Webhook Secret**.
3. The event is delivered to the configured Webhook URL.

This allows developers to securely prove that their endpoint can receive payloads and validate cryptographic signatures exactly as it will in production, without the complexity of managing parallel "Test Mode" databases and UI toggles.

> [!NOTE]
> **Roadmap:** A full Dual-Key system (separate `test_keys` and `live_keys` with a completely isolated test database, similar to Stripe or Paystack) is planned for **Version 2.0** as part of the advanced marketplace (Path B) maturity phase.

---

## Recommended integration flow

## 1. Merchant account is approved

Before writing commerce logic, confirm the merchant is:

- approved
- has a settlement wallet
- has a default token

## 2. Platform stores integration config

The external ecommerce platform should store:

- AfriExchange API base URL
- AfriExchange web URL if customer redirection is needed
- merchant id
- API key
- webhook secret
- webhook endpoint

Important distinction:

- **AfriExchange API base URL** = the AfriExchange backend the merchant calls
- **Webhook endpoint** = the merchant's own backend endpoint that AfriExchange calls back

These must not be confused during setup.

## 3. Platform creates merchant payment requests

When the ecommerce platform wants to initiate a merchant-side collection request, it should call the merchant payment request flow.

Use:

- `POST /api/v1/merchants/payment-request`

Typical payload:

```json
{
  "amount": 150,
  "currency": "CT",
  "description": "Order #10045",
  "customer_email": "buyer@example.com",
  "reference": "ORDER-10045"
}
```

Expected output includes:

- transaction id
- payment URL
- QR code
- amount
- token/currency
- expiry

This gives the ecommerce platform something concrete to present or track.

Example request headers:

```http
Authorization: Bearer YOUR_MERCHANT_API_KEY
Content-Type: application/json
```

## 4. Customer completes payment flow

Depending on the product path, this may involve:

- QR scan
- payment link
- app confirmation

## 5. AfriExchange records merchant collection

AfriExchange stores the collection transaction and settles it to the linked merchant wallet.

## 6. Webhook callback updates ecommerce platform

AfriExchange should notify the external platform using the configured webhook URL.

The ecommerce backend should:

- validate the callback
- reconcile by merchant id + reference + transaction id
- update order/payment state internally

---

## Recommended webhook model

This is one of the most important parts of the integration.

### Webhook responsibilities

The ecommerce platform webhook handler should:

1. verify authenticity
2. parse event payload
3. reconcile by reference
4. mark the linked order/payment state
5. log payloads for troubleshooting

### Troubleshooting & Logs

AfriExchange provides a **Webhook Delivery Log** in the merchant portal (API & Webhooks page). Merchants can use this to:
- View the exact JSON payload sent by AfriExchange.
- Inspect the HTTP status code returned by their server.
- Read error traces if the delivery failed (e.g., timeout, connection refused, or 500 error).

This self-service tool is designed to allow merchant developers to debug their integration independently.

### Minimum fields the receiving platform should care about

- event name
- merchant id
- transaction id
- reference
- amount
- token type
- status
- timestamp

### Current live Path A webhook events

The current public Path A webhook events merchants should build against are:

- `payment.pending`
- `collection.completed`
- `sandbox.ping`

These are the real event names emitted by the live merchant flow today.

### Good webhook design habits

- make processing idempotent
- treat duplicate deliveries as normal
- log failed deliveries
- do not trust reference alone without merchant/transaction context

---

## Reconciliation guidance

Every ecommerce platform integrating with AfriExchange should store:

- its own order reference
- AfriExchange transaction id
- merchant id
- amount
- token type
- webhook receipt status

This makes it much easier to answer:

- was the payment request created?
- was it paid?
- which merchant wallet received settlement?
- which order does this payment belong to?

### Exporting for Reconciliation

Merchants can download a detailed activity report from the **Collections** page via the **Export CSV** button. These exports:
- Include all transaction metadata (Reference, Hash, Fees, Status).
- Use robust CSV escaping compatible with Excel/Google Sheets.
- Serve as the primary source of truth for financial reconciliation against internal order databases.

---

## Token strategy guidance

### Do not assume all tokens behave the same

Token choice affects:

- settlement behavior
- merchant operating expectations
- off-ramp practicality
- liquidity considerations

### Today

For Kaalis, the live practical token is:

- `CT`

### Future

Merchant platform design should still remain open to:

- `NT`
- `USDT`

### Recommendation

An ecommerce platform integrating with AfriExchange should explicitly choose:

- default token
- allowed tokens

and document why.

---

## Kaalis as the reference integration

Kaalis is not just another merchant in spirit, even though it maps into the merchant model technically.

Kaalis is the current proof that:

- AfriExchange can solve a hard regional commerce problem
- merchant settlement through token rails can work
- a linked merchant identity and webhook model is operationally viable

That means other ecommerce platforms can follow a similar pattern:

- onboard as merchant
- configure integration values
- use payment request + webhook reconciliation
- operate through merchant dashboard after connection

---

## Merchant portal usage after connection

Once the merchant is connected, the merchant portal becomes the operational home.

Recommended merchant pages:

1. `Overview`
2. `Collections`
3. `Wallet Assets`
4. `Sell Through Agent`
5. `Settings`
6. `API & Webhooks`
7. `Integration Guide`

This means the integration guide supports onboarding, while the merchant portal supports ongoing operations.

---

## What belongs in env vs UI settings

### Keep in env

Secrets and environment-specific values:

- API base URL
- backend shared API key
- webhook secret

### Expose in UI

Operational integration values:

- merchant id
- webhook URL
- settlement wallet id
- default token
- rail availability
- integration status

This keeps operations easier without leaking secrets.

---

## Local testing checklist

Before going live, confirm:

- merchant account exists
- merchant is approved
- settlement wallet exists
- default token is correct
- webhook URL is configured
- API access is active
- payment request creation works
- webhook delivery reaches the ecommerce backend
- reconciliation updates the right order

For local environments, double-check:

- API URL points to the correct local backend
- frontend redirect/web URLs point to the correct local web apps
- webhook callback URLs are reachable from the sending side

---

## Go-live checklist

Before a merchant platform goes live with AfriExchange:

1. merchant verification approved
2. merchant id confirmed
3. settlement wallet confirmed
4. default token confirmed
5. API key active
6. webhook secret active
7. webhook URL reachable
8. test payment request successful
9. webhook reconciliation successful
10. operational owner assigned on both sides

---

## Common operational questions

### Where should a new ecommerce platform start?

Start with:

1. merchant onboarding
2. merchant approval
3. merchant settings / API & Webhooks
4. integration guide

### Should the merchant dashboard generate everything?

Not everything.

The merchant dashboard should expose the operational values the integration needs, but onboarding and documentation still matter.

### Can this model support more than Kaalis?

Yes.

That is the strategic direction this guide is preparing for.

---

## Recommended next docs

After this guide:

1. Kaalis-specific integration guide
2. internal admin runbook
3. webhook payload reference
4. token strategy note for `CT`, `NT`, and `USDT`

---

## Bottom line

AfriExchange Merchant Platform can be used by ecommerce businesses that need a merchant wallet, settlement, and collection layer beyond weak local gateway coverage.

Kaalis proved the model with `CT`.

This guide is the reusable starting point for the next merchant or ecommerce platform that wants to connect.
