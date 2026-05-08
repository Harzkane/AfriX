# AfriExchange Merchant API & Webhooks Spec

## Purpose

This spec defines the `API & Webhooks` section for the AfriExchange merchant portal.

The goal is to make the merchant portal useful not only for daily operations, but also for integration setup and long-term self-service.

This page should help merchants and ecommerce partners understand:

- how their merchant account is identified
- how their systems connect technically
- how webhooks are configured
- which token and settlement model they are using

---

## Why this page matters

Right now, merchants can operate the portal, but technical integration knowledge is still too scattered.

A merchant or ecommerce team should not have to rely only on:

- env memory
- admin explanation
- private chat notes

to understand how the integration works.

This page should become the merchant-facing source of truth for:

- merchant id
- API key status
- webhook endpoint
- integration readiness
- token model

---

## Where it should live

Inside merchant portal navigation:

- `API & Webhooks`

Recommended side nav now becomes:

1. `Overview`
2. `Collections`
3. `Wallet Assets`
4. `Sell Through Agent`
5. `Settings`
6. `API & Webhooks`
7. `Integration Guide`

This is a better long-term merchant console shape than hiding everything inside general settings.

---

## Page goals

This page should let a merchant or partner team:

1. identify the merchant account used for integration
2. verify their webhook endpoint is configured
3. know whether API key access is active
4. understand the merchant token/settlement profile
5. see what events AfriExchange can send
6. understand how to begin technical integration

---

## Proposed page structure

## 1. Integration Overview

Top summary cards:

### Card: Merchant ID

Show:

- merchant id
- copy action

This is critical for partner/backend identification.

### Card: API Key Status

Show:

- `Configured`
- `Recently regenerated`
- `Needs attention`

Do not show the full key by default.

### Card: Webhook Status

Show:

- webhook URL configured or missing
- optional last delivery health later

### Card: Default Token

Show:

- default token
- allowed token set later

---

## 2. Merchant Identity

Show:

- merchant id
- business name
- display name
- verification status
- settlement wallet id
- default token
- merchant fee percent

This section connects the business identity to the technical integration identity.

---

## 3. API Credentials

### Show

- API key status
- last regenerated time if available later
- reveal/copy flow only after regeneration if product wants that

### Behavior

Do not permanently display secret values in plain text.

Recommended UX:

- show `API key active`
- allow `Regenerate API key`
- after regeneration, show temporary reveal/copy state

This matches the direction already started in:

- [merchant/settings/page.tsx](../../afrix-web/src/app/merchant/settings/page.tsx)

---

## 4. Webhook Configuration

This is the core merchant integration section.

### Fields

- webhook URL
- webhook status
- expected event types
- payload note
- delivery health later

### Merchant-facing guidance

Explain:

- AfriExchange sends server-to-server callbacks
- merchant backend should verify signatures/secrets
- webhook receiver should reconcile by reference and merchant id

### Event examples to document

- payment succeeded
- collection recorded
- merchant account linked / updated
- later: payout or settlement-related events if added

### Merchant UX recommendation

Show:

- current configured URL
- editable input
- save action
- test webhook action later

---

## 5. Token & Settlement Context

This is important because integration teams need to know what kind of merchant account they are wiring.

### Show

- default token
- settlement wallet id
- settlement note
- off-ramp note

### Example messaging

`This merchant currently settles with CT. Token choice affects settlement and liquidity behavior.`

For Kaalis-linked merchant today:

- `Default token: CT`
- `Settlement wallet: ...`

---

## 6. Event Reference

This section should list what the merchant backend can expect from AfriExchange.

Example entries:

### payment.pending

Meaning:

- merchant payment request was created and is awaiting completion

Recommended payload fields:

- event name
- merchant id
- transaction id
- reference
- amount
- token type
- status
- timestamp

### collection.completed

Meaning:

- merchant collection completed successfully and was settled to the merchant flow

### sandbox.ping

Meaning:

- test webhook fired from the merchant sandbox to validate delivery and signature verification

### webhook health events later

Only if needed operationally.

This does not need to be a full API docs replacement, but it should be enough for a developer to orient themselves.

---

## 7. Integration Readiness Checklist

This is a very helpful part of the page.

Show a checklist like:

- merchant verified
- settlement wallet present
- default token set
- webhook URL configured
- API key active
- merchant backend tested

This helps merchant teams know whether they are really ready to go live.

---

## 8. Link to Integration Guide

This page should not try to be the only documentation page.

It should link directly to:

- `Integration Guide`

That guide can hold:

- step-by-step onboarding
- request/response examples
- local testing notes
- production checklist

---

## Recommended backend data contract

Eventually expose something like:

`GET /api/v1/merchants/integration`

Suggested response:

```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "04b76353-6d94-419d-9b10-4e84161575c1",
      "business_name": "Kaalis Store",
      "display_name": "Kaalis",
      "verification_status": "approved",
      "settlement_wallet_id": "406f10b4-58c2-48c0-8a60-78bf81bf4e9e",
      "default_token_type": "CT",
      "payment_fee_percent": 2
    },
    "api": {
      "keyConfigured": true,
      "lastRegeneratedAt": null
    },
    "webhook": {
      "url": "https://merchant.example.com/api/afriexchange/webhooks",
      "configured": true,
      "lastDeliveryAt": null,
      "lastDeliveryStatus": null
    },
    "readiness": {
      "merchantVerified": true,
      "settlementWalletReady": true,
      "defaultTokenSet": true,
      "apiKeyActive": true,
      "webhookConfigured": true
    },
    "events": [
      "payment.pending",
      "collection.completed",
      "sandbox.ping"
    ]
  }
}
```

---

## UI recommendations

### Do not

- dump long raw technical content with no structure
- expose secret values permanently
- imply this page is only for Kaalis

### Do

- make merchant id copyable
- make webhook URL editable
- make readiness visible
- explain token choice briefly
- link to docs

---

## Relationship to current merchant settings

Today, [merchant/settings/page.tsx](../../afrix-web/src/app/merchant/settings/page.tsx) already contains:

- webhook URL
- API key regeneration
- business profile
- default token

That’s a good base, but the page is still mixing:

- business identity
- merchant operational settings
- integration setup

Recommended evolution:

### `Settings`

Keep:

- business profile
- default token
- address/contact

### `API & Webhooks`

Move or duplicate with better framing:

- API key status
- regenerate key
- webhook URL
- readiness checklist
- event list
- merchant id / settlement identity

---

## Recommended phases

### Phase 1

Build merchant `API & Webhooks` page with:

- merchant id
- webhook URL
- API key status
- settlement wallet id
- default token

### Phase 2

Add:

- event list
- readiness checklist
- better technical guidance

### Phase 3 [DONE]

Add:

- webhook delivery history (with payload and error viewing)
- test webhook action (Sandbox Ping)
- last successful callback status

---

## Outcome

When this page is done, a merchant or ecommerce engineering team should be able to answer:

- which merchant account are we integrating with?
- what token does this merchant use?
- where do we configure our webhook?
- is our API access active?
- are we ready to go live?

without depending entirely on admin support.
