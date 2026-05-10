# Path A — Standard Merchant Integration

## What Path A is

**Path A** is the **default** AfriExchange Merchant integration: **one AfriExchange merchant account** per commercial entity (single storefront, single brand, or any backend that reconciles to **one** merchant id).

Your ecommerce or service backend talks to AfriExchange using the **public merchant REST APIs** (`/api/v1/merchants/...` and related payment flows documented elsewhere). You **do not** use the Kaalis-only integration routes under `/api/v1/integrations/kaalis/`.

---

## Who Path A is for

- **Single-vendor ecommerce** (no marketplace vendors).
- **SaaS or apps** that collect payments into one merchant settlement wallet.
- **Pilot merchants** validating AfriExchange before a deeper partnership.

If you run a **multi-vendor marketplace** with platform-initiated payouts and external order/payout identifiers, see **`MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md`**.

---

## What AfriExchange provides on Path A

- **Merchant onboarding**: user account → merchant registration → verification/KYC → **admin approval**.
- **Merchant APIs**: profile, payment requests, transaction history, dashboard summary, **API key** rotation, **webhook URL** on profile/settings.
- **Settlement**: collections settle into the merchant’s **settlement wallet** (token-aware; see token strategy note).
- **Merchant portal** (`afrix-web` `/merchant`): Overview, Collections, Wallet Assets, Sell Through Agent, Settings, API & Webhooks, Integration Hub, Docs.
- **Optional liquidity**: sell-through-agent (burn/off-ramp style flows) when merchants need fiat or liquidity paths supported by the platform.

---

## Implementation overview

### 1. Merchant exists and is approved

Complete onboarding inside AfriExchange until admin marks the merchant **verified/approved** and a **settlement wallet** and **default token** are coherent for your use case.

### 2. Store integration configuration (your backend)

Persist securely:

- AfriExchange **API base URL** (environment-specific).
- **Merchant API key** (from regeneration flow; treat as a secret).
- **Webhook URL** (your HTTPS endpoint).
- **Webhook verification** approach (shared secret or signing model as documented for your integration tier).

Important distinction:

- AfriExchange **API base URL** is the AfriExchange backend the merchant backend calls.
- Merchant **Webhook URL** is the merchant backend endpoint that AfriExchange calls back.

These are two different URLs and should never be configured interchangeably.

Operational fields you reconcile against AfriExchange:

- **Merchant id**
- **Settlement wallet id** (reference and debugging)
- **Default token** (`CT`, `NT`, `USDT`, etc. — align with `TOKEN_STRATEGY_NOTE_CT_NT_USDT.md`)

### 3. Create payment requests when checkout requires payment

Use the authenticated merchant flow for creating payment requests (see **`MERCHANT_INTEGRATION_GUIDE.md`** for endpoints and payload shapes).

Your platform receives identifiers (transaction id, payment URL / QR context as applicable) and your own **reference** (order id) for reconciliation.

### 4. Customer completes payment

Depends on your UX: payment link, QR, deep link, or redirect into an AfriExchange-hosted payment experience-whatever your product uses.

Important:

- a hosted redirect checkout remains a valid standard Path A implementation
- merchants do not need to copy the tighter Kaalis-style linked-wallet UX in order to be considered a correct Path A merchant

### 5. Reconcile with webhooks

Your webhook receiver:

1. Verifies authenticity.
2. Parses event payload.
3. Matches **reference**, **merchant id**, **transaction id**, amount, token, status.
4. Updates order/payment state **idempotently** (duplicate deliveries are normal).

Full checklist and field guidance: **`MERCHANT_INTEGRATION_GUIDE.md`**.

---

## Path A — phases to reach “public ready”

These align with **`AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md`** and **`MERCHANT_GO_PUBLIC_PHASE_GATES.md`**.

| Phase | Status | Goal |
|-------|--------|------|
| **Foundation** | [DONE] | Merchant onboarding + APIs + portal documented and verified against live behavior (`MERCHANT_INTEGRATION_GUIDE.md`). Path A merchant routes now support merchant API key auth for backend-to-backend use. |
| **Pilot** | [DEPLOYED PILOT PASSED] | A repeatable non-Kaalis Path A pilot now exists and has passed both local and deployed/prod-like verification via `npm run pilot:path-a` and hosted remote mode (merchant API key auth → payment request → completion of the same request → settlement visibility → webhook reconciliation). |
| **Portal credibility** | [DONE] | Merchant portal surfaces integration readiness (API & Webhooks, health signals where implemented). |
| **Trust** | [DONE] | Error catalog, sandbox guidance, rate-limit notes, auth guidance, and public event naming are aligned for external production use. |
| **Observability** | [DONE] | Webhook delivery logs with payload viewing and error traces live in the portal. |

