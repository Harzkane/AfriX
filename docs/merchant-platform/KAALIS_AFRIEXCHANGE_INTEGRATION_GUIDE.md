# Kaalis + AfriExchange Integration Guide

## Purpose

This guide explains the specific Kaalis Store <-> AfriExchange integration.

It is the practical companion to:

- [MERCHANT_INTEGRATION_GUIDE.md](./MERCHANT_INTEGRATION_GUIDE.md)
- [KAALIS_AFRIEXCHANGE_INTEGRATION_SETTINGS_SPEC.md](./KAALIS_AFRIEXCHANGE_INTEGRATION_SETTINGS_SPEC.md)
- [KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md](../../../KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md)

This document is narrower than the generic merchant guide.

It answers:

- how Kaalis uses AfriExchange today
- which env/config values matter
- how Kaalis checkout and settlement interact with AfriExchange
- how to reason about the current live token strategy
- what local and production operators need to understand

---

## Why Kaalis integrated with AfriExchange

Kaalis integrated with AfriExchange because XOF payment gateway coverage was too difficult and unreliable for the Kaalis use case.

The integration gave Kaalis:

- a merchant collection path for XOF-oriented checkout
- a linked merchant wallet on AfriExchange
- a way to settle through the AfriExchange merchant/wallet model
- a future path for merchant token operations and off-ramp

This was not just an abstract product exercise.

It was a practical response to a real regional payment problem.

---

## Current live integration summary

The current Kaalis integration is:

- Kaalis as the commerce platform
- AfriExchange as the XOF merchant collection and settlement rail

### Active rail split today

- `NGN` -> `Paystack` / `OPay`
- `XOF` -> `AfriExchange`

### Current Kaalis token strategy

Today, Kaalis effectively uses:

- `CT`

That is the practical live token for the current XOF solution.

Future-ready direction:

- Kaalis may later support `NT`
- Kaalis may later support `USDT`

But today, the integration story should speak clearly about `CT` as the live operational rail.

---

## System roles

### Kaalis owns

- storefront and checkout experience
- marketplace users and vendors
- products
- orders
- vendor balances and payout records
- Kaalis admin settings and payout operations

### AfriExchange owns

- merchant identity on the AfriExchange side
- token wallets
- merchant collection settlement wallet
- token transfer mechanics
- merchant portal
- agent-assisted off-ramp flows
- wallet/escrow/dispute token logic

### Integration rule

Kaalis should talk to AfriExchange through:

- authenticated APIs
- signed webhooks

not direct database coupling.

---

## Current Kaalis merchant identity on AfriExchange

The linked merchant identity today is:

- merchant id:
  - `04b76353-6d94-419d-9b10-4e84161575c1`
- settlement wallet id:
  - `406f10b4-58c2-48c0-8a60-78bf81bf4e9e`

This merchant is the AfriExchange-side operational merchant for the Kaalis integration.

That means Kaalis is not just using a generic payment endpoint — it is using a dedicated merchant identity on AfriExchange.

---

## Integration configuration map

These are the important current values.

## AfriExchange backend

From AfriExchange backend env:

- `KAALIS_INTEGRATION_API_KEY`
- `KAALIS_AFRIEXCHANGE_MERCHANT_ID`
- `KAALIS_AFRIEXCHANGE_WEBHOOK_URL`
- `KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET`

Meaning:

- `KAALIS_INTEGRATION_API_KEY`
  - backend-to-backend shared trust from Kaalis into AfriExchange integration endpoints

- `KAALIS_AFRIEXCHANGE_MERCHANT_ID`
  - which AfriExchange merchant Kaalis collections belong to

- `KAALIS_AFRIEXCHANGE_WEBHOOK_URL`
  - where AfriExchange should call back into Kaalis

- `KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET`
  - shared webhook verification secret

## Kaalis backend

From Kaalis backend env:

- `AFRIEXCHANGE_API_URL`
- `AFRIEXCHANGE_KAALIS_API_KEY`
- `AFRIEXCHANGE_WEBHOOK_SECRET`

Meaning:

- `AFRIEXCHANGE_API_URL`
  - where Kaalis backend reaches AfriExchange API

- `AFRIEXCHANGE_KAALIS_API_KEY`
  - shared integration credential used by Kaalis when talking to AfriExchange

- `AFRIEXCHANGE_WEBHOOK_SECRET`
  - verifies callbacks from AfriExchange into Kaalis

## Kaalis frontend

From Kaalis frontend env:

- `VITE_AFRIEXCHANGE_WEB_URL`

Meaning:

- where Kaalis frontend sends users for AfriExchange web experiences such as linking or merchant-related flows

---

## How Kaalis uses AfriExchange functionally

## 1. User country / payment rail routing

Kaalis decides the active payment rail based on market/country context.

Today:

- Nigeria -> `NGN` -> `Paystack` / `OPay`
- XOF countries -> `XOF` -> `AfriExchange`

This means AfriExchange is the XOF-facing path, not the all-market path.

## 2. Merchant collection path

For the XOF path, Kaalis uses AfriExchange merchant collection mechanics rather than only relying on a traditional local gateway.

At a high level:

- Kaalis initiates collection against the linked AfriExchange merchant
- AfriExchange records merchant collection state
- funds settle into the merchant wallet model on AfriExchange

## 3. Kaalis order continuation

