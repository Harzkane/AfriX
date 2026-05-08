# Path B — Marketplace-Style Partner Integration

## What Path B is

**Path B** is a **platform partner** integration: an ecommerce or marketplace **backend** orchestrates **many orders**, **many sellers**, and often **platform-initiated payouts**, while AfriExchange continues to own **merchant/token settlement**, wallets, and ledger rules.

Today, **Kaalis Store** is the **only** implemented Path B reference in this ecosystem: it uses **dedicated server-to-server APIs** on AfriExchange (not the generic “single merchant payment request only” flow).

---

## Who Path B is for

- **Multi-vendor marketplaces** with vendor payout batches or scheduled payouts.
- Platforms that need **strong correlation** between **their** ids (order id, payout id, vendor id) and AfriExchange transactions.
- Partners willing to run **integration keys**, **signed webhooks**, and **joint operational runbooks**.

If you only need **one legal merchant** and a straightforward checkout, prefer **`MERCHANT_PATH_A_STANDARD_INTEGRATION.md`**.

---

## Current implementation reality (Kaalis)

AfriExchange exposes **Kaalis-specific** routes under:

- `POST /api/v1/integrations/kaalis/collections`
- `POST /api/v1/integrations/kaalis/payouts`
- `GET /api/v1/integrations/kaalis/payouts/:id`

Authentication uses the **Kaalis integration API key** (`x-kaalis-api-key` / configured equivalent); behavior and metadata (e.g. Kaalis order id, payout id) live in **`afriX_backend`** (`kaalisIntegrationController.js`, `integrations` routes).

Kaalis receives **signed webhooks** on its backend for payout lifecycle updates. Payload and verification details: **`KAALIS_AFRIEXCHANGE_WEBHOOK_PAYLOAD_REFERENCE.md`**.

Operational context: **`KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md`**, **`KAALIS_AFRIEXCHANGE_ADMIN_RUNBOOK.md`**.

---

## What a new Path B partner needs (product + engineering)

Path B is **not** currently a self-serve “toggle” for arbitrary marketplaces. A new partner typically needs:

1. **Business and compliance**: marketplace legals, support ownership, fraud and dispute boundaries between platform and AfriExchange.
2. **Technical design review**: collections model, payout model, idempotency keys, retry rules, webhook event taxonomy.
3. **AfriExchange engineering**: either a **new named integration** (similar to `/integrations/kaalis/...`) or a future **generalized integrations layer**—see **`AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md` Phase 5.
4. **Mirror operational visibility**: like Kaalis admin “AfriExchange” settings—your platform should expose **non-secret** config (linked merchant id, URLs, health) for operators.
5. **Webhook contract**: HMAC (or agreed signing), event allowlist, duplicate handling, mapping tables for provider status → internal status.

---

## Path B — phases toward a repeatable public offering

| Stage | Intent |
|-------|--------|
| **Reference locked** | Kaalis integration documented, stable, reproducible (`KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md`, phases doc at workspace root if present). |
| **Partner playbook** | Runbooks for onboarding Partner 2+: security review checklist, UAT scenarios, rollback. |
| **Productized integration (optional)** | Design spike: named integrations vs generalized `/integrations/*` API — **`AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md` Phase 5**. |
| **Scale** | Monitoring for partner traffic, webhook emit failures, support escalation paths. |

Full cross-cutting **go-public gates**: **`MERCHANT_GO_PUBLIC_PHASE_GATES.md`**.

---

## Security and operations (non-negotiable)

- **Secrets**: integration API keys and webhook secrets stay in **secure env**; UIs show **configured/missing**, not raw secrets (Kaalis pattern).
- **Idempotency**: payout and collection creation should tolerate safe retries; webhook processing must tolerate duplicates.
- **Least privilege**: partner keys only reach integration routes intended for that partner.

---

## Related documents

| Document | Use |
|----------|-----|
| `MERCHANT_PATH_A_STANDARD_INTEGRATION.md` | Default path for single-merchant setups |
| `KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md` | End-to-end Kaalis ↔ AfriExchange story |
| `KAALIS_AFRIEXCHANGE_WEBHOOK_PAYLOAD_REFERENCE.md` | Webhook signing and payload shapes (Kaalis) |
| `KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md` | Kaalis env and flow specifics |
| `AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md` | Path A vs Path B summary |
| `AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md` | Roadmap including Phase 5 partner strategy |

---

## Bottom line

**Path B** is how **Kaalis-scale** marketplaces integrate today: **custom integration surface** + **strict webhook contracts** + **joint ops**. Additional partners require explicit engineering and governance—not the same as flipping on Path A.

**Last updated:** 2026-05-05
