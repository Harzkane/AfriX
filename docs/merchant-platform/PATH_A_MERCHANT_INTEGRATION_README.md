# AfriExchange Path A Merchant Integration

Hosted merchant payments, signed webhook reconciliation, and buyer return flow for single-merchant platforms.

This README is the practical integration guide external merchants should follow when adding AfriExchange to their platform.

It is written from the final working Path A rollout, including the real issues solved during the PlugNG integration, so new merchants do not have to learn the hard way.

## Contents

- [What Path A Is](#what-path-a-is)
- [Who Should Use It](#who-should-use-it)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Integration Overview](#integration-overview)
- [Environment Variables](#environment-variables)
- [Backend Code Snippets](#backend-code-snippets)
- [Frontend Code Snippets](#frontend-code-snippets)
- [Create a Payment Request](#create-a-payment-request)
- [Buyer Checkout Flow](#buyer-checkout-flow)
- [Verify Webhooks](#verify-webhooks)
- [Order Reconciliation Rules](#order-reconciliation-rules)
- [Webhook Retry Behavior](#webhook-retry-behavior)
- [Operational Checklist](#operational-checklist)
- [Common Failure Modes](#common-failure-modes)
- [Testing](#testing)
- [Related Docs](#related-docs)

## What Path A Is

Path A is the standard AfriExchange merchant integration model:

- one merchant account
- one merchant settlement wallet
- one backend-to-backend API integration
- hosted buyer payment completion
- signed webhook reconciliation

In the current proven model:

1. your backend creates a payment request
2. AfriExchange returns a hosted `payment_url`
3. the buyer is redirected to AfriExchange
4. the buyer logs in and pays there
5. AfriExchange redirects the buyer back to your platform
6. AfriExchange sends a signed webhook to your backend
7. your backend marks the order paid

Important:

- buyer redirect return is not the same as payment confirmation
- the signed webhook is the authoritative settlement signal

## Who Should Use It

Use Path A if you are:

- a single-store ecommerce business
- a single-brand service platform
- a single-merchant checkout product
- a platform that reconciles to one AfriExchange merchant identity

Do not start with this guide if you are:

- a marketplace with multiple vendors
- a platform managing many merchant sub-accounts
- a payout-heavy partner platform

That is Path B territory.

## Requirements

Before you write integration code, make sure you already have:

- an AfriExchange user account
- a merchant profile
- merchant approval / verification
- a settlement wallet
- a default token
- a generated merchant API key
- a public HTTPS webhook endpoint

You should also know:

- `merchant_id`
- `merchant API key`
- `webhook URL`
- `webhook secret`
- `settlement wallet id`
- `default token`

## Quick Start

The shortest correct integration path is:

1. create and approve your AfriExchange merchant
2. generate a merchant API key
3. save your webhook URL in AfriExchange merchant portal
4. from your backend, create a merchant payment request
5. redirect the buyer to the returned `payment_url`
6. wait for signed `collection.completed`
7. mark the order paid only after webhook reconciliation

## Integration Overview

There are always two URLs involved:

### AfriExchange API Base URL

This is the backend your server calls.

Hosted example:

```text
https://afrix-iqvq.onrender.com/api/v1
```

### Your Merchant Webhook URL

This is your backend endpoint that AfriExchange calls back.

Example:

```text
https://merchant.example.com/api/v1/webhooks/afriexchange
```

Do not confuse them.

The direction is:

- your backend -> calls -> AfriExchange API
- AfriExchange -> calls -> your webhook URL

### Current Merchant Event Contract

Your webhook handler should currently build for:

- `payment.pending`
- `collection.completed`
- `sandbox.ping`

The event that should settle the order is:

- `collection.completed`

## Environment Variables

Typical merchant backend configuration:

```env
AFRIEXCHANGE_ENABLED=true
AFRIEXCHANGE_API_BASE_URL=https://afrix-iqvq.onrender.com/api/v1
AFRIEXCHANGE_MERCHANT_API_KEY=your_real_merchant_api_key
AFRIEXCHANGE_DEFAULT_TOKEN_TYPE=CT
AFRIEXCHANGE_WEBHOOK_SECRET=your_real_webhook_secret
AFRIEXCHANGE_RETURN_URL=https://merchant.example.com/checkout/success?provider=afriexchange
FRONTEND_URL=https://merchant.example.com
```

What they do:

| Variable | Purpose |
|----------|---------|
| `AFRIEXCHANGE_ENABLED` | Enables the AfriExchange payment rail in your backend |
| `AFRIEXCHANGE_API_BASE_URL` | AfriExchange backend base URL |
| `AFRIEXCHANGE_MERCHANT_API_KEY` | Merchant server-to-server credential |
| `AFRIEXCHANGE_DEFAULT_TOKEN_TYPE` | Token used for hosted checkout, commonly `CT` |
| `AFRIEXCHANGE_WEBHOOK_SECRET` | Shared secret for webhook signature verification |
| `AFRIEXCHANGE_RETURN_URL` | Buyer return URL after hosted payment |
| `FRONTEND_URL` | Fallback frontend base URL |

## Backend Code Snippets

These are the minimum backend surfaces most ecommerce merchants need.

### 1. Environment loader

```js
// config/afriexchange.js
module.exports = {
  enabled: process.env.AFRIEXCHANGE_ENABLED === 'true',
  baseUrl: process.env.AFRIEXCHANGE_API_BASE_URL,
  merchantApiKey: process.env.AFRIEXCHANGE_MERCHANT_API_KEY,
  defaultTokenType: process.env.AFRIEXCHANGE_DEFAULT_TOKEN_TYPE || 'CT',
  webhookSecret: process.env.AFRIEXCHANGE_WEBHOOK_SECRET,
  returnUrl:
    process.env.AFRIEXCHANGE_RETURN_URL ||
    `${process.env.FRONTEND_URL}/checkout/success?provider=afriexchange`,
};
```

### 2. Merchant API client

```js
// services/afriExchangeClient.js
const axios = require('axios');
const afx = require('../config/afriexchange');

const afriExchangeClient = axios.create({
  baseURL: afx.baseUrl,
  headers: {
    Authorization: `Bearer ${afx.merchantApiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

async function createPaymentRequest({
  amount,
  tokenType,
  description,
  customerEmail,
  reference,
  returnUrl,
}) {
  const response = await afriExchangeClient.post('/merchants/payment-request', {
    amount,
    token_type: tokenType || afx.defaultTokenType,
    description,
    customer_email: customerEmail,
    reference,
    return_url: returnUrl || afx.returnUrl,
  });

  return response.data?.data || response.data;
}

module.exports = {
  createPaymentRequest,
};
```

### 3. Checkout order creation route

```js
// routes/orders.js
const express = require('express');
const router = express.Router();
const { createPaymentRequest } = require('../services/afriExchangeClient');
const Order = require('../models/Order');

router.post('/checkout', async (req, res, next) => {
  try {
    const { email, items, total, currency } = req.body;

    const orderNumber = `ORD-${Date.now()}`;

    const order = await Order.create({
      orderNumber,
      email,
      items,
      total,
      currency,
      paymentMethod: 'afriexchange',
      paymentStatus: 'pending',
    });

    const payment = await createPaymentRequest({
      amount: total,
      tokenType: 'CT',
      description: `Order ${orderNumber}`,
      customerEmail: email,
      reference: orderNumber,
    });

    order.afriExchange = {
      transactionId: payment.transaction_id,
      reference: orderNumber,
      paymentUrl: payment.payment_url,
      tokenType: payment.token_type,
      amount: Number(payment.amount),
      status: 'payment.pending',
    };
    order.paymentReference = orderNumber;
    await order.save();

    res.status(201).json({
      success: true,
      orderId: order.id,
      reference: orderNumber,
      paymentUrl: payment.payment_url,
      provider: 'afriexchange',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 4. Webhook signature verification

```js
// services/verifyAfriExchangeSignature.js
const crypto = require('crypto');

function verifyAfriExchangeSignature({ rawBody, timestamp, signature, secret }) {
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

  return signature === expected;
}

module.exports = verifyAfriExchangeSignature;
```

### 5. Raw-body webhook route

```js
// app.js
const express = require('express');
const app = express();
const afriExchangeWebhookRouter = require('./routes/afriExchangeWebhook');

app.use(
  '/api/v1/webhooks/afriexchange',
  express.raw({ type: 'application/json', limit: '1mb' }),
  afriExchangeWebhookRouter
);

app.use(express.json());

module.exports = app;
```

### 6. Webhook controller

```js
// routes/afriExchangeWebhook.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const verifyAfriExchangeSignature = require('../services/verifyAfriExchangeSignature');

router.post('/', async (req, res, next) => {
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body || {});

    const timestamp = req.headers['x-afriexchange-timestamp'];
    const signature = req.headers['x-afriexchange-signature'];

    const isValid = verifyAfriExchangeSignature({
      rawBody,
      timestamp,
      signature,
      secret: process.env.AFRIEXCHANGE_WEBHOOK_SECRET,
    });

    if (!isValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid AfriExchange webhook signature',
      });
    }

    const payload = JSON.parse(rawBody || '{}');
    const eventType = payload?.event;
    const data = payload?.data || {};
    const reference = data.reference;
    const transactionId = data.transaction_id;

    const order = await Order.findOne({
      $or: [
        { orderNumber: reference },
        { paymentReference: reference },
        { 'afriExchange.reference': reference },
        { 'afriExchange.transactionId': String(transactionId) },
      ],
    });

    if (!order) {
      return res.status(200).json({
        status: 'ignored',
        message: 'No matching order found',
      });
    }

    order.afriExchange = {
      ...(order.afriExchange || {}),
      transactionId: String(transactionId),
      reference,
      status: eventType,
      lastWebhookEvent: eventType,
      lastWebhookAt: new Date(),
      verifiedAt:
        eventType === 'collection.completed' ? new Date() : order.afriExchange?.verifiedAt,
    };

    if (eventType === 'collection.completed' && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
    }

    await order.save({ validateBeforeSave: false });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 7. Resume pending payment

```js
// routes/orders.js
router.post('/:id/afriexchange/retry', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || order.paymentMethod !== 'afriexchange') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    const payment = await createPaymentRequest({
      amount: order.afriExchange?.amount || order.total,
      tokenType: order.afriExchange?.tokenType || 'CT',
      description: `Order ${order.orderNumber}`,
      customerEmail: order.email,
      reference: order.orderNumber,
    });

    order.afriExchange = {
      ...(order.afriExchange || {}),
      transactionId: payment.transaction_id,
      paymentUrl: payment.payment_url,
      status: 'payment.pending',
    };

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      paymentUrl: payment.payment_url,
      provider: 'afriexchange',
    });
  } catch (error) {
    next(error);
  }
});
```

## Frontend Code Snippets

These are the minimum frontend surfaces most ecommerce merchants need.

### 1. Checkout payment selection

```tsx
const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'afriexchange'>('card');

const isAfriExchangeEnabled = process.env.NEXT_PUBLIC_AFRIEXCHANGE_ENABLED === 'true';

{isAfriExchangeEnabled && (
  <button
    type="button"
    onClick={() => setPaymentMethod('afriexchange')}
  >
    Pay with AfriExchange
  </button>
)}
```

### 2. Checkout submit and redirect

```tsx
async function handleCheckout() {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      items,
      total,
      paymentMethod: 'afriexchange',
    }),
  });

  const data = await response.json();

  if (data.provider === 'afriexchange' && data.paymentUrl) {
    window.location.href = data.paymentUrl;
    return;
  }
}
```

### 3. Success page waiting for webhook confirmation

```tsx
async function verifyOrder(reference: string) {
  const response = await fetch(`/api/orders/verify?reference=${reference}`);
  const data = await response.json();

  if (data.status === 'success') {
    return { done: true, paid: true };
  }

  if (data.status === 'pending') {
    return { done: false, paid: false };
  }

  return { done: true, paid: false };
}

async function pollUntilPaid(reference: string) {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await verifyOrder(reference);

    if (result.done && result.paid) {
      return true;
    }

    if (result.done && !result.paid) {
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return false;
}
```

### 4. Pending-order resume button

```tsx
async function continuePayment(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}/afriexchange/retry`, {
    method: 'POST',
  });

  const data = await response.json();

  if (data.success && data.paymentUrl) {
    window.location.href = data.paymentUrl;
  }
}
```

## Create a Payment Request

Your backend creates a merchant payment request when an order is ready for payment.

Endpoint:

```http
POST /api/v1/merchants/payment-request
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
    "reference": "ORDER-10045",
    "return_url": "https://merchant.example.com/checkout/success?provider=afriexchange"
  }'
```

Expected response fields include:

- `transaction_id`
- `payment_url`
- `qr_code`
- `amount`
- `token_type`
- `reference`
- `expires_at`

Store at least:

- your own `reference`
- AfriExchange `transaction_id`
- AfriExchange `payment_url`
- token type
- amount
- provider status

Important:

- `reference` should be unique per order
- `return_url` must be a valid absolute `http` or `https` URL
- do not create different orders with the same `reference`

## Buyer Checkout Flow

In the current hosted buyer model:

1. buyer starts checkout on your platform
2. buyer chooses AfriExchange
3. your backend creates a payment request
4. your frontend redirects buyer to returned `payment_url`
5. buyer lands on AfriExchange hosted page `/pay/:transactionId`
6. buyer logs in with a normal AfriExchange user account
7. buyer pays from wallet balance
8. AfriExchange redirects buyer back to your `return_url`
9. AfriExchange sends signed webhook to your backend
10. your backend reconciles the order

Important:

- the buyer is not an admin
- the buyer is not a merchant
- the buyer uses a normal AfriExchange user account
- Path A does not require wallet pre-linking the way Kaalis does

## Verify Webhooks

AfriExchange signs merchant webhooks with:

- `x-afriexchange-timestamp`
- `x-afriexchange-signature`

Signature format:

```text
sha256=<hex>
```

Signed value formula:

```text
HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
```

Node.js example:

```js
const crypto = require('crypto');

function verifyAfriExchangeSignature({ rawBody, timestamp, signature, secret }) {
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

  return signature === expected;
}
```

If the secret is wrong, reject the webhook.

Typical failure:

- `401 Invalid AfriExchange webhook signature`

## Order Reconciliation Rules

Your webhook handler should:

1. read the raw request body
2. verify signature
3. parse payload
4. identify event type
5. match order by `reference` and/or `transaction_id`
6. update order state idempotently
7. return `200`

For `collection.completed`, your backend should:

- mark the order paid
- persist provider confirmation metadata
- ensure duplicate deliveries do not double-settle
- make stock deduction idempotent

Best practice:

- save the payment state first
- treat stock, loyalty, notifications, and other secondary side effects as best-effort follow-up work
- do not let a secondary failure keep a real paid order stuck in `pending`

### Redirect Return vs Webhook Confirmation

These are separate states:

#### Redirect Return

This means:

- the buyer completed the hosted UI flow
- AfriExchange sent the buyer back to your success page

This does **not** mean the order should automatically be marked paid.

#### Webhook Confirmation

This means:

- AfriExchange has sent the signed settlement event
- your backend verified and reconciled it

This is what should mark the order paid.

If you blur these two states, you will create false positives, stuck pending orders, and difficult support cases.

### Recommended Stored Order Metadata

Store an AfriExchange block with fields like:

- `transactionId`
- `reference`
- `paymentUrl`
- `tokenType`
- `amount`
- `status`
- `lastWebhookEvent`
- `lastWebhookAt`
- `verifiedAt`
- `webhookEvents[]`

Optional but useful:

- quoted source currency
- quoted settlement currency
- exchange rate used

### Pending Orders And Resume Behavior

A good production implementation should support pending-payment resume behavior:

- show pending AfriExchange orders in order history
- let buyers click `Continue Payment`
- reuse the stored `payment_url` if still valid
- optionally refresh or regenerate a new hosted payment request if needed

This is no longer optional polish in practice. Real buyers do interrupt payment sessions.

## Webhook Retry Behavior

Current Path A behavior is:

- AfriExchange makes one delivery attempt per emitted merchant webhook event
- the delivery attempt uses an HTTP timeout of about 8 seconds
- if the merchant endpoint responds successfully, the event is recorded as `delivered`
- if the merchant endpoint fails, times out, or returns a non-2xx response, the event is recorded as `failed`

Important:

- there is currently **no automatic retry loop** for Path A merchant webhook delivery in the live dispatcher
- a failed delivery is written to the merchant webhook delivery log for manual review and operator debugging
- merchants should build their own recovery posture assuming webhook delivery is not yet retried automatically by AfriExchange

What this means operationally:

- if your webhook endpoint is temporarily down, you may miss the real-time settlement callback
- your order may remain `pending` until you manually inspect and reconcile it
- you should monitor your webhook endpoint and merchant delivery logs closely

Recommended merchant-side safety measures:

- keep a searchable mapping of `reference` -> `transaction_id`
- support pending-order resume behavior in your product
- give operators a way to manually inspect pending AfriExchange orders
- design reconciliation to be safely re-runnable if you later add manual replay or recovery tooling

This behavior may evolve later, but merchants should integrate against the current live reality:

- one signed delivery attempt
- recorded success or failure
- manual review after failure

## Operational Checklist

Before go-live, confirm all of these:

- merchant is approved
- settlement wallet is active
- default token is correct
- API key is stored securely
- webhook URL is saved in merchant portal
- webhook secret matches your backend config exactly
- payment request creation works
- hosted buyer payment page opens correctly
- buyer can log in and pay
- buyer returns to your success page
- signed webhook reaches your backend
- `collection.completed` marks order paid
- duplicate deliveries do not double-settle
- pending orders can be resumed safely

## Common Failure Modes

### AfriExchange payment method does not appear

Check:

- frontend feature flag
- market / country gating
- whether checkout is still restricted to another rail

### Payment request creation fails

Check:

- API base URL
- merchant API key
- merchant approval status
- request payload shape
- `return_url` validity

### Buyer completes payment but your success page still says pending

Check:

- whether AfriExchange delivered `collection.completed`
- whether your webhook returned `200`
- whether signature verification passed
- whether reconciliation crashed during order update

### Buyer is redirected back but order is not paid

Most likely cause:

- redirect return worked
- webhook reconciliation failed

Remember:

- return is UI state
- webhook is settlement state

### Sandbox ping works but real payments fail

That usually means:

- signature verification works
- but the real `collection.completed` path is failing in your order-update code

### Repeated retries create strange behavior

Check:

- whether you are reusing `reference` safely
- whether your webhook handling is idempotent
- whether you support hosted link reuse or refresh for pending orders

## Testing

Recommended merchant testing order:

1. finish merchant onboarding and approval
2. generate API key
3. save webhook URL
4. wire backend env vars
5. create payment requests successfully
6. verify hosted redirect works
7. verify buyer login and payment works
8. verify redirect return works
9. verify signed webhook reaches backend
10. verify `collection.completed` marks order paid
11. verify pending order resume behavior
12. verify sandbox ping separately

Important:

- sandbox ping proves connectivity and signature handling
- it does not prove full payment lifecycle readiness

## Related Docs

- [README.md](./README.md)
- [PATH_A_MERCHANT_QUICKSTART.md](./PATH_A_MERCHANT_QUICKSTART.md)
- [MERCHANT_PATH_A_STANDARD_INTEGRATION.md](./MERCHANT_PATH_A_STANDARD_INTEGRATION.md)
- [MERCHANT_INTEGRATION_GUIDE.md](./MERCHANT_INTEGRATION_GUIDE.md)
- [MERCHANT_GO_PUBLIC_PHASE_GATES.md](./MERCHANT_GO_PUBLIC_PHASE_GATES.md)
- [AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md](./AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md)

## Bottom Line

The safest production Path A posture is:

- hosted buyer payment page
- signed webhook settlement
- idempotent order reconciliation
- buyer return support
- pending-order resume support

If merchants follow this README exactly, they should avoid the most painful rollout traps:

- wrong URLs
- wrong webhook secret
- malformed `return_url`
- marking orders paid on redirect instead of webhook
- stuck pending orders
- no resume flow for interrupted payments
