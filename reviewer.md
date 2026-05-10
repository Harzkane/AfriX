Does this leak anything meaningful about AfriX?

Short answer:

- not anything catastrophic
- but it does expose a few real operational details
- and a couple of the earlier conclusions need to be stated more carefully

---

## Overall verdict

The merchant README is broadly safe to publish as a public integration guide.

It tells merchants what they need in order to integrate:

- what URL to call
- what webhook contract to support
- what event names to expect
- how the hosted checkout flow works
- what env vars to set

That is normal for a public payment/platform integration document.

It does **not** expose:

- API keys
- webhook secrets
- private credentials
- internal DB contents
- user counts
- transaction volumes
- treasury logic
- mint/burn/admin internals

So the document is not “leaking secrets.”

---

## What it really does expose

### 1. Live infrastructure hostname

The docs currently expose:

```text
https://afrix-iqvq.onrender.com/api/v1
```

This reveals:

- you are using Render
- the current service slug is `afrix-iqvq`
- your public API versioning currently uses `/api/v1`

That is real infrastructure disclosure.

### Is that dangerous?

Not by itself.

Anyone can discover a public API hostname if they use the platform anyway.
But publishing the raw Render hostname does make it easier to:

- fingerprint your hosting provider
- probe your public API surface
- tie your merchant integration docs to your underlying deployment vendor

### Recommendation

Still a good idea:

- move to a custom API domain like `https://api.afrix.com`

Why:

- better presentation
- easier future provider migration
- hides the Render-specific hostname

This is a real recommendation, not security theater.

---

## What the docs imply about the stack

The public merchant README shows patterns such as:

- Node.js-style code
- Express routing
- Axios usage
- HMAC-SHA256 webhook verification

That is fine.

However, it would be inaccurate to say the public docs prove the AfriExchange merchant platform is specifically “Mongoose/MongoDB.”

Why that claim is too strong:

- the real Path A merchant/payment/webhook flow in AfriExchange is implemented through the `afriX_backend` merchant/payment stack
- merchant/webhook/payment records are handled through the backend models/controllers used by the live platform
- some sample merchant integration code patterns may resemble Mongoose-style ecommerce examples, but that is not the same thing as disclosing AfriExchange’s own production persistence model

So:

- `Node/Express style` is fair
- `specific Mongo/Mongoose inference` is too strong and should be avoided unless separately confirmed

---

## What business logic the README reveals

The README does reveal these real product behaviors:

- webhook signing uses HMAC-SHA256 on `${timestamp}.${rawBody}`
- event names currently include:
  - `payment.pending`
  - `collection.completed`
  - `sandbox.ping`
- hosted buyer flow exists
- buyer is redirected back with `return_url`
- merchants should wait for webhook confirmation before marking an order paid
- current Path A webhook delivery does not yet have automatic retry

This is operational product detail.

### Is that a problem?

Mostly no.

This is exactly the sort of information merchants need in order to integrate correctly.

Trying to hide it would create worse merchant failures than the competitive risk it introduces.

The one item with real strategic sensitivity is:

- no automatic retry on failed Path A merchant webhooks

That tells merchants the current recovery model is:

- one delivery attempt
- failed status logged
- manual review after failure

Competitors could use that as a maturity comparison point.

But it is still better to document this honestly than to let merchants assume retry exists when it does not.

---

## What the docs do NOT prove

A couple of earlier conclusions should be softened:

### “Readers can tell you are on Render’s free/starter tier”

Not really.

The hostname reveals Render.
It does **not** reliably prove the exact pricing tier.

It may hint at hosted cloud behavior, but stating a specific tier is speculation.

Better wording:

- the docs reveal Render as the hosting provider
- they do not prove the exact plan/tier

### “The docs leak nothing beyond merchant needs”

That is also a little too absolute.

They do reveal:

- current hosted buyer flow shape
- current event names
- retry limitation
- token/country assumptions

Those are not dangerous secrets, but they are real operational details.

So the better conclusion is:

- the docs reveal only integration-relevant operational details
- they do not reveal sensitive internal secrets

---

## Security and competitive-intelligence assessment

### Low risk

- Node/Express-like examples
- event names
- webhook signature pattern
- public API version path
- hosted buyer flow description

### Medium risk

- raw Render hostname instead of custom API domain
- explicit statement that Path A merchant webhooks currently have no automatic retry

### High risk

None observed in the README itself, as long as:

- no real API keys are committed
- no real webhook secrets are committed
- no internal-only admin endpoints are documented as public merchant endpoints

---

## Recommended actions before broad public promotion

### 1. Use a custom API domain

Recommended:

```text
https://api.afrix.com
```

instead of:

```text
https://afrix-iqvq.onrender.com/api/v1
```

### 2. Keep the webhook retry section honest

Do not remove it just to look better.

Merchants need to know the real delivery model.

If you want to improve the optics, the real solution is:

- implement retry behavior

not:

- hide the limitation

### 3. Continue separating merchant docs from admin/operator internals

That boundary is currently in a good place and should stay that way.

---

## Final judgment

The merchant README is safe enough to publish.

It exposes:

- integration-relevant operational behavior
- public API location
- current hosted checkout contract

It does **not** expose:

- secrets
- privileged credentials
- internal treasury/admin mechanics
- sensitive business data

So the right conclusion is:

- the document is public-facing and mostly well-disciplined
- the main cleanup item is using a custom API domain
- the main product-strength item is implementing webhook retries in the future
