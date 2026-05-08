# Token Strategy Note: CT, NT, and USDT

## Purpose

This note defines how we should talk about and use the three current token types in the Kaalis + AfriExchange ecosystem:

- `CT`
- `NT`
- `USDT`

It exists to keep:

- product decisions
- docs
- merchant settings
- integration language

aligned with the platform’s real operating model.

Related docs:

- [KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md](./KAALIS_AFRIEXCHANGE_MERCHANT_PLATFORM_PLAN.md)
- [MERCHANT_INTEGRATION_GUIDE.md](./MERCHANT_INTEGRATION_GUIDE.md)
- [KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md](./KAALIS_AFRIEXCHANGE_INTEGRATION_GUIDE.md)

---

## Current platform truth

AfriExchange currently recognizes these token types:

- `NT` = Naira Token
- `CT` = CFA Token
- `USDT` = Tether USD

These are first-class token types in the platform model.

Important rule:

```txt
first-class token support in the platform
does not mean each token is equally active in every product path today
```

That distinction matters a lot.

---

## The most important practical truth

For the current Kaalis <-> AfriExchange integration:

- `CT` is the live practical token rail

That means:

- docs should say this clearly
- settings should show this clearly
- operators should reason from this reality first

It also means we should avoid casually speaking as though:

- `NT`
- `USDT`

are already equivalent live Kaalis production rails when they are not.

---

## Short version

### CT

- current live Kaalis token rail for the XOF/AfriExchange path

### NT

- supported by the broader AfriExchange platform
- future-ready for Kaalis or other merchants
- not the current live Kaalis AfriExchange token story

### USDT

- supported by the broader AfriExchange platform
- valuable for treasury and settlement flexibility
- future-ready for merchants
- not the current live Kaalis AfriExchange token story

---

## Token-by-token guidance

## CT

### What it is

- CFA-oriented token rail in the current system

### Why it matters now

This is the token that solved the practical Kaalis XOF problem.

When we describe the current Kaalis integration honestly, `CT` is the token we should lead with.

### Current recommended positioning

Use language like:

- `CT is the live default token for the current Kaalis AfriExchange path`
- `CT currently powers Kaalis XOF merchant settlement behavior`

### Operational implications

- merchant settlement context should assume CT first
- webhook examples for Kaalis can reasonably show CT
- merchant collections for the Kaalis-linked merchant should be understood in CT terms unless deliberately expanded

### Product implication

Kaalis settings and AfriExchange merchant settings should both expose:

- `Default token: CT`

where that is truly the live operational state.

---

## NT

### What it is

- Naira Token

### Platform reality

NT is a real supported token in AfriExchange and belongs in the platform architecture.

### Current Kaalis reality

Kaalis does **not** need NT to explain its current XOF integration success.

So NT should be treated as:

- supported
- future-ready
- optional for later Kaalis expansion

not:

- current live Kaalis AfriExchange token path

### Recommended positioning

Use language like:

- `NT is available in the broader AfriExchange platform and may become relevant for future Kaalis or merchant use cases`

### Product implication

NT should appear in:

- token option sets
- docs
- future settings capability

but not be presented as though it already drives the current Kaalis AfriExchange production path.

---

## USDT

### What it is

- Tether USD

### Platform reality

USDT is also a real supported token type and is strategically important because it can help merchants who want a more stable treasury or settlement posture.

### Current Kaalis reality

USDT is not the present live Kaalis AfriExchange operational token path.

### Recommended positioning

Use language like:

- `USDT remains an important future-ready merchant option for treasury, settlement, or cross-market use cases`

### Product implication

USDT belongs in:

- architecture
- merchant product planning
- token strategy settings
- future merchant enablement

But again, not as a pretend-live Kaalis default today.

---

## Why token choice is not just cosmetic

We should never treat token choice as only a label.

Token choice affects:

- settlement expectations
- operational support language
- merchant wallet behavior
- off-ramp practicality
- liquidity assumptions
- future partner integration design

So any settings page that includes token selection should help the operator understand:

- what is live now
- what is merely supported in principle
- what is planned for future enablement

---

## Recommended language rules for docs and UI

## Do say

- `CT is the current live Kaalis AfriExchange token path`
- `NT and USDT remain future-ready supported options`
- `token choice affects settlement and liquidity behavior`

## Do not say

- `all tokens are equivalent today for Kaalis`
- `Kaalis currently runs equally on CT, NT, and USDT`
- `token selection is just preference`

---

## Recommended settings model

For Kaalis:

### Phase 1

Show:

- `Default AfriExchange token: CT`
- `Allowed tokens: CT`
- a note explaining why

### Phase 2

Add planning visibility for:

- `NT`
- `USDT`

Possible labels:

- `Planned`
- `Not enabled`
- `Future support`

For AfriExchange merchant portal:

### Phase 1

Show:

- default token
- settlement wallet token context

### Phase 2

Add:

- allowed token set
- merchant-facing explanation of what each token means operationally

---

## Recommended merchant guidance

When onboarding a new ecommerce merchant, we should help them answer:

1. which token is the right operational default for me?
2. what region/problem is this token solving?
3. what settlement or off-ramp path does this imply?

### Kaalis answer today

- `CT`
- because it solved the XOF collection/settlement problem

### Another ecommerce partner tomorrow

Could be:

- `CT`
- `NT`
- `USDT`

depending on geography, treasury preference, and integration goals

---

## Strategy recommendation

The clean strategic position is:

```txt
CT is the live proof rail
NT and USDT are supported future-ready rails
the platform is multi-token by architecture
but not every token is equally active in every integration today
```

That sentence should guide:

- settings
- docs
- integration conversations
- product roadmap language

---

## How this affects future ecommerce partners

For future partner onboarding, we should not present AfriExchange Merchant Platform as:

- `a CT-only product`

because that would undersell the platform.

But we also should not present it as:

- `all-token, all-market, same-behavior-everywhere`

because that would oversimplify reality.

The right framing is:

- `multi-token merchant platform`
- `with CT as the current strongest live proof point through Kaalis`

---

## Recommended next product steps

1. surface token strategy in Kaalis `AfriExchange Integration` settings
2. surface token strategy in merchant `API & Webhooks` / settings
3. add token guidance into merchant onboarding docs
4. define what must be true before `NT` or `USDT` become live Kaalis rails

---

## Bottom line

Today:

- `CT` is the real live Kaalis token path

Strategically:

- `NT` and `USDT` are important supported future-ready options

Operationally:

- token choice must be treated as a real settlement and liquidity decision, not a decorative setting

That is the token strategy the team should communicate and build around.

