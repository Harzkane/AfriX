# AfriExchange Merchant — Go-Public Phase Gates

## Purpose

This document defines **pass/fail gates** for taking AfriExchange **Merchant** public for external ecommerce and services. It complements:

- **`MERCHANT_PATH_A_STANDARD_INTEGRATION.md`** — what Path A is and how to implement it.
- **`MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md`** — Path B partner scope.
- **`AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md`** — ordered engineering phases (0–5).

Use these gates before marketing **public** merchant onboarding or signing **Path B** partners at scale.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Path A** | Standard merchant integration: `/api/v1/merchants/...`, one merchant account per integrator (see Path A doc). |
| **Path B** | Marketplace-style partner integration: dedicated server APIs (today: Kaalis-only pattern under `/integrations/kaalis/...`). |
| **Public** | External merchants/partners can integrate with **documented** APIs and **supported** operational expectations—not internal-only experiments. |

---

## Gate 0 — Documentation and single source of truth

| Criterion | Pass when |
|-----------|-----------|
| Path A and Path B are discoverable | `docs/merchant-platform/README.md`, `readme.md`, and `AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md` all point to Path A/B entry docs |
| No contradictory “merchant UI” claims | `PROGRESS - What We Have Built So Far.md` (or successor) reflects merchant **web** portal where applicable |
| Kaalis reference remains accurate | Dual-platform architecture + integration guides match current env and routes |

**Fails if:** Integrators cannot find Path A vs Path B or believe merchant portal does not exist.

---

## Gate 1 — Path A minimum viable public

**Audience:** First external single-merchant or standard ecommerce integrators.

| # | Gate | Pass when |
|---|------|-----------|
| 1.1 | **API truth** | `MERCHANT_INTEGRATION_GUIDE.md` matches live `/merchants/*` auth model and payment/webhook behavior |
| 1.2 | **Onboarding path** | Documented flow: user → merchant register → KYC → admin approval → API key + webhook |
| 1.3 | **Pilot** | At least one **non-Kaalis** Path A end-to-end success (staging or prod-like): payment request → visible collection/settlement → webhook reconciliation. Sandbox ping by itself does **not** satisfy this gate. |
| 1.4 | **Merchant portal** | Merchant can operate using `/merchant` (collections, API & webhooks, docs/integration hub as applicable) |
| 1.5 | **Support minimum** | Documented troubleshooting for wrong base URL, bad API key, webhook signature mismatch, duplicate webhooks |

**Path B:** Not required to pass Gate 1.

---

## Gate 2 — Merchant portal “public grade”

| # | Gate | Pass when |
|---|------|-----------|
| 2.1 | **Integration clarity** | Merchant can see merchant id, webhook URL, token/settlement context without admin help |
| 2.2 | **Readiness signal** | Clear checklist or equivalent (verified merchant, wallet, webhook, API key) — may be UI or strongly documented procedure |
| 2.3 | **Settings vs API & Webhooks** | No confusing duplication for integrators (`AFRIEXCHANGE_MERCHANT_API_WEBHOOKS_SPEC.md` alignment) |

---

## Gate 3 — Developer experience and trust

| # | Gate | Pass when |
|---|------|-----------|
| 3.1 | **Errors** | Common API errors documented with remediation |
| 3.2 | **Local/dev** | Guidance for tunneling webhooks or sandbox URLs |
| 3.3 | **Limits** | Rate limits or fair-use expectations documented for merchant-authenticated APIs |

---

## Gate 4 — Operations and scale

| # | Gate | Pass when |
|---|------|-----------|
| 4.1 | **Observability** | Alerts or dashboards for merchant API failures and webhook emit failures |
| 4.2 | **Incident path** | Owners know how to diagnose “webhook not delivered” vs “receiver bug” |
| 4.3 | **Optional exports** | If promised publicly: Collections/export path exists or is explicitly “roadmap” |

---

## Gate 5 — Path B (partner marketplace)

Apply when onboarding **another** marketplace-style partner or offering Path B as a **sales-assisted** product.

| # | Gate | Pass when |
|---|------|-----------|
| 5.1 | **Contract** | Signed technical appendix: collections, payouts, events, idempotency, metadata keys |
| 5.2 | **Implementation** | Dedicated integration route set or approved generalized API; keys rotated per partner |
| 5.3 | **Webhook parity** | Verification, duplicate handling, and operator runbook tested like Kaalis |
| 5.4 | **Ops visibility** | Partner admin can see linkage and health (pattern from Kaalis AfriExchange settings) |

**Note:** Gate 5 can pass for **Kaalis only** while Gate 1–4 target **Path A public**—they serve different launches.

---

## Recommended launch combinations

| Launch type | Gates |
|-------------|--------|
| **Path A public beta** | Gate 0 + Gate 1 (+ Gate 2 strongly recommended) |
| **Path A general availability** | Gate 0–3 (+ Gate 4 before high traffic) |
| **Path B new partner** | Gate 5 + relevant Gate 4 ops items |
| **Path B productized for many partners** | Gate 5 + Phase 5 completion from **`AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md`** |

---

## Related documents

- `MERCHANT_PATH_A_STANDARD_INTEGRATION.md`
- `MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md`
- `AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md`
- `AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md`

---

## Maintenance

After each release or integration change, revisit Gate **1.1**, **1.5**, and **5.2**–**5.3**.

**Last updated:** 2026-05-05
