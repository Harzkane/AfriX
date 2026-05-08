# Kaalis + AfriExchange Webhook Payload Reference

## Purpose

This document defines the webhook contract between AfriExchange and Kaalis for the current integration.

It is meant to help:

- backend engineers
- integration maintainers
- operators debugging payout sync issues

This is the practical payload reference for:

- webhook headers
- signature verification
- accepted events
- current payload shape
- status mapping behavior

Related docs:

- [KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md](./KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md)
- [KAALIS_AFRIEXCHANGE_ADMIN_RUNBOOK.md](./KAALIS_AFRIEXCHANGE_ADMIN_RUNBOOK.md)
- [MERCHANT_INTEGRATION_GUIDE.md](./MERCHANT_INTEGRATION_GUIDE.md)

---

## Current scope

Today, the most important webhook path is:

- AfriExchange -> Kaalis payout update webhook

This webhook is received by:

- [afriExchangeWebhookController.js](../../../kaalis-store/backend/controllers/afriExchangeWebhookController.js)

through route:

- [afriExchangeWebhookRoutes.js](../../../kaalis-store/backend/routes/afriExchangeWebhookRoutes.js)

with endpoint:

- `POST /api/afriexchange/webhooks`

Webhook emission is currently handled by:

- [kaalisIntegrationController.js](../../afriX_backend/src/controllers/kaalisIntegrationController.js)

---

## Important current reality

There is a useful distinction between:

### Events Kaalis can receive

Kaalis currently accepts these AfriExchange webhook events:

- `payout.processing`
- `payout.completed`
- `payout.failed`
- `payout.cancelled`
- `payout.canceled`

### Events AfriExchange currently emits in the visible Kaalis payout flow

In the current payout creation flow, AfriExchange explicitly emits:

- `payout.completed`

This is important because it means:

- the Kaalis receiver is ready for a broader event family
- but the current sender path we have in code clearly emits `payout.completed`

Future work may expand emit behavior, but this doc should stay honest about today’s code.

---

## Webhook destination

AfriExchange posts to the URL configured by:

- `KAALIS_AFRIEXCHANGE_WEBHOOK_URL`

This should point to the Kaalis webhook intake route.

Example local value:

- `http://localhost:7788/api/afriexchange/webhooks`

---

## Authentication and signature

### Secret source

AfriExchange signs webhook payloads using:

- `KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET`

Kaalis verifies the signature using:

- `AFRIEXCHANGE_WEBHOOK_SECRET`

Operational rule:

These two must match.

### Signature headers

AfriExchange sends:

- `x-afriexchange-timestamp`
- `x-afriexchange-signature`

### Signature format

AfriExchange signs:

```txt
{timestamp}.{rawJsonBody}
```

using:

- `HMAC-SHA256`

and sends header:

```txt
x-afriexchange-signature: sha256=<hex-digest>
```

### Verification behavior in Kaalis

Kaalis:

1. reads raw body
2. reads timestamp header
3. recomputes HMAC
4. compares via timing-safe comparison

If verification fails, Kaalis returns:

- `401`

with message like:

- `AfriExchange webhook secret is not configured`
- `Missing AfriExchange webhook signature`
- `Invalid AfriExchange webhook signature`

---

## Current payload envelope

Current webhook payload shape:

```json
{
  "event": "payout.completed",
  "eventId": "afriexchange-payout-<transactionId>-<status>",
  "data": {
    "kaalisPayoutId": "<kaalis-payout-id>",
    "kaalisVendorId": "<kaalis-vendor-id>",
    "payoutId": "<afriexchange-transaction-id>",
    "reference": "<afriexchange-reference>",
    "status": "completed",
    "amount": "123.45",
    "tokenType": "CT",
    "processedAt": "2026-05-03T10:00:00.000Z"
  }
}
```

Notes:

- `event` identifies the webhook event type
- `eventId` is used for idempotency tracking on the Kaalis side
- `data` contains the actual payout business payload

---

## Field reference

## Top-level fields

### `event`

Type:

- string

Examples:

- `payout.completed`
- `payout.processing`
- `payout.failed`

Used by Kaalis to decide whether the event is supported.

### `eventId`

Type:

- string

Purpose:

- idempotency and duplicate webhook suppression

Kaalis stores seen webhook ids inside payout metadata to avoid reprocessing the same event.

### `data`

Type:

- object

Contains the business payload Kaalis actually uses to update payout state.

---

## Data fields

### `data.kaalisPayoutId`

Type:

- string

Purpose:

- direct identifier of the Kaalis `VendorPayout` record if available

This is the most direct matching key.

### `data.kaalisVendorId`

Type:

- string

Purpose:

- vendor identity context from Kaalis side

Helpful for traceability, not the main update key.

### `data.payoutId`

Type:

- string

Purpose:

- AfriExchange-side payout transaction id

Kaalis may use this as fallback identity when matching or storing provider status context.

### `data.reference`

Type:

- string

Purpose:

- AfriExchange provider reference / payout reference

This is one of the main fallback match keys when `kaalisPayoutId` is absent or unusable.

### `data.status`

Type:

- string

Examples:

- `completed`
- `processing`
- `failed`
- `cancelled`

