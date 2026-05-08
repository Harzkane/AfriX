# Kaalis x AfriExchange Merchant Platform Plan

## Why this exists

Kaalis Store integrated with AfriExchange because XOF payment gateway coverage was painful and unreliable for our needs. That integration now works and solves a real operational problem for Kaalis, especially with `CT`.

This plan captures the next step:

- keep Kaalis stable
- make the integration easier to operate
- turn the same model into something other ecommerce platforms can adopt

This is not just an internal workaround anymore. It has the shape of a reusable merchant integration product.

---

## What we confirmed from the current AfriExchange docs

Based on:

- [readme.md](../../readme.md)
- [AfriToken Merchant Payment System.md](../../afriX_backend/docs/AfriToken%20Merchant%20Payment%20System.md)
- [MERCHANT ENDPOINTS TESTING GUIDE (Postman).md](../../afriX_backend/docs/MERCHANT%20ENDPOINTS%20TESTING%20GUIDE%20%28Postman%29.md)
- [Updated Real-World Flow (Mint + Burn with Escrow).md](../../afriX_backend/docs/Updated%20Real-World%20Flow%20%28Mint%20%2B%20Burn%20with%20Escrow%29.md)

### Current AfriExchange platform reality

AfriExchange already has the core pieces of a merchant platform:

- merchant registration and profile
- merchant payment request generation
- merchant transaction history
- settlement wallet model
- API key regeneration
- webhook support
- token flows with mint / burn / escrow / dispute handling
- agent-assisted token off-ramp path

### Current Kaalis reality

Kaalis currently uses AfriExchange mainly to solve XOF checkout/settlement constraints.

Today the live path is effectively:

- Kaalis order/payment flow
- AfriExchange merchant collection path
- settlement into the linked AfriExchange merchant wallet
- optional merchant off-ramp through agents

### Important token reality

Today:

- `CT` is the practical token rail for Kaalis

Future-ready:

- `NT` and `USDT` should remain first-class supported options
- Kaalis may introduce them later
- other ecommerce platforms may prefer different default tokens

So the merchant platform must be designed as:

- `CT-first in practice today`
- `multi-token by architecture`

---

## Product thesis

AfriExchange Merchant Platform can become:

> a merchant payment, settlement, wallet, and token-off-ramp layer for ecommerce businesses that struggle with local gateway coverage, cross-border settlement, or tokenized liquidity operations

Kaalis is the first real proof point.

That means the merchant product should not be framed only as:

- "Kaalis integration"

It should be framed as:

- merchant onboarding
- merchant collections
- merchant wallet assets
- merchant settlement
- merchant API/webhook integration
- merchant token liquidation through agents

---

## Product model

We should treat the system as four connected layers:

### 1. Merchant onboarding

How a business gets connected to AfriExchange:

- create user account
- register as merchant
- complete KYC / compliance
- get merchant approved
- receive merchant integration credentials

### 2. Merchant operations

How the merchant runs daily activity:

- overview
- collections
- wallet assets
- settings
- sell through agent

### 3. Integration setup

How an ecommerce/backend platform connects technically:

- merchant id
- API key
- webhook secret
- webhook URL
- payment request flow
- payment confirmation flow
- reconciliation and reference handling

### 4. Admin supervision

How AfriExchange admin manages the system:

- merchant review
- merchant financials
- collection oversight
- disputes
- escrow issues
- payout / wallet visibility

---

## Kaalis-specific conclusion

Kaalis already used a partner-style path rather than a generic self-serve merchant onboarding flow.

That was reasonable because:

- Kaalis is not just any merchant
- it is a platform integration partner
- the goal was to solve a difficult regional payments problem quickly

So Kaalis should now become:

- the reference integration
- not the only integration

---

## How a new ecommerce platform should connect

For another ecommerce platform, the recommended start point should be:

### Step 1: Merchant onboarding

- create merchant account
- complete merchant verification
- get approved

### Step 2: Integration setup

Merchant receives or configures:

- merchant id
- API key
- webhook secret
- webhook URL
- default token
- allowed token(s)

### Step 3: Technical integration

Merchant platform backend integrates with AfriExchange:

- create payment requests
- identify merchant by merchant id
- store references
- receive webhook callbacks
- reconcile successful collections

### Step 4: Merchant operations

Merchant uses AfriExchange merchant portal for:

- collection monitoring
- wallet monitoring
- settlement visibility
- agent off-ramp requests

---

## Recommended merchant portal information architecture

Use the merchant side menu as:

1. `Overview`
2. `Collections`
3. `Wallet Assets`
4. `Sell Through Agent`
5. `Settings`
6. `API & Webhooks`
7. `Integration Guide`

Optional later:

8. `Compliance`
9. `Disputes`

### Purpose of each page

#### Overview

- top-line merchant business picture
- collection volume
- pending items
- settlement identity
- quick links

#### Collections

- merchant payment activity
- transaction detail pages
- status filtering
- reference search

#### Wallet Assets

- token balances
- settlement wallet visibility
- wallet ids
- token mix

#### Sell Through Agent

- choose agent
- create sell request
- confirm receipt
- dispute if needed
- view request details

#### Settings

- merchant profile
- webhook URL
- default token
- API key regeneration

#### API & Webhooks

- merchant id
- API key status
- webhook URL
- webhook secret guidance
- event list
- sample payloads
- last webhook delivery status later

#### Integration Guide

