# AfriExchange Merchant Portal — Phased Plan for Public Use

## Purpose

This document defines **ordered phases** to take AfriExchange **Merchant** from “proven with Kaalis” to **ready for general ecommerce and services**. It draws on:

- What exists in **AfriExchange** (merchant APIs, merchant web app, admin, agents).
- How **Kaalis Store** uses AfriExchange (dedicated integration APIs, webhooks, admin visibility).
- The split between **Path A** (standard merchant integration) and **Path B** (marketplace-style partner integration) in `AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md`.

**Related docs**

- `MERCHANT_PATH_A_STANDARD_INTEGRATION.md` — Path A scope and implementation summary.
- `MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md` — Path B scope and Kaalis reference.
- `MERCHANT_GO_PUBLIC_PHASE_GATES.md` — launch pass/fail criteria (ties phases to “public”).
- `KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md` — why and how the two platforms connect.
- `KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md` — original product layers and optional future capabilities.
- `MERCHANT_INTEGRATION_GUIDE.md` — Path A technical guide.

---

## Current baseline (what we are building on)

### AfriExchange

- Backend: `POST /merchants/register` (authenticated user), profile, payment-request, transactions, dashboard, regenerate API key, KYC upload, verification flow; payments and ledger behavior under existing routes.
- Merchant web: `/merchant` — Overview, Collections, Wallet Assets, Sell Through Agent, Settings, API & Webhooks, Integration Hub, Docs.
- Kaalis-specific server APIs: `/api/v1/integrations/kaalis/collections`, `.../payouts` — **not** required for Path A; **are** the template for Path B depth.

### Kaalis (reference)

- Calls AfriExchange **integration** endpoints for collections and payouts; verifies **signed webhooks**; exposes an **AfriExchange** admin settings tab (merchant id, URLs, token strategy, webhook health, rails).

### Lesson for “easier for others”

| Kaalis pattern | What Path A merchants need | What we should productize |
|----------------|----------------------------|---------------------------|
| Clear rail split (NGN vs XOF) | Explicit **token** and **environment** in docs and portal | Token strategy visible everywhere (`TOKEN_STRATEGY_NOTE_CT_NT_USDT.md`) |
| Admin sees linkage + health | Merchant sees **API & Webhooks** + health | Keep improving portal + optional logs |
| Server-to-server + webhooks | Same for their backend | **Integration guide + examples** |
| Partner-only APIs | Only if they are a marketplace | **Path B** roadmap below |

---

## Phase 0 — Lock the reference (Kaalis) and document truth

**Goal:** External messaging and internal engineering share one truth; Kaalis stays stable as the proof.

**Activities**

- Treat Kaalis + AfriExchange integration as **reference**: env vars, webhook contract (`KAALIS_AFRIEXCHANGE_WEBHOOK_PAYLOAD_REFERENCE.md`), runbook.
- Update **`PROGRESS - What We Have Built So Far.md`** to include the **merchant web portal** (`afrix-web` `/merchant`) so the repo does not read as “merchant UI missing.”
- Add short links in **`readme.md`** to: dual-platform architecture, adoption requirements, **this phases doc**.

**Exit criteria**

- [ ] No contradictory “merchant UI” statements across top-level docs.
- [ ] Kaalis integration steps remain reproducible from written docs.

---

## Phase 1 — Path A ready for the first “non-Kaalis” merchant

**Goal:** A **single-merchant** ecommerce (or SaaS with checkout) can go live using **only** standard merchant APIs—no Kaalis integration routes.

**AfriExchange product/engineering**

- [x] **Onboarding path is explicit**: register user → register merchant → KYC → admin approval → API key + webhook URL. Role is now automatically set to `merchant` on registration. Flow is documented in the portal Docs page.
- [x] **Merchant portal** first-login experience: Integration Guide (`/merchant/docs`), Sandbox (`/merchant/sandbox`), and API & Webhooks (`/merchant/api-webhooks`) are all linked via the sidebar and cross-referenced.
- [x] **`MERCHANT_INTEGRATION_GUIDE.md`** verified against live routes — Node.js, Python, and PHP HMAC verification code samples added to `/merchant/sandbox`.
- [x] **Support checklist** for Path A — Error Catalog covering signature mismatch, wrong API key, rate limits, duplicate webhooks, and unverified merchant added to `/merchant/docs`.

**Optional quick wins**

- [ ] Postman collection or Bruno folder aligned with current `/merchants/*` endpoints (refresh `MERCHANT ENDPOINTS TESTING GUIDE` if needed).

**Exit criteria**

- [x] One **internal or pilot** merchant completes Path A (test or staging) without using `/integrations/kaalis/*`. Validated with `path_a_test_3@afriexchange.local` using Webhook.site.
- [x] Merchant can operate day-to-day from the **portal** (collections, wallet, API & Webhooks).

---

## Phase 2 — Merchant portal “public grade” UX

**Goal:** The portal feels like a **credible integration console**, not only an internal dashboard—aligned with `AFRIEXCHANGE_MERCHANT_API_WEBHOOKS_SPEC.md` and `KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md`.

**Prioritized deliverables**

1. [x] **Integration readiness** — Checklist (merchant verified, settlement wallet, default token, webhook URL) visible on API & Webhooks page.
2. [x] **Webhook operational clarity** — `integration_health` column tracks last delivery attempt, status, HTTP code, and error. Visible on API & Webhooks page and in the Sandbox.
3. [x] **Settings vs API & Webhooks** — Confirmed: Settings handles business identity; API & Webhooks is the integration console. No confusing duplication.
4. [x] **"Integration Guide" naming** — `/merchant/docs` is the Integration Guide; `/merchant/sandbox` is the test console; `/merchant/api-webhooks` is the operations hub. Sidebar links all three clearly.

