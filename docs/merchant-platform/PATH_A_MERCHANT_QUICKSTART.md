# Path A Merchant Quickstart

This guide explains how a **single-store ecommerce business** or **single merchant service platform** connects to **AfriExchange Path A**.

Path A is the standard merchant integration model:

- one AfriExchange merchant account
- one merchant settlement wallet
- one backend integration using a merchant API key
- webhook-based payment reconciliation

If you are building a **marketplace** with multiple vendors and platform-driven payouts, this is not your path. Use Path B planning instead.

---

## 1. What Path A is

Path A is for merchants that want to:

- create payment requests from their backend
- receive settlement into their AfriExchange merchant wallet
- reconcile successful collections using webhooks

The main backend contract is:

1. merchant gets approved on AfriExchange
2. merchant generates an API key
3. merchant backend creates payment requests
4. customer completes payment
5. AfriExchange marks the collection complete
6. AfriExchange sends a signed webhook to the merchant backend

---

## 2. What the merchant needs before integration

Before a merchant writes any backend code, they need:

- an AfriExchange user account
- a registered merchant profile
- merchant approval / verification
- a settlement wallet
- a default token, usually `CT` for the active Path A collection rail
- a webhook endpoint on their backend

The merchant should also know:

- their `merchant_id`
- the **AfriExchange API base URL**
- their merchant API key
- their **merchant webhook URL**

Important:

- The **AfriExchange API base URL** is the URL of the **AfriExchange backend** the merchant is calling.
- The **merchant webhook URL** is the URL of the **merchant's own backend** where AfriExchange will send signed event callbacks.

These are **not** the same URL.

---

## 3. Merchant onboarding flow

### Step 1: Create an AfriExchange user

The merchant owner creates a normal AfriExchange user account.

### Step 2: Register as a merchant

Use the merchant registration flow to create the merchant profile.

### Step 3: Complete verification

The merchant submits the required KYC / business information and waits for approval.

### Step 4: Confirm merchant readiness

After approval, the merchant should confirm in the merchant portal that:

- merchant status is approved
- settlement wallet exists
- default token is set
- API key can be generated
- webhook URL can be saved

---

## 4. Merchant portal pages that matter

Inside the merchant portal, the important Path A pages are:

- `API & Webhooks`
- `Integration Hub`
- `Collections`
- `Wallet Assets`
- `Sandbox`
- `Docs`

The merchant should use these pages to:

- copy the `merchant_id`
- generate or rotate the API key
- save the webhook URL
- inspect webhook delivery logs
- verify collections
- test webhook delivery

---

## 5. How the merchant backend authenticates

Path A merchant routes support **merchant API key auth**.

### The two URLs merchants must not confuse

For a Path A integration, there are always two different backend URLs:

1. **AfriExchange API URL**

This is the backend the merchant calls to create payment requests and read merchant data.

Example:

```text
https://your-afrix-backend.example.com/api/v1
```

Current AfriExchange hosted example:

```text
https://afrix-iqvq.onrender.com/api/v1
```

2. **Merchant Webhook URL**

This is the merchant's own backend endpoint that AfriExchange calls after payment events happen.

Example:

```text
https://merchant.example.com/webhooks/afriexchange
```

Testing example:

```text
https://webhook.site/4ebf89c6-d775-413a-95ef-cb6fc40a5cc4
```

Think about it this way:

- merchant backend -> calls -> **AfriExchange API URL**
- AfriExchange -> calls back -> **Merchant Webhook URL**

For the current pilot setup:

- **AfriExchange API URL**: `https://afrix-iqvq.onrender.com/api/v1`
- **Merchant Webhook URL**: `https://webhook.site/4ebf89c6-d775-413a-95ef-cb6fc40a5cc4`

The merchant backend can send any of these:

```http
Authorization: Bearer YOUR_MERCHANT_API_KEY
```

or

```http
x-merchant-api-key: YOUR_MERCHANT_API_KEY
```

or

```http
x-api-key: YOUR_MERCHANT_API_KEY
```

The recommended pattern is:

- use the merchant API key only on the merchant's backend
- never expose the API key in frontend browser code
- rotate keys carefully and update connected systems immediately

### Remote pilot prerequisites

If you are testing against the hosted AfriExchange backend instead of a local stack, use a dedicated deployed pilot merchant and a real deployed buyer login.

Recommended pilot configuration:

- `PATH_A_PILOT_API_URL=https://afrix-iqvq.onrender.com/api/v1`
- `PATH_A_PILOT_WEBHOOK_URL=https://webhook.site/...` or your real merchant webhook endpoint
- `PATH_A_PILOT_MERCHANT_API_KEY=<existing deployed merchant api key>`
- `PATH_A_PILOT_MERCHANT_ID=<existing deployed merchant id>`
- `PATH_A_PILOT_PAYER_EMAIL=<real deployed buyer account>`
- `PATH_A_PILOT_PAYER_PASSWORD=<real deployed buyer password>`

Supporting scripts for a dedicated pilot merchant:

- `npm run seed:path-a-pilot-merchant`
- `npm run reset:path-a-pilot-merchant-password`

Important:

- these scripts create or update a merchant in whichever database your current `.env` points to
- for a deployed Render pilot merchant, they must point at the deployed PostgreSQL database
- a remote pilot may take longer than a local one because Render health checks can be delayed by cold starts

---

## 6. Core backend flow

### Step 1: Create a payment request

The merchant backend creates a payment request when an order is ready for payment.

Endpoint:

```http
POST /api/v1/merchants/payment-request
```

Example:

