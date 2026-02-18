# Agent Selection Screen – Updates Plan

This plan covers improvements to the **user-facing agent list** (Buy Tokens → Select Agent and Sell Tokens → Select Agent), so users can see and choose agents with the right information. Location is already handled by country filter; we add city where possible and other trust/suitability signals.

---

## ✅ Implementation status (all phases done)

| Phase | Status | Notes |
|-------|--------|--------|
| **Phase 1** | ✅ Done | City + Active pill on card; backend returns `city`, `status`, `is_online`. |
| **Phase 2** | ✅ Done | Max/trade on card; “Can handle your amount” / “Insufficient capacity”; card disabled when over limit; backend returns `max_transaction_limit`, `daily_transaction_limit`. |
| **Phase 3** | ✅ Done | “~X% fee” on card; backend returns `commission_rate`. Bank name shown (no `supported_payment_methods` on model). |
| **Phase 4** | ✅ Done | Sort: Best rated / Fastest / Highest capacity on Buy & Sell; backend `?sort=rating|fastest|capacity`. `total_minted`/`total_burned` returned but not yet shown as “X trades” on card (optional polish). |

---

## Current state (already in place)

- **Country filter**: Users see agents in their country only.
- **AgentCard shows**: name, tier, rating, response time, available capacity ($), verified badge, optional bank name.
- **API** (`GET /api/v1/agents/list?country=...`) returns: `id`, `country`, `currency`, `tier`, `rating`, `available_capacity`, `response_time_minutes`, `is_verified`, `phone_number`, `whatsapp_number`, `bank_name`, `account_number`, `account_name`, `full_name`.
- **Screens**: Buy flow uses `useAgentStore.fetchAgents(country)`; Sell flow uses direct `apiClient.get(AGENTS.LIST)`.

---

## Planned updates (in order)

### Phase 1 – Location & availability (high impact, low risk) ✅

| # | Item | Backend | Mobile | Notes |
|---|------|---------|--------|--------|
| 1.1 | **City** | Add `city` to Agent model if missing; include `city` in `listActiveAgents` response. | Show city under name or in a “Location” line (e.g. “Lagos, NG”). | Improves “where is this agent?” without changing filter logic. |
| 1.2 | **Online / Active status** | Add `is_online` (or use `status`) to Agent if not present; include in list response. | On card: small “Online” / “Active” pill or dot so users prefer available agents. | Backend model may already have status; list may need to expose it. |

**Deliverables**: Backend list returns `city` (and status/online); AgentCard shows city + status.

---

### Phase 2 – “Can this agent handle my amount?” (high impact) ✅

| # | Item | Backend | Mobile | Notes |
|---|------|---------|--------|--------|
| 2.1 | **Transaction limits** | Expose `max_transaction_limit` (and optionally `daily_transaction_limit`) in list response. | On card or in list: “Max per trade: ₦500,000” or “Handles up to X”. For Buy/Sell, compare with user’s amount and show “Can handle your amount” / “Limit: X” or disable select if over limit. | Prevents selecting an agent who can’t do the requested size. |
| 2.2 | **Capacity vs amount** | Already returning `available_capacity`. | Use it: when amount is in context (Buy/Sell), show “Can handle” or “Insufficient capacity” and optionally grey out or hide agents that can’t cover the amount. | Reduces failed or confusing selections. |

**Deliverables**: List response includes limits; Select Agent screens receive amount and show/highlight only agents that can handle it (with clear “Can handle your amount” or “Limit” copy).

---

### Phase 3 – Payment methods & fee hint (medium impact) ✅

| # | Item | Backend | Mobile | Notes |
|---|------|---------|--------|--------|
| 3.1 | **Payment methods** | If Agent has `supported_payment_methods` (or bank list), include in list response. | Show compact list on card: “Bank transfer, Mobile money” or bank logos/names. | Users can match their preferred payment method. |
| 3.2 | **Commission / fee** | Include `commission_rate` in list response (already on Agent model). | Show “~1% fee” or “Agent fee: X%” on card so users can compare. | Sets expectations and supports choice. |

**Deliverables**: Card shows payment methods (if API provides) and a short fee/commission line.

---

### Phase 4 – Reputation & sort (nice to have) ✅

| # | Item | Backend | Mobile | Notes |
|---|------|---------|--------|--------|
| 4.1 | **Transaction count / volume** | Add `total_transactions` and/or `transaction_volume` to list response if available. | On card: “1.2k trades” or “₦50m volume” to signal experience. | Builds trust. |
| 4.2 | **Sort options** | Optional: support `?sort=rating|response_time|capacity` (or default sort in backend). | UI: “Sort: Best rated / Fastest / Highest capacity” (segmented control or dropdown). | Lets users prioritize what matters to them. |

**Deliverables**: Cards show simple reputation metrics; list has a sort control and backend supports sort param (or we sort client-side from existing fields).

---

## Implementation order (recommended)

1. **Phase 1** – City + status (quick win, no new filters).
2. **Phase 2** – Limits and capacity vs amount (prevents bad selections).
3. **Phase 3** – Payment methods + commission (better comparison).
4. **Phase 4** – Reputation + sort (polish).

---

## Backend checklist (reference)

- **Agent model** (current): `id`, `user_id`, `country`, `currency`, `tier`, `status`, `available_capacity`, `rating`, `response_time_minutes`, `is_verified`, `commission_rate`, `bank_name`, `account_number`, `account_name`, `phone_number`, `whatsapp_number`, …  
- **List endpoint** currently returns (controller): id, country, currency, tier, rating, available_capacity, response_time_minutes, is_verified, phone_number, whatsapp_number, bank_name, account_number, account_name, full_name.  
- **To add for this plan**: `city` (if column exists or after migration), `is_online` or `status`, `max_transaction_limit`, `commission_rate`, optionally `supported_payment_methods`, `total_transactions`, `transaction_volume`; optional `sort` query param.

---

## Files to touch (mobile)

- `src/components/ui/AgentCard.tsx` – all card UI changes (city, status, limits, payment methods, fee, reputation).
- `app/modals/buy-tokens/select-agent.tsx` – pass amount/tokenType, optional filter by capacity/limit, sort UI.
- `app/(tabs)/sell-tokens/select-agent.tsx` – same as buy.
- `src/stores/slices/agentSlice.ts` – optional: extend agent type; keep using existing fetch.
- `src/stores/types/agent.types.ts` (or inline) – extend Agent type with new fields.

---

## Summary

- **Location**: Keep country filter; **add city** display. ✅
- **Availability**: Show **online/active** status. ✅
- **Suitability**: Use **limits + capacity** so users only see/select agents who **can handle their amount**. ✅
- **Choice**: Show **payment methods** (bank name) and **commission**; add **reputation** (data returned; optional “X trades” on card) and **sort** for better comparison. ✅

**Optional polish (not in plan):** Show `total_minted`/`total_burned` as “X trades” or volume on the card; add `supported_payment_methods` to the Agent model if you want a dedicated payment-methods line.