Kaalis maps this provider status to its internal payout status.

### `data.amount`

Type:

- string or number

Purpose:

- amount involved in the payout update

Useful for auditing and debugging.

### `data.tokenType`

Type:

- string

Example:

- `CT`

Purpose:

- token context for the payout

For the current Kaalis XOF path, this should usually be `CT`.

### `data.processedAt`

Type:

- ISO timestamp string

Purpose:

- when AfriExchange considers the payout processed

---

## Kaalis event acceptance behavior

Kaalis currently ignores any webhook event outside this allowlist:

- `payout.processing`
- `payout.completed`
- `payout.failed`
- `payout.cancelled`
- `payout.canceled`

If an unsupported event arrives, Kaalis responds successfully with an ignored result:

```json
{
  "success": true,
  "ignored": true,
  "message": "AfriExchange webhook event ignored"
}
```

This is intentional and helps keep the integration tolerant while the event surface evolves.

---

## Kaalis payout matching behavior

When Kaalis receives a webhook, it tries to find the target payout in this general order:

1. `kaalisPayoutId`
2. `reference`
3. `providerPayoutId`

More specifically, Kaalis uses values such as:

- `data.kaalisPayoutId`
- `data.reference`
- `data.transferReference`
- `data.providerPayoutId`
- `data.afriExchangePayoutId`

If Kaalis cannot find a payout, it returns:

- success false inside its internal result handling
- operationally marked for review

And the webhook endpoint may respond `202` with:

- `needsReview: true`

---

## Status mapping on Kaalis side

Kaalis maps provider status strings to internal payout status using `mapProviderPayoutStatus`.

### Provider -> Kaalis mappings

#### Processed

Provider values:

- `success`
- `successful`
- `completed`
- `complete`
- `processed`

Map to:

- `processed`

#### Failed

Provider values:

- `failed`
- `failure`
- `cancelled`
- `canceled`
- `reversed`

Map to:

- `failed`

#### Processing

Provider values:

- `processing`
- `in_progress`
- `pending_provider`
- `queued`

Map to:

- `processing`

#### Pending

Provider value:

- `pending`

Map to:

- `pending`

This mapping is important for operators because a provider status and a Kaalis internal status are not always literally identical.

---

## Duplicate event handling

Kaalis stores seen webhook event ids in payout metadata.

If the same `eventId` arrives again:

- Kaalis treats it as a duplicate
- no destructive duplicate update is applied

Expected duplicate response result:

```json
{
  "success": true,
  "duplicate": true,
  "payoutId": "<kaalis-payout-id>",
  "status": "<current-status>"
}
```

This is a key idempotency protection.

---

## Success response example

When a valid webhook updates a payout cleanly:

```json
{
  "success": true,
  "result": {
    "success": true,
    "payoutId": "<kaalis-payout-id>",
    "status": "processed",
    "providerStatus": "completed"
  }
}
```

---

## Needs-review response example

When signature is valid but Kaalis cannot match the payout cleanly:

```json
{
  "success": true,
  "needsReview": true,
  "message": "Matching Kaalis payout not found"
}
```

This is a signal for operators to investigate references, payout ids, and reconciliation paths.

---

## Failure response examples

### Missing secret

```json
{
  "success": false,
  "message": "AfriExchange webhook secret is not configured"
}
```

### Missing signature

```json
{
  "success": false,
  "message": "Missing AfriExchange webhook signature"
}
```

### Invalid signature

```json
{
  "success": false,
  "message": "Invalid AfriExchange webhook signature"
}
```

---

## Collection events: current note

The Kaalis integration controller currently creates merchant collections through:

- `createCollection`

That path returns a synchronous response to Kaalis but, in the current visible code, does **not** emit a separate Kaalis webhook event the way payout creation emits `payout.completed`.

This is important:

- payout webhook contract is concrete today
- collection webhook contract for Kaalis should be treated as future/expandable unless explicitly added

So operators should not assume a collection webhook exists just because payout webhooks do.

---

## Recommended future event family

Even though the payout webhook is the current core path, the long-term Kaalis/AfriExchange contract will likely be cleaner if it standardizes on event families like:

- `collection.completed`
- `collection.failed`
- `payout.processing`
- `payout.completed`
- `payout.failed`
- `merchant.updated`

This is not a statement that all of these are live today. It is a recommendation for future consistency.

---

## Operator checklist when webhooks misbehave

If Kaalis is not updating as expected:

1. confirm webhook URL is correct
2. confirm secret matches on both systems
3. confirm `event` is allowed by Kaalis
4. confirm payload contains at least one usable match key:
   - `kaalisPayoutId`
   - `reference`
   - `providerPayoutId`
5. confirm `eventId` is not a duplicate replay
6. inspect payout metadata for stored webhook history

---

## Bottom line

Today’s real webhook contract is centered on payout updates.

The most important practical truths are:

- Kaalis verifies signed AfriExchange callbacks
- Kaalis accepts a broader payout event family than the currently visible sender emits
- current payload matching relies on `kaalisPayoutId`, `reference`, and provider payout identifiers
- duplicate handling is built in
- collection webhook behavior should not be assumed unless explicitly implemented

That’s the webhook reality the team should operate against today.