- how to connect an external ecommerce platform
- required env/config values
- payment request flow
- webhook flow
- testing checklist

---

## Token strategy

### Today

For Kaalis:

- use `CT` as the live default settlement token

### Tomorrow

Support token-aware merchant configuration:

- default token
- allowed tokens
- settlement/off-ramp behavior by token

### Working assumptions

#### CT

- practical for current Kaalis XOF use case
- best current reference rail

#### NT

- future support for Nigeria-oriented merchants or additional platform expansion

#### USDT

- useful for merchants that want a more stable treasury/settlement option

### Important product rule

Do not present all tokens as operationally identical.

Docs and settings should make clear that token choice affects:

- settlement behavior
- liquidity path
- off-ramp practicality
- merchant operating model

---

## Settings strategy: env vs UI

This is one of the biggest simplifiers for future operations.

### Keep in env

Secrets and environment-specific machine configuration:

- AfriExchange API base URL
- backend shared API keys
- webhook secrets
- internal platform-to-platform secrets

Examples:

- `AFRIEXCHANGE_API_URL`
- `AFRIEXCHANGE_KAALIS_API_KEY`
- `AFRIEXCHANGE_WEBHOOK_SECRET`
- `KAALIS_INTEGRATION_API_KEY`
- `KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET`

### Move into settings UI / DB-backed config

Operational integration values that admins need to inspect or update:

- linked merchant id
- merchant display integration status
- AfriExchange web URL used by Kaalis frontend
- webhook target URL
- enabled payment rails
- default token / allowed token set
- last webhook status
- last sync / integration health

### Why this split helps

It reduces:

- env-only tribal knowledge
- redeploys for non-secret operational tweaks
- confusion during support/debugging

---

## Kaalis Platform Settings: recommended future section

Create a dedicated `AfriExchange Integration` section in Kaalis platform settings.

It should show:

- AfriExchange API base URL
- AfriExchange web URL
- linked AfriExchange merchant id
- webhook endpoint
- webhook health / last delivery status
- enabled rail(s)
- token strategy
- integration status badge

This page should not expose raw secrets, but it should expose the operational values that explain how Kaalis is wired.

---

## AfriExchange Merchant Settings: recommended future section

Create a dedicated `API & Webhooks` / `Integration` section in the merchant portal.

It should show:

- merchant id
- settlement wallet id
- default token
- allowed tokens
- merchant fee
- webhook URL
- API key status
- linked external platform name when relevant
- maybe `Connected from Kaalis Store` for Kaalis

This makes the merchant portal a real operating console instead of a passive dashboard.

---

## Documentation strategy

Yes, we should absolutely document this.

We need three document layers.

### 1. External merchant integration guide

Audience:

- ecommerce/platform engineers
- technical merchants

Content:

- what AfriExchange Merchant Platform is
- merchant onboarding flow
- required settings
- payment request flow
- collection lifecycle
- webhook flow
- token options
- testing checklist
- go-live checklist

### 2. Kaalis-specific integration guide

Audience:

- our internal Kaalis/AfriExchange team

Content:

- Kaalis -> AfriExchange payment initiation flow
- AfriExchange -> Kaalis webhook flow
- merchant id linkage
- frontend redirect/web URL usage
- shared secrets used internally
- local vs production config notes
- operational troubleshooting notes

### 3. Internal admin runbook

Audience:

- support/admin/ops team

Content:

- how to create or review a merchant
- how to verify a merchant
- where to inspect merchant financials
- how to inspect collections, disputes, escrows
- how to rotate secrets
- how to reset merchant credentials

---

## Delivery phases

## Phase 1: Stabilize and expose the current Kaalis integration

Goal:

- make the current Kaalis/AfriExchange connection visible and easy to operate

Work:

- Kaalis `AfriExchange Integration` settings section
- AfriExchange merchant `API & Webhooks` section
- readonly integration values surfaced in UI
- integration health/status visibility

## Phase 2: Documentation

Goal:

- stop relying on memory and env hunting

Work:

- external merchant integration guide
- Kaalis-specific integration guide
- internal admin runbook

## Phase 3: Merchant self-serve integration support

Goal:

- let non-Kaalis ecommerce platforms onboard more cleanly

Work:

- better onboarding copy
- API & webhook guide inside merchant portal
- token configuration guidance
- clearer payment rail selection model

## Phase 4: Broaden merchant platform capability

Goal:

- make AfriExchange Merchant Platform stronger than just collections

Work:

- webhook delivery logs
- integration health checks
- richer dispute/resolution history
- token-specific merchant policy controls
- exports and reconciliation tools

---

## Recommended next actions

### Immediate next steps

1. Design the Kaalis `AfriExchange Integration` settings section
2. Design the AfriExchange merchant `API & Webhooks` section
3. Draft the external `Merchant Integration Guide`

### After that

4. Draft the Kaalis-specific integration guide
5. Add token strategy guidance for `CT`, `NT`, and `USDT`
6. Add integration health/status visibility in both platforms

---

## Bottom line

Kaalis proved that this model works.

AfriExchange Merchant Platform should now be treated as:

- a merchant payment and settlement product
- a merchant wallet and token operations platform
- a reusable ecommerce integration layer

And the safest practical path is:

- keep CT live and stable for Kaalis
- remain multi-token by architecture
- expose operational integration settings in UI
- document the platform clearly so other ecommerce businesses can adopt it

