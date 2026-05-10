# AfriExchange Merchant: What We Need for Other Ecommerce and Services

**Location:** this file lives under [`docs/merchant-platform/`](./) with the rest of the merchant and Kaalis integration doc set (see [`README.md`](./README.md)).

## Purpose

This document lists **what is already in place**, **what external adopters should use**, and **what we still need to complete** so **other ecommerce platforms and services** can adopt **AfriExchange Merchant** with clarity—using **Kaalis Store** as the reference implementation.

It is aimed at product, engineering, and partnerships. Detailed API and webhook content remains in `MERCHANT_INTEGRATION_GUIDE.md`, `AFRIEXCHANGE_MERCHANT_API_WEBHOOKS_SPEC.md`, and related files.

**Deep dives:** Path A → `MERCHANT_PATH_A_STANDARD_INTEGRATION.md`. Path B → `MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md`. Launch gates → `MERCHANT_GO_PUBLIC_PHASE_GATES.md`.

---

## What already exists (foundation)

### AfriExchange

- **Merchant lifecycle**: registration, KYC path, admin approval.
- **Merchant APIs**: profile, payment requests, transactions, dashboard summary, API key regeneration, webhook URL configuration.
- **Payments**: customer pay-merchant flows aligned with the backend payment model.
- **Merchant portal** (`afrix-web` `/merchant`): Overview, Collections, Wallet Assets, Sell Through Agent, Settings, API & Webhooks, Integration Hub, Docs.
- **Agent flows**: sell-through-agent / burn-style liquidity path for merchants who need off-ramp style operations.
- **Documentation set**: integration guide, webhook specs, token strategy note, admin runbook for Kaalis operators.

### Kaalis (reference integration)

- **Dedicated integration API** on AfriExchange: `/api/v1/integrations/kaalis/*` for **collections** and **payouts** with Kaalis-specific metadata and authentication.
- **Signed webhooks** from AfriExchange to Kaalis for payout updates.
- **Kaalis admin** settings tab for AfriExchange visibility and health.

---

## Two adoption paths (important)

### Path A — Single merchant / standard integration

**Best for**: One business, one AfriExchange merchant account, checkout flows that map cleanly to **merchant payment requests** and **merchant webhooks**.

**Uses**: Public merchant REST APIs (`/api/v1/merchants/...`), merchant API key, configured webhook URL, documentation in `MERCHANT_INTEGRATION_GUIDE.md`.

**Does not require**: The Kaalis-only `/integrations/kaalis/*` endpoints.

### Path B — Marketplace / platform partner (Kaalis-style)

**Best for**: Multi-vendor marketplaces, platform-initiated vendor payouts, heavy server-to-server orchestration with **external order and payout IDs**.

**Uses today**: Only Kaalis is implemented as a first-class **named integration** (`/integrations/kaalis/...`).

**Implication for new partners**: Either they **reshape** their model to Path A (one merchant, simpler reconciliation), or we **extend** the product with a **new partner integration** (or a **generalized** integrations API). That extension is **not** a generic self-serve toggle yet; it is **work we still need to define and build** per partner or as a productized connector.

---

## What we should complete for broad external adoption

### 1. Product and onboarding

| Item | Why it matters |
|------|----------------|
| Clear **public positioning**: who Merchant is for (XOF/regional gaps, token settlement, wallet-based checkout) | Reduces wrong-fit signups. |
| **Onboarding checklist** (approval, default token, webhook URL, first test payment) | Same flow for every partner; ties portal + docs. |
| **Support boundary**: what AfriExchange fixes vs what the ecommerce platform fixes | Fewer crossed wires in incidents. |

### 2. Documentation (keep current)

| Item | Status |
|------|--------|
| External `MERCHANT_INTEGRATION_GUIDE.md` | Exists—keep aligned with live API behavior. |
| Portal labels vs guide (e.g. Integration Guide vs Docs + Integration Hub) | Align wording when polishing for outsiders. |
| **Path A vs Path B** explainer | **This file**; consider a short summary in `readme.md`. |

### 3. AfriExchange product gaps (from internal plans)

From `KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md` **Phase 3–4** style items:

| Item | Benefit |
|------|---------|
| Webhook **delivery history** (beyond last attempt) | Enterprise debugging and audits. |
| **Exports** and reconciliation helpers | Finance and ops on the merchant side. |
| Optional **test webhook** from portal | Faster partner go-live. |
| Consolidated optional API e.g. `GET /merchants/integration` | Single payload for portal readiness (if still desired). |

These are **enhancements**, not strictly blocking a first Path A merchant.

### 4. Partner / marketplace path (Path B)