**Exit criteria**

- [x] A new technical user can answer from the UI alone: *Which merchant id? Which token? Where do webhooks go? Is the last callback OK?* — all visible on API & Webhooks.
- [x] Stakeholder demo Path A without caveats about "ignore this tab."

---

## Phase 3 — Developer experience and trust

**Goal:** Reduce time-to-first-successful-payment for external engineers.

**Activities**

- [x] **Error catalog**: 8-entry catalog added to `/merchant/docs` covering all common HTTP errors (401, 403, 400, 429) with triggers and remediation steps.
- [x] **Webhook examples** for Path A — Full signed `sandbox.ping` payload shape visible and copyable in `/merchant/sandbox`.
- [x] **Sandbox vs production** guidance — `/merchant/sandbox` includes a "How to Simulate" section covering Webhook.site and RequestBin for local dev before building a real endpoint.
- [x] **Rate limiting and abuse** — Rate limits (60/20/5 req per window) documented in the Error Catalog & Rate Limits section of `/merchant/docs`.

**Exit criteria**

- [x] External engineer can integrate without a synchronous call to your team (within reason). Error catalog + code samples + sandbox cover the critical path.

---

## Phase 4 — Operations, observability, and scale

**Goal:** Safe to expose Merchant broadly without burning support.

**Activities**

- [x] **Webhook delivery log** — Complete with payload and error trace viewing. Merchants can independently troubleshoot failed callbacks from the API & Webhooks page.
- [x] **Exports / reconciliation** helpers — Robust CSV export (with proper escaping) added to Collections and Admin Merchant Detail pages.
- [ ] **Monitoring/alerts**: merchant API errors, webhook emit failures, integration partner failures (Kaalis + future).
- [ ] **Status / incidents** communication process (page or channel)—even lightweight.

**Exit criteria**

- [x] On-call or support can answer “did we deliver the webhook?” from tooling, not only logs.
- [x] Merchants can reconcile activity via CSV and debug their own webhook endpoints.

---

## Phase 5 — Path B: beyond Kaalis (marketplace and large partners)

**Goal:** Repeatable **partner** integration without cloning `kaalisIntegrationController.js` for every deal.

**Strategic options** (pick one or combine):

| Option | Pros | Cons |
|--------|------|------|
| **A. Named partner modules** (copy Kaalis pattern: `/integrations/{partner}/...`) | Fast per partner, clear isolation | N implementations to maintain |
| **B. Generalized integrations API** (configurable merchant id, metadata schema, HMAC keys) | One surface to document | Design and security work upfront |
| **C. Path A only for SMB; Path B is sales-assisted** | Limits scope | Enterprise still needs B |

**Activities**

- [ ] Product + engineering **spike**: choose A, B, or hybrid; define webhook event taxonomy across partners (`collection.*`, `payout.*`, `merchant.updated`).
- [ ] **Partner onboarding runbook** (legal, technical design review, UAT checklist).
- [ ] Migrate **Kaalis** to the chosen abstraction **if** worth the refactor cost; otherwise leave Kaalis as first mover and add **Partner 2** on new pattern.

**Exit criteria**

- [ ] Second partner can go live without one-off hacks—or explicit decision that Path B remains **sales-assisted custom work**.

---

## Suggested timeline shape (not dates)

| Phase | Rough sequence |
|-------|----------------|
| 0 | Days — docs alignment |
| 1 | Short sprint — Path A pilot |
| 2 | One or two sprints — portal polish |
| 3 | Parallelizable with 2 — DX |
| 4 | Before high-traffic public launch |
| 5 | When first marketplace partner is signed or strategic |

Phases **2–4** can overlap; **Phase 5** depends on business priority.

---

## What “public use” means (definition of done)

Minimum bar:

- Path A merchant can **onboard**, **integrate**, **reconcile webhooks**, and **operate** from the portal with **written** support paths.
- Documentation and UI agree; Kaalis remains the **reference** for Path B complexity.

Stretch bar:

- Webhook history, exports, generalized Path B, and strong observability.

---

## Maintenance

When phases complete, update this file (checkboxes and dates) and keep `AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md` aligned.

## Current reality check

Path A is **close** to production readiness, but the docs should not currently describe it as fully complete for self-serve external ecommerce.

The main unresolved production gaps are:

- Path A auth contract is still inconsistent between docs and code
- non-Kaalis end-to-end pilot evidence is still missing
- webhook event naming still needs one public source of truth

## Immediate completion work for Path A production readiness

Before treating Path A as production-ready for a single-store ecommerce merchant, complete these items:

- [ ] Decide and implement the real auth contract for `/api/v1/merchants/*`:
  merchant API key auth for backend-to-backend use is the preferred production shape.
- [ ] Update all merchant docs and portal snippets so auth examples match live behavior exactly.
- [ ] Normalize public webhook event naming and payload examples to the live Path A events.
- [x] Run one real non-Kaalis Path A **local** pilot from merchant API key auth through collection and webhook reconciliation via `npm run pilot:path-a`.
- [ ] Re-run the same pilot in staging or deployed infrastructure before public launch.
- [ ] Record the pilot evidence in docs/runbook before marking Gate 1.3 as passed.

**Last updated:** 2026-05-08 (Statuses corrected after production-readiness review)