Path A **does not require** implementing **`/integrations/kaalis/*`** or marketplace payout APIs.

**Note on Sandbox Testing:** Path A uses a **Single-Key Architecture**. There is no separate "Test Mode" database. Instead, developers verify their integrations using the `sandbox.ping` webhook event, which is securely signed using their actual live production keys. This reduces platform complexity while still allowing merchants to verify connectivity before going live. A full **Dual-Key (Test/Live) system is planned for Version 2.0** as part of the advanced marketplace maturity phase.

---

## Go / no-go highlights for Path A public launch

Use **`MERCHANT_GO_PUBLIC_PHASE_GATES.md`** for the full checklist. Minimum expectations:

- Approved merchant model works reliably.
- Webhook verification and idempotent processing are proven in a real non-Kaalis checkout flow.
- Support path documented for common failures (wrong API URL, bad signature, duplicate events).

## What is still required before Path A can be called production-ready

1. **Authentication contract must be made true**

Today the docs describe Path A as a backend-to-backend merchant API key integration, but the live merchant routes currently authenticate with a logged-in user JWT. Before production launch, choose one clear contract:

- implement merchant API key auth on the Path A merchant routes, or
- explicitly redefine Path A docs to say the current flow is user-JWT-driven and not yet a pure server-to-server merchant API.

For external ecommerce adoption, the recommended direction remains **merchant API key auth**.

2. **Webhook event contract must be normalized**

The real Path A code currently emits:

- `payment.pending`
- `collection.completed`
- `sandbox.ping`

3. **Non-Kaalis end-to-end pilot must be completed**

Before marking Path A fully production-ready, one single-merchant ecommerce flow should succeed in a staging or production-like environment with all of the following:

- merchant onboarding and approval
- API credential issuance
- payment request creation
- customer payment completion
- collection visible in merchant portal
- settlement visible in the merchant wallet context
- webhook received and reconciled idempotently on the merchant backend

As of **2026-05-10**, the team now have a **repeatable local and deployed pilot verifier**:

- `cd afriX_backend`
- `npm run pilot:path-a`

That command proves the live local stack can:

- authenticate merchant routes with the merchant API key
- create a pending payment request
- complete that same request through the payment flow
- update collection status to `completed`
- deliver and log `collection.completed` webhook events

This requirement is now satisfied in deployed/prod-like testing as well:

- a dedicated deployed merchant and payer flow has been proven against hosted infrastructure
- webhook delivery and signature verification were validated against an external merchant backend
- PlugNG is the current single-merchant external reference for this style of Path A adoption

For **deployed / Render pilot testing**, the verifier now supports a dedicated remote mode:

- uses an existing deployed merchant API key instead of local-only DB seeding
- uses a real deployed payer login
- updates the merchant webhook URL through the merchant API for the duration of the test

Recommended remote pilot inputs:

- `PATH_A_PILOT_API_URL`
- `PATH_A_PILOT_WEBHOOK_URL`
- `PATH_A_PILOT_MERCHANT_API_KEY`
- `PATH_A_PILOT_MERCHANT_ID` optional but recommended
- `PATH_A_PILOT_PAYER_EMAIL`
- `PATH_A_PILOT_PAYER_PASSWORD`

Supporting helper scripts now exist for a clean dedicated Path A pilot merchant:

- `npm run seed:path-a-pilot-merchant`
- `npm run reset:path-a-pilot-merchant-password`

Operational note:

- remote health checks can time out during Render cold starts, so the pilot script now uses a longer health timeout and retries before failing

4. **Production operator checklist must be proven**

Before public use, the team should prove these operational realities:

- rotating merchant credentials does not silently break the merchant backend
- webhook retries and duplicate handling are understood
- bad webhook destination, bad signature, and wrong base URL failures are easy to diagnose from the portal and support runbook
- merchants understand the current single-key sandbox model and its limitations

---

## Related documents

| Document | Use |
|----------|-----|
| `MERCHANT_INTEGRATION_GUIDE.md` | Technical steps, endpoints, reconciliation |
| `MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md` | When you outgrow single-merchant scope |
| `AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md` | Overall phased roadmap |
| `MERCHANT_GO_PUBLIC_PHASE_GATES.md` | Pass/fail gates |
| `TOKEN_STRATEGY_NOTE_CT_NT_USDT.md` | Token messaging and defaults |
| `AFRIEXCHANGE_MERCHANT_API_WEBHOOKS_SPEC.md` | Merchant portal API & Webhooks product intent |

---

## Bottom line

**Path A** is how most external ecommerce and services should start: **one merchant**, **standard APIs**, **merchant portal** for operations—without Kaalis-specific integration code paths.

**Last updated:** 2026-05-10 (deployed non-Kaalis pilot proof and hosted checkout clarification)