```bash
curl -X POST "https://YOUR_AFRIEXCHANGE_API_BASE_URL/merchants/payment-request" \
  -H "Authorization: Bearer YOUR_MERCHANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150,
    "token_type": "CT",
    "description": "Order #10045",
    "customer_email": "buyer@example.com",
    "reference": "ORDER-10045"
  }'
```

Hosted example:

```bash
curl -X POST "https://afrix-iqvq.onrender.com/api/v1/merchants/payment-request" \
  -H "Authorization: Bearer YOUR_MERCHANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150,
    "token_type": "CT",
    "description": "Order #10045",
    "customer_email": "buyer@example.com",
    "reference": "ORDER-10045"
  }'
```

Expected response includes:

- `transaction_id`
- `payment_url`
- `qr_code`
- `amount`
- `token_type`
- `expires_at`

Important:

- `reference` should be unique per order
- `customer_email` should be a valid email address
- the backend should store the returned `transaction_id`
- this request is sent to the **AfriExchange API URL**, not to the merchant's own backend

### Step 2: Show the payment to the customer

Depending on the merchant experience, the merchant can use:

- the `payment_url`
- the `qr_code`
- internal checkout instructions based on the returned transaction

### Step 3: Wait for payment completion

When the customer successfully pays:

- the original pending collection request is completed
- the merchant settlement wallet is credited
- a `collection.completed` webhook is sent

---

## 7. Webhook setup

The merchant backend must expose a public HTTPS route that AfriExchange can call.

Example:

```text
https://merchant.example.com/webhooks/afriexchange
```

The merchant saves this URL in the merchant portal under `API & Webhooks`.

This webhook URL belongs to the **merchant's own system**.

Do **not** put the AfriExchange API URL here.

### Current live Path A webhook events

The merchant should build against these event names:

- `payment.pending`
- `collection.completed`
- `sandbox.ping`

### What the merchant backend should do

For every webhook:

1. verify the signature
2. parse the JSON payload
3. match the event to the merchant's stored `reference` and `transaction_id`
4. update order state idempotently
5. store webhook history for debugging

### Webhook headers

AfriExchange signs webhooks with:

- `x-afriexchange-timestamp`
- `x-afriexchange-signature`

Signature pattern:

- HMAC-SHA256
- signed value is `${timestamp}.${rawBody}`

### Node.js verification example

```js
const crypto = require("crypto");

function verifyAfriExchangeSignature({ rawBody, timestamp, signature, secret }) {
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

  return signature === expected;
}
```

---

## 8. What a successful webhook looks like operationally

When Path A is working correctly:

- merchant creates a payment request
- request appears as pending
- customer completes payment
- same request becomes completed
- settlement wallet balance increases
- `collection.completed` webhook is delivered
- webhook delivery log shows `delivered`

The merchant can confirm this from:

- `Collections`
- `Wallet Assets`
- `API & Webhooks`

---

## 9. Sandbox and local testing

For connectivity testing without real payment flow:

- use the `Sandbox` page in the merchant portal
- trigger `sandbox.ping`
- inspect delivery in your webhook receiver

This is useful to prove:

- your endpoint is reachable
- your signature verification works
- your webhook parsing works

But sandbox ping is **not enough** to prove full production readiness by itself.

The merchant should also test:

- payment request creation
- successful payment completion
- collection settlement visibility
- `collection.completed` reconciliation

---

## 10. Minimum production checklist for a merchant

Before a merchant goes live on Path A, confirm all of these:

- merchant is approved
- settlement wallet is active
- default token is correct
- merchant API key is generated and stored securely
- webhook URL is saved
- webhook signature verification works
- duplicate webhook handling is idempotent
- payment request creation works from the merchant backend
- completed collections appear in the portal
- webhook delivery log shows successful deliveries

---

## 11. Common mistakes to avoid

- Using the API key in frontend code instead of backend code
- Not storing the returned `transaction_id`
- Reusing the same `reference` for multiple orders
- Failing to verify webhook signatures
- Treating webhook delivery as exactly-once instead of at-least-once
- Assuming sandbox ping proves the whole payment lifecycle

---

## 12. Recommended merchant data to store locally

The merchant backend should store:

- `merchant_id`
- AfriExchange API base URL
- merchant API key
- webhook secret handling logic
- payment request `transaction_id`
- order `reference`
- final payment status
- received webhook event ids or transaction ids for idempotency

---

## 13. Example go-live sequence

Here is the simplest real-world Path A sequence:

1. Merchant registers and gets approved
2. Merchant generates API key in AfriExchange
3. Merchant saves webhook URL
4. Merchant tests `sandbox.ping`
5. Merchant backend creates a real payment request
6. Customer pays
7. Merchant receives `collection.completed`
8. Merchant marks order paid
9. Merchant confirms collection and balance in AfriExchange portal

---

## 14. Related docs

- `MERCHANT_PATH_A_STANDARD_INTEGRATION.md`
- `MERCHANT_INTEGRATION_GUIDE.md`
- `MERCHANT_GO_PUBLIC_PHASE_GATES.md`
- `AFRIEXCHANGE_MERCHANT_API_WEBHOOKS_SPEC.md`
- `AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md`

---

## Bottom line

If a merchant is a **single business** using **one merchant account** and wants **backend-to-backend API integration plus webhook reconciliation**, **Path A** is the correct AfriExchange integration model.

The merchant should think about Path A as:

- call AfriExchange API to create payment request
- wait for payment
- receive signed webhook on the merchant backend
- reconcile by `reference` and `transaction_id`
- confirm settlement in the merchant wallet
