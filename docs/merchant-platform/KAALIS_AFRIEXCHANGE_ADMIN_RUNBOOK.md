# Kaalis + AfriExchange Admin Runbook

## Purpose

This runbook is for internal operators and engineers who need to support, inspect, or troubleshoot the Kaalis <-> AfriExchange integration.

It is designed for practical day-to-day use, not just architecture review.

Use this when you need to:

- verify merchant linkage
- inspect payment / collection flow
- inspect vendor payout flow
- confirm webhook configuration
- reset merchant access
- trace failures across Kaalis and AfriExchange

Companion docs:

- [KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md](./KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md)
- [MERCHANT_INTEGRATION_GUIDE.md](./MERCHANT_INTEGRATION_GUIDE.md)
- [KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md](../../../KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md)

---

## The operating model in one view

### Kaalis owns

- storefront
- checkout orchestration
- orders
- sellers/vendors
- vendor payout records
- Kaalis admin payout release flow

### AfriExchange owns

- merchant identity
- merchant settlement wallet
- token balances and movement
- merchant collections
- wallet operations
- agent off-ramp flows

### Current live rail split

- `NGN` -> `Paystack` / `OPay`
- `XOF` -> `AfriExchange`

### Current live token reality

- `CT` is the practical active token for the Kaalis XOF path

---

## Key identifiers to know

### AfriExchange linked merchant

- merchant id:
  - `04b76353-6d94-419d-9b10-4e84161575c1`
- settlement wallet id:
  - `406f10b4-58c2-48c0-8a60-78bf81bf4e9e`

### Important current surfaces

#### Kaalis

- payout admin page:
  - `/admin/payouts`
- AfriExchange webhook intake:
  - [afriExchangeWebhookController.js](../../../kaalis-store/backend/controllers/afriExchangeWebhookController.js)
- webhook route:
  - [afriExchangeWebhookRoutes.js](../../../kaalis-store/backend/routes/afriExchangeWebhookRoutes.js)

#### AfriExchange

- merchant admin page:
  - `/merchants/[id]`
- merchant financial summary controller:
  - [adminMerchantController.js](../../afriX_backend/src/controllers/adminMerchantController.js)
- Kaalis integration controller:
  - [kaalisIntegrationController.js](../../afriX_backend/src/controllers/kaalisIntegrationController.js)

---

## Required config values

## AfriExchange backend env

Important values:

- `KAALIS_INTEGRATION_API_KEY`
- `KAALIS_AFRIEXCHANGE_MERCHANT_ID`
- `KAALIS_AFRIEXCHANGE_WEBHOOK_URL`
- `KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET`

Meaning:

- API trust from Kaalis -> AfriExchange
- linked merchant identity
- callback target into Kaalis
- callback signature secret

## Kaalis backend env

Important values:

- `AFRIEXCHANGE_API_URL`
- `AFRIEXCHANGE_KAALIS_API_KEY`
- `AFRIEXCHANGE_WEBHOOK_SECRET`

Meaning:

- target AfriExchange backend
- Kaalis integration credential
- webhook verification secret

## Kaalis frontend env

Important value:

- `VITE_AFRIEXCHANGE_WEB_URL`

Meaning:

- customer-facing AfriExchange web URL used by Kaalis frontend when needed

---

## Daily operator tasks

## 1. Confirm the linked merchant is healthy

Check in AfriExchange admin:

- `Merchant Partners`
- open the Kaalis merchant detail page

Look for:

- merchant id matches expected value
- settlement wallet id present
- financial summary loads successfully
- recent collections appear

If merchant financial summary fails:

- inspect [adminMerchantController.js](../../afriX_backend/src/controllers/adminMerchantController.js)
- check backend log for summary errors

---

## 2. Confirm Kaalis XOF payment routing is still correct

Use Kaalis checkout flow and verify:

- XOF path is routed to AfriExchange
- NGN path stays on Paystack / OPay

If routing looks wrong, inspect:

- Kaalis checkout/provider configuration
- current platform settings
- country/currency mapping logic

Operational symptom of wrong routing:

- XOF checkout showing NGN rails
- NGN checkout showing AfriExchange unexpectedly

---

## 3. Confirm merchant collections are appearing on AfriExchange

Check:

- AfriExchange merchant `Financials`
- merchant `Collections`

You want to verify:

- a Kaalis-origin collection row exists
- amount and token make sense
- settlement wallet is the linked Kaalis merchant wallet

If collections are missing:

1. confirm Kaalis is calling the correct AfriExchange API URL
2. confirm merchant id is the Kaalis linked merchant
3. confirm payment request / collection code path is using the right merchant context

---

## 4. Confirm Kaalis order state updated correctly

After successful AfriExchange collection:

- Kaalis should still own order status
- AfriExchange should not be the source of truth for Kaalis orders

Check:

- Kaalis order exists
- status advanced appropriately
- related payout record created where expected

If AfriExchange shows success but Kaalis order is wrong:

- inspect Kaalis callback handling
- inspect Kaalis reconciliation logic
- inspect webhook signature verification / event handling

