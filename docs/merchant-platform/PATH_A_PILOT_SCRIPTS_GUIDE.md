# Path A Pilot Scripts Guide

This document explains how to use the **Path A pilot helper scripts** in `afriX_backend/src/scripts`.

These scripts are for two main jobs:

- provisioning a dedicated **pilot merchant**
- provisioning a dedicated **pilot payer / buyer**
- running a repeatable **end-to-end Path A verification**

---

## 1. Scripts covered

Merchant scripts:

- `npm run seed:path-a-pilot-merchant`
- `npm run reset:path-a-pilot-merchant-password`

Payer scripts:

- `npm run seed:path-a-pilot-payer`
- `npm run reset:path-a-pilot-payer-password`

Pilot verifier:

- `npm run pilot:path-a`

---

## 2. What each script does

### `npm run seed:path-a-pilot-merchant`

Creates or reuses a dedicated **approved Path A merchant**.

It ensures:

- merchant user exists
- merchant user is active and verified
- CT settlement wallet exists
- merchant profile exists
- merchant is approved
- merchant API key exists

It prints:

- `PATH_A_PILOT_MERCHANT_EMAIL`
- `PATH_A_PILOT_MERCHANT_ID`
- `PATH_A_PILOT_MERCHANT_API_KEY`

### `npm run reset:path-a-pilot-merchant-password`

Resets the pilot merchant login password to a known value.

Use this when:

- the merchant already exists
- the password is unknown
- you want a stable login for portal testing

### `npm run seed:path-a-pilot-payer`

Creates or reuses a dedicated **buyer / payer** for remote Path A tests.

It ensures:

- payer user exists
- payer is active and verified
- payer has a CT wallet
- payer wallet has enough balance for the pilot

It prints:

- `PATH_A_PILOT_PAYER_EMAIL`
- `PATH_A_PILOT_PAYER_PASSWORD`

### `npm run reset:path-a-pilot-payer-password`

Resets the pilot payer password to a known value.

Use this when:

- the payer already exists
- the login password is unknown

### `npm run pilot:path-a`

Runs the full Path A verification flow.

In **local mode**, it can provision local data and verify against your local backend.

In **remote mode**, it verifies against the hosted AfriExchange backend using:

- an existing deployed merchant API key
- an existing deployed payer login
- a public webhook receiver

The remote pilot checks:

- API health
- merchant API key authentication
- webhook URL update
- payer login
- payment request creation
- payment completion against the same request
- webhook delivery log update

---

## 3. Local mode vs remote mode

### Local mode

Use local mode when:

- backend API is running locally
- database is local
- you want to verify code changes during development

Typical setup:

- `PATH_A_PILOT_API_URL=http://localhost:5001/api/v1`
- `DB_USE_LOCAL=true`

### Remote mode

Use remote mode when:

- you want to verify the real deployed Path A flow on Render
- you want proof that production-like infrastructure works

Typical setup:

- `PATH_A_PILOT_API_URL=https://afrix-iqvq.onrender.com/api/v1`
- `PATH_A_PILOT_WEBHOOK_URL=https://webhook.site/...`
- merchant and payer must already exist in the deployed database

Important:

- remote mode does **not** seed users automatically through the API
- merchant API key must belong to the same database the deployed backend uses
- payer credentials must belong to the same deployed database too

---

## 4. Required environment variables

### Remote pilot variables

Set these in `.env` before running `npm run pilot:path-a` against Render:

- `PATH_A_PILOT_API_URL`
- `PATH_A_PILOT_WEBHOOK_URL`
- `PATH_A_PILOT_MERCHANT_API_KEY`
- `PATH_A_PILOT_MERCHANT_ID`
- `PATH_A_PILOT_MERCHANT_EMAIL`
- `PATH_A_PILOT_MERCHANT_PASSWORD`
- `PATH_A_PILOT_PAYER_EMAIL`
- `PATH_A_PILOT_PAYER_PASSWORD`

Optional:

- `PATH_A_PILOT_HEALTH_TIMEOUT_MS`
- `PATH_A_PILOT_HEALTH_RETRIES`
- `PATH_A_PILOT_AMOUNT`

### Merchant seed variables

Optional merchant seed overrides:

- `PATH_A_PILOT_MERCHANT_EMAIL`
- `PATH_A_PILOT_MERCHANT_PASSWORD`
- `PATH_A_PILOT_MERCHANT_BUSINESS_NAME`
- `PATH_A_PILOT_MERCHANT_DISPLAY_NAME`
- `PATH_A_PILOT_MERCHANT_COUNTRY`
- `PATH_A_PILOT_MERCHANT_CITY`
- `PATH_A_PILOT_MERCHANT_PHONE`

### Payer seed variables

Optional payer seed overrides:

- `PATH_A_PILOT_PAYER_EMAIL`
- `PATH_A_PILOT_PAYER_PASSWORD`
- `PATH_A_PILOT_PAYER_NAME`
- `PATH_A_PILOT_PAYER_COUNTRY`
- `PATH_A_PILOT_PAYER_PHONE`
- `PATH_A_PILOT_PAYER_CT_BALANCE`

---

## 5. Standard remote pilot flow

From `afriX_backend`:

```bash
npm run seed:path-a-pilot-merchant
```

Copy the printed merchant values into `.env`.

Then:

```bash
npm run seed:path-a-pilot-payer
```

Copy the printed payer values into `.env`.

Then:

```bash
npm run pilot:path-a
```

If successful, the expected high-level outcome is:

- merchant API key auth OK
- payer login OK
- payment request created
- payment processed against original request
- final status `completed`
- last webhook status `delivered`

---

## 6. Database safety rule

These scripts write to **whatever database your current `.env` points to**.

That means:

- if `DB_USE_LOCAL=true`, you are writing to local Postgres
- if `DB_USE_LOCAL=false` and `DATABASE_URL` is your Render URL, you are writing to Render Postgres

Recommended workflow:

1. switch `.env` to Render DB only when performing deployed pilot seeding/testing
2. run the seed and pilot scripts
3. switch `.env` back to local DB afterward

Do not leave normal development accidentally pointed at production-like data.

---

## 7. Common failures

### `Invalid or expired authentication credential`

Cause:

- merchant API key does not exist in the database used by the backend being tested

Usually means:

- merchant was seeded locally
- pilot was run against Render

### `Invalid email or password`

Cause:

- payer login does not exist in the target database
- or password is wrong

Fix:

- run `npm run seed:path-a-pilot-payer`
- or `npm run reset:path-a-pilot-payer-password`

### `timeout of 5000ms exceeded` or slow health checks

Cause:

- Render cold start or slow wake-up

Fix:

- increase `PATH_A_PILOT_HEALTH_TIMEOUT_MS`
- increase `PATH_A_PILOT_HEALTH_RETRIES`

### webhook not delivered

Cause:

- webhook receiver URL is invalid, down, or private

Fix:

- use a public HTTPS endpoint
- use `webhook.site` for delivery inspection

---

## 8. After a deployed pilot passes

After a successful remote pilot:

1. keep the final merchant and payer values recorded in your secure env store
2. switch `.env` DB config back to local development values
3. update release/readiness docs to mark deployed pilot proof as passed

---

## 9. Related docs

- `PATH_A_MERCHANT_QUICKSTART.md`
- `MERCHANT_PATH_A_STANDARD_INTEGRATION.md`
- `MERCHANT_INTEGRATION_GUIDE.md`