Kaalis still owns order lifecycle and marketplace business logic.

So after payment success:

- Kaalis updates order/payment state
- AfriExchange does not replace Kaalis order management

## 4. Vendor settlement path

Kaalis creates vendor payout records and uses its payout/admin model.

AfriExchange participates as the XOF settlement rail where relevant.

---

## Recommended flow picture

The practical current path is:

```txt
Kaalis XOF checkout
-> AfriExchange merchant collection
-> settlement into linked merchant wallet
-> Kaalis order/payment update
-> Kaalis payout management
-> AfriExchange-assisted settlement path where applicable
```

This keeps the roles clean:

- Kaalis = commerce and marketplace logic
- AfriExchange = XOF/token merchant settlement layer

---

## Customer-facing flow notes

### Kaalis frontend

Kaalis frontend should know:

- when AfriExchange is the correct rail
- which AfriExchange web URL to send the user to
- whether the user has linked AfriExchange context available

### AfriExchange web role

AfriExchange web is not the Kaalis storefront.

It is the wallet / merchant / linked operational surface that supports the XOF path.

---

## Webhook model

Kaalis and AfriExchange must remain aligned through signed callbacks.

### Kaalis needs to know

- what webhook URL AfriExchange is calling
- whether the secret is configured
- whether recent callbacks were successful

### AfriExchange needs to know

- which Kaalis callback target is active
- that callbacks are signed correctly

### Operational rule

When Kaalis and AfriExchange disagree about payment or merchant state, webhook health is one of the first things to inspect.

---

## Token strategy for Kaalis

## Today

Use and communicate clearly:

- `CT` is the live practical Kaalis token rail for the AfriExchange/XOF path

## Future

Kaalis may later adopt:

- `NT`
- `USDT`

But we should avoid pretending those are already active in the Kaalis integration when they are not yet the real operational path.

### Product recommendation

Kaalis settings should show:

- `Default AfriExchange token: CT`
- later:
  - allowed tokens
  - planned token expansion status

---

## What should be visible in Kaalis settings

This guide aligns with:

- [KAALIS_AFRIEXCHANGE_INTEGRATION_SETTINGS_SPEC.md](./KAALIS_AFRIEXCHANGE_INTEGRATION_SETTINGS_SPEC.md)

Kaalis admin should be able to see:

- AfriExchange API URL
- AfriExchange web URL
- linked merchant id
- webhook callback URL
- secret configured/missing states
- token strategy
- rail availability
- webhook health later

This is how we reduce env-only tribal knowledge.

---

## Local development checklist

When running locally, confirm:

### AfriExchange backend

- local API is up on the expected port
- Kaalis merchant id is present
- webhook target points to local Kaalis callback
- shared secret matches Kaalis backend

### Kaalis backend

- `AFRIEXCHANGE_API_URL` points to local AfriExchange backend
- `AFRIEXCHANGE_KAALIS_API_KEY` matches AfriExchange integration key
- `AFRIEXCHANGE_WEBHOOK_SECRET` matches AfriExchange webhook secret

### Kaalis frontend

- `VITE_AFRIEXCHANGE_WEB_URL` points to the intended AfriExchange web app

### Functional checks

- XOF checkout routes into AfriExchange path
- linked merchant is correct
- callbacks reach Kaalis
- Kaalis order state reconciles correctly

---

## Production checklist

Before treating the integration as fully stable in production:

1. confirm live AfriExchange API URL
2. confirm live AfriExchange web URL
3. confirm live linked merchant id
4. confirm live webhook callback URL
5. confirm shared secrets are real rotated secrets
6. confirm webhook signature validation works
7. confirm XOF checkout path succeeds end to end
8. confirm merchant financial visibility works
9. confirm admin payout/reconciliation path works

---

## Operational troubleshooting

When something looks wrong, check in this order:

### 1. Route selection

Was this transaction actually meant for AfriExchange or NGN rails?

### 2. Merchant linkage

Is the correct AfriExchange merchant id configured?

### 3. API connectivity

Is Kaalis calling the right AfriExchange API base URL?

### 4. Webhook delivery

Did AfriExchange callback reach Kaalis?

### 5. Secret mismatch

Do the two shared secrets still match on both sides?

### 6. Token expectation

Is the transaction being reasoned about as `CT` when that is still the real live Kaalis token?

---

## Relationship to the broader merchant platform

Kaalis is the first strong example of the broader AfriExchange Merchant Platform model:

- ecommerce platform has hard regional gateway problems
- AfriExchange becomes the merchant wallet and settlement layer
- external platform continues to own storefront/order logic

So this guide is Kaalis-specific, but it also acts as the reference implementation for future ecommerce integrations.

---

## Recommended next internal docs

After this guide:

1. internal admin runbook
2. webhook payload reference
3. token strategy note for `CT`, `NT`, `USDT`
4. production incident checklist for Kaalis <-> AfriExchange

---

## Bottom line

Kaalis uses AfriExchange today because it solved a real XOF payment/settlement problem that traditional gateway options did not solve well enough.

The current live integration should be communicated clearly as:

- `CT`-based operational path for Kaalis XOF flow
- merchant-linked, webhook-driven, backend-to-backend integration
- Kaalis still owns commerce
- AfriExchange owns merchant/token settlement mechanics

That clarity is what will make the integration easier to run and easier to extend later.