If we want **another** marketplace like Kaalis without one-off engineering each time:

| Item | Note |
|------|------|
| **Repeatable integration pattern** (new route namespace or configurable partner) | Engineering design decision. |
| **Contracts**: collections and payouts metadata schema, events, idempotency | Mirror lessons from `KAALIS_AFRIEXCHANGE_WEBHOOK_PAYLOAD_REFERENCE.md`. |
| **Security**: API keys, rotation, webhook signing | Same rigor as Kaalis. |

### 5. Operations and production readiness

| Item | Why |
|------|-----|
| **Monitoring** and alerts on webhook failures, integration errors | Production confidence. |
| **Rate limits** and abuse posture for public merchant APIs | Protect platform when traffic grows. |
| **SLA / status** communication | Partner expectations. |

Aligned with “Phase 8” style production hardening in `KAALIS_AFRIEXCHANGE_INTEGRATION_PHASES.md` (monitoring, rollout, audit polish).

### 6. Legal and compliance (outside engineering docs)

Merchant KYC, regional restrictions, and partner agreements should be **explicit** before scaling “open” signup.

---

## Single-store ecommerce (no vendors): can they use AfriExchange Merchant?

**Yes.**

A **single** ecommerce business (one seller, no marketplace vendors) is the **simplest** fit for **Path A**:

1. Register and get approved as **one AfriExchange merchant**.
2. Use **merchant payment requests** for checkout amounts and references.
3. Point customers to AfriExchange wallet / payment UX as per your integration.
4. Receive settlement in the **merchant settlement wallet** and operate via the **merchant portal** (collections, wallet assets, optional sell-through-agent).
5. Configure **webhooks** for order/payment reconciliation on your own backend.

They **do not** need the Kaalis-specific `/integrations/kaalis/*` APIs unless you intentionally build a **custom platform integration** similar to Kaalis (e.g. your own multi-tenant payout orchestration with bespoke metadata).

**Summary**: Single ecom is supported by the **standard merchant model**; Kaalis-specific routes are for **platform-scale** partner integration, not for “single shop” by default.

---

## Checklist for “ready to onboard external ecommerce” (Path A)

Use this as a working gate:

- [x] Merchant can complete registration and admin approval in a documented way.
- [x] Merchant portal reflects **API & Webhooks** and operational values (merchant id, webhook URL, health where implemented).
- [x] `MERCHANT_INTEGRATION_GUIDE.md` matches current endpoint auth model and webhook behavior.
- [x] At least one **non-Kaalis** Path A end-to-end pilot completed on hosted infrastructure (Sandbox Ping alone is not enough).
- [x] Support runbook for common failures (Error Catalog included in Docs).
- [x] Production monitoring for merchant-facing APIs and webhook emit paths (Health Logs & Payload Viewer live).

For **Path B** (marketplace), add:

- [ ] Designed partner integration model (per partner vs productized).
- [ ] Signed partner contract and technical design review.
- [ ] Webhook and payout contract tested like Kaalis.

---

## Related documents

- `MERCHANT_PATH_A_STANDARD_INTEGRATION.md` — Path A definition, implementation overview, public-ready phases.
- `MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md` — Path B definition, Kaalis reference, partner requirements.
- `MERCHANT_GO_PUBLIC_PHASE_GATES.md` — pass/fail gates for Path A / Path B public launch.
- `AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md` — phased plan to complete Merchant for public use (Path A first, then portal polish, DX, ops, Path B).
- `KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md` — how Kaalis and AfriExchange work together and why.
- `MERCHANT_INTEGRATION_GUIDE.md` — Path A technical starting point.
- `KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md` — product phases and portal IA.
- `TOKEN_STRATEGY_NOTE_CT_NT_USDT.md` — how to talk about CT / NT / USDT in docs and settings.

---

## Document maintenance

When APIs, routes, or onboarding change, update:

1. This file (adoption requirements and Path A/B clarity).
2. Sibling files in `docs/merchant-platform/`: `MERCHANT_PATH_A_STANDARD_INTEGRATION.md`, `MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md`, `MERCHANT_GO_PUBLIC_PHASE_GATES.md`, etc.
3. `MERCHANT_INTEGRATION_GUIDE.md`.
4. [`readme.md`](../../readme.md) (AfriExchange root) or `AfriX Platform Overview` if the public story shifts.

Current note:

- PlugNG is the current single-merchant external reference proving that a standard hosted redirect checkout plus signed webhook reconciliation is a valid Path A adoption model.

**Last updated**: 2026-05-10 (deployed non-Kaalis pilot proof and hosted Path A checkout clarification).