---

## 5. Confirm vendor payout flow

Check in Kaalis:

- `/admin/payouts`

Look for:

- payout created
- payout scheduled / ready
- payout processed after admin release

Check in AfriExchange:

- related settlement side if the XOF/AfriExchange path is involved

If payout is stuck:

1. confirm payout record exists in Kaalis
2. confirm Kaalis can still reach AfriExchange payout endpoint
3. confirm webhook or reconciliation is not blocked by secret mismatch

---

## Merchant access operations

## Reset Kaalis merchant password

Use:

- [reset_kaalis_merchant_password.js](../../afriX_backend/src/scripts/reset_kaalis_merchant_password.js)

Command:

```bash
cd afriX_backend
npm run reset:kaalis-merchant-password
```

Use this when:

- merchant cannot log in
- password is unknown
- we want a stable known password from env

Related:

- [create_kaalis_merchant.js](../../afriX_backend/src/scripts/create_kaalis_merchant.js)
- package script:
  - `npm run seed:kaalis-merchant`

---

## Confirm merchant login path

Merchant login URL:

- `/merchant/login`

If merchant login fails:

1. confirm merchant user exists
2. confirm password was reset/seeded
3. confirm backend email validation accepts the current merchant email format
4. confirm merchant role is correct

---

## Webhook operations

## Expected direction

AfriExchange -> Kaalis callback path is critical for reconciliation.

Important files:

- [kaalisIntegrationController.js](../../afriX_backend/src/controllers/kaalisIntegrationController.js)
- [afriExchangeWebhookController.js](../../../kaalis-store/backend/controllers/afriExchangeWebhookController.js)

## If webhook delivery is failing

Check in this order:

1. `KAALIS_AFRIEXCHANGE_WEBHOOK_URL`
2. `KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET`
3. `AFRIEXCHANGE_WEBHOOK_SECRET`
4. Kaalis webhook route availability
5. signature validation failure logs

Common symptoms:

- AfriExchange says callback sent, but Kaalis state did not move
- Kaalis logs `Missing AfriExchange webhook signature`
- Kaalis logs `Invalid AfriExchange webhook signature`

If signature mismatch is suspected:

- compare the webhook secret values on both sides
- do not assume one side was updated if the other was not

---

## Local smoke test checklist

When working locally, verify:

### AfriExchange backend

- server up
- merchant id configured
- local Kaalis callback URL configured

### Kaalis backend

- points to local AfriExchange API URL
- API key matches AfriExchange integration key
- webhook secret matches AfriExchange

### Kaalis frontend

- points to the intended AfriExchange web URL

### Functional path

1. XOF checkout works
2. collection recorded on AfriExchange
3. Kaalis order updates
4. Kaalis payout record created
5. payout admin flow works

---

## Production smoke test checklist

After rotation or deployment changes:

1. confirm live API URL
2. confirm live merchant id
3. confirm live webhook callback URL
4. confirm secrets are configured on both sides
5. confirm one real or test XOF checkout completes
6. confirm merchant financial summary still works
7. confirm callback path updates Kaalis state
8. confirm payout processing path still works

---

## Troubleshooting map

## Symptom: Merchant financial summary fails

Check:

- merchant summary endpoint log
- merchant settlement wallet lookup
- transaction/merchant data shape

Likely surface:

- AfriExchange admin merchant page

## Symptom: XOF checkout succeeds nowhere

Check:

- rail routing
- AfriExchange API URL
- merchant id linkage
- integration API key

## Symptom: AfriExchange shows collection but Kaalis order is stale

Check:

- callback path
- webhook secret alignment
- Kaalis webhook controller handling

## Symptom: Payout stuck in processing

Check:

- Kaalis payout admin status
- AfriExchange payout response / reference
- reconciliation behavior
- webhook reconciliation result

## Symptom: Merchant cannot log in

Check:

- merchant user existence
- reset script
- current env-driven password
- role and validation path

---

## Recommended commands and scripts

### Reset Kaalis merchant password

```bash
cd afriX_backend
npm run reset:kaalis-merchant-password
```

### Seed or recreate Kaalis merchant

```bash
cd afriX_backend
npm run seed:kaalis-merchant
```

Use carefully:

- reseeding can be helpful in local/dev
- in shared or production-like environments, prefer verification before recreation

---

## What this runbook is not

This is not the public merchant integration guide.

This is the internal operating guide for the current Kaalis/AfriExchange connection.

It is allowed to be more operational, more concrete, and more environment-aware than public docs.

---

## Recommended next docs

After this runbook:

1. webhook payload reference
2. token strategy note (`CT`, `NT`, `USDT`)
3. incident checklist for merchant financial summary / webhook failures

---

## Bottom line

When operating this integration, remember:

- Kaalis owns commerce
- AfriExchange owns merchant wallet and collection mechanics
- `CT` is the current live Kaalis token path
- webhook health and merchant linkage are the two fastest places to look when things drift

This runbook exists so the team can support that reality consistently.

