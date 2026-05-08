# Kaalis AfriExchange Integration Settings Spec

## Purpose

This spec defines the `AfriExchange Integration` section that should live inside Kaalis Store admin platform settings.

The goal is to make the Kaalis <-> AfriExchange connection:

- visible
- understandable
- easier to operate
- easier to debug

This section is **not** meant to expose secrets directly in the UI. It is meant to expose the operational configuration and health signals that help the Kaalis team understand how the integration is wired.

---

## Why Kaalis needs this section

Right now, too much integration knowledge lives in env files and team memory.

That causes friction when we need to answer questions like:

- which AfriExchange merchant is Kaalis linked to?
- which AfriExchange web app are customers being sent to?
- what webhook endpoint is AfriExchange calling back?
- are XOF/AfriExchange rails currently enabled?
- what token strategy is Kaalis using today?
- when something breaks, where should we look first?

This settings section should answer those questions without requiring engineers to grep env files every time.

---

## Where it should live

Inside:

- [AdminSettings.vue](../../../kaalis-store/frontend/src/views/admin/AdminSettings.vue)

Recommended tab addition:

- `AfriExchange`

Current tab structure already includes:

- general
- commerce
- payouts
- shipping

Add:

- `afriexchange`

---

## Section goals

This settings section should let Kaalis admins:

1. understand whether AfriExchange integration is configured
2. see which merchant account is linked on AfriExchange
3. see which web and API endpoints are being used
4. understand which token and payment rail strategy is active
5. inspect webhook integration status
6. know what is env-driven versus editable

---

## Proposed page structure

## 1. Integration Overview

Top summary cards:

### Card: Integration Status

Show:

- `Connected`
- `Needs attention`
- `Disabled`

Rules:

- `Connected` when required values exist and recent handshake/webhook health looks good
- `Needs attention` when configured but something is failing
- `Disabled` when AfriExchange rail is intentionally off

### Card: Linked Merchant

Show:

- linked merchant display name
- AfriExchange merchant id

Example:

- `Kaalis Store`
- `04b76353-6d94-419d-9b10-4e84161575c1`

### Card: Active Token Strategy

Show:

- default live token for Kaalis
- later: allowed token set

Today:

- `CT`

Future:

- `CT`
- `NT`
- `USDT`

### Card: Rail Availability

Show clear badges:

- `AfriExchange`
- `Paystack`
- `OPay`

This helps the Kaalis team understand which path is active by market.

---

## 2. Connection Configuration

Readonly or lightly editable operational fields:

### AfriExchange API Base URL

Source today:

- `AFRIEXCHANGE_API_URL`

Display:

- current base URL
- environment badge (`local`, `staging`, `production`) if derivable

### AfriExchange Web URL

Source today:

- `VITE_AFRIEXCHANGE_WEB_URL`

Display:

- current customer-facing AfriExchange web app URL

Why it matters:

- Kaalis checkout UI relies on this when guiding users into AfriExchange account linking and merchant flow

### Linked Merchant ID

Display:

- merchant id
- maybe merchant display name if available via API lookup

This should be copyable.

### Webhook Callback URL

Source today:

- AfriExchange backend env points to Kaalis callback URL

Display:

- expected callback target:
  - e.g. `http://localhost:7788/api/afriexchange/webhooks`

Kaalis admins need to see this plainly.

### Shared Secret Status

Do **not** show raw secrets.

Instead show:

- `Configured`
- `Missing`
- `Last rotated` later if we support it

For:

- API key shared secret
- webhook secret

---

## 3. Token Strategy

This section should explain how Kaalis currently uses AfriExchange and where it may expand later.

### Fields

- default token
- allowed tokens
- settlement note
- off-ramp note

### Today

Recommended display:

- `Default token: CT`
- `Allowed tokens: CT`
- `Reason: CT currently solves Kaalis XOF settlement needs`

### Future

Allow planning fields for:

- `NT enabled`
- `USDT enabled`

These can be informational first before they become editable.

### Important message

The UI should explain:

- token choice is not just a label
- it affects settlement and liquidity behavior

---

## 4. Webhook Health

This is one of the most valuable operational parts.

Show:

- last webhook received at
- last webhook type
- last webhook delivery result
- last webhook error message if failure occurred

Examples of events to show later:

- account linked
- payment success
- collection settled
- merchant sync event

### Why this matters

When Kaalis and AfriExchange disagree about state, webhook health is one of the first places ops should look.

---

## 5. Runtime Notes

This section should explicitly tell admins which parts are runtime settings versus env-driven secrets.

### Example content

`Readonly from environment`

- AfriExchange API URL
- Web app URL
- webhook secret status
- shared API key status

`Editable in platform settings`

- token enablement
- integration labels
- rail availability switches
- operational notes

This reduces confusion and avoids people expecting the UI to change secrets directly.

---

## 6. Recommended actions area

Add action buttons like:

- `View linked merchant in AfriExchange`
- `Open webhook logs`
- `Copy merchant id`
- `Test webhook` later

These should be small but practical.

---

## Data contract recommendation

Kaalis backend should eventually expose a consolidated endpoint like:

`GET /api/admin/platform-settings/afriexchange`

Suggested response:

```json
{
  "success": true,
  "data": {
    "status": "connected",
    "apiBaseUrl": "http://localhost:5001/api/v1",
    "webAppUrl": "https://afri-x.vercel.app/",
    "linkedMerchant": {
      "id": "04b76353-6d94-419d-9b10-4e84161575c1",
      "name": "Kaalis Store"
    },
    "rails": {
      "afriexchange": true,
      "paystack": true,
      "opay": true
    },
    "tokens": {
      "default": "CT",
      "allowed": ["CT"]
    },
    "webhook": {
      "callbackUrl": "http://localhost:7788/api/afriexchange/webhooks",
      "secretConfigured": true,
      "lastReceivedAt": null,
      "lastEvent": null,
      "lastStatus": null
    },
    "secrets": {
      "apiKeyConfigured": true,
      "webhookSecretConfigured": true
    }
  }
}
```

---

## UI behavior recommendations

### Do not

- show raw API secrets
- make core secrets editable from frontend
- imply all tokens are interchangeable

### Do

- make merchant id copyable
- make URLs visible
- make integration state obvious
- show webhook health clearly
- explain that CT is the current Kaalis live rail

---

## Phase recommendation

### Phase 1

Readonly section:

- API URL
- web URL
- linked merchant id
- webhook URL
- secret configured/missing states
- default token
- rails enabled

### Phase 2

Operational intelligence:

- webhook health
- integration status
- last sync / last callback

### Phase 3

More controls:

- token enablement
- integration testing actions
- possible merchant lookup sync

---

## Outcome

When this section is done, a Kaalis admin should be able to answer:

- is AfriExchange configured?
- which merchant account is linked?
- which URLs are in use?
- which token is live?
- what rail is active?
- are webhooks working?

without opening env files.

