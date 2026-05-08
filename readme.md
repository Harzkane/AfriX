# AfriExchange (AfriX)

AfriExchange (AfriX) is a non-custodial multi-token payment and settlement platform for African commerce — enabling merchants, users, and agents across currency zones to transact without traditional gateway dependencies.

---

## Repository structure

| Folder          | Description                    |
|-----------------|--------------------------------|
| **afriX_backend** | Node.js/Express API, PostgreSQL, Redis (optional) |
| **afriX-mobile**  | Expo (React Native) app for iOS/Android |
| **afrix-web**     | Next.js admin dashboard        |

---

## Backend (afriX_backend)

- **Runtime:** Node.js
- **Database:** PostgreSQL
- **Env:** Copy `.env.example` to `.env` and set DB, JWT, Resend (optional), etc.

```bash
cd afriX_backend
npm install
npm start
```

- API base: `http://localhost:5001/api/v1` (or `PORT` from `.env`)
- Health: `GET /health`

---

## Mobile app (afriX-mobile)

- **Framework:** Expo (React Native) with Expo Router
- **Env:** Set `EXPO_PUBLIC_API_URL` in `.env` (e.g. `http://YOUR_IP:5001/api/v1`)

### Run with Expo Go (quick dev)

```bash
cd afriX-mobile
npm install
npx expo start
```

- Scan QR with Expo Go. **Face ID / Biometric login does not work in Expo Go.**

### Development build (required for Face ID / biometrics)

To use **Biometric login (Face ID / Touch ID)** you must run a **development build**, not Expo Go.

**iOS:**

```bash
cd afriX-mobile
npx expo run:ios
```

- Builds the native app and opens in simulator or connected device.
- Use this build to enable and use Face ID from **Profile → Security → Biometric Login**.

**Android:**

```bash
cd afriX-mobile
npx expo run:android
```

- First run may take a while (native compile). Later runs use Metro for JS only.

### Clean native rebuild

If you change `app.json` plugins (e.g. `expo-local-authentication` for Face ID) or native config:

```bash
cd afriX-mobile
npx expo prebuild --clean
npx expo run:ios   # or run:android
```

---

## Admin dashboard (afrix-web)

- **Framework:** Next.js
- **Use:** Admin login and dashboard (users, agents, disputes, etc.)

```bash
cd afrix-web
npm install
npm run dev
```

---

## Build summary (mobile)

| Goal              | Command              | Face ID / Biometrics |
|-------------------|----------------------|-----------------------|
| Quick test        | `npx expo start`     | No (Expo Go)          |
| iOS dev build     | `npx expo run:ios`   | Yes                   |
| Android dev build | `npx expo run:android` | Yes                 |
| After plugin/config change | `npx expo prebuild --clean` then `run:ios` / `run:android` | Yes |

---

## Security (mobile)

- **Biometric login:** Enable under **Profile → Security**. Requires a development build (`npx expo run:ios` or `run:android`); not supported in Expo Go.
- **2FA:** Same Security screen; supports TOTP (e.g. Google Authenticator).
- **Change password:** Profile → Security → Change Password.

<!-- harzkane@gmail.com -->
- **GitHub:** https://github.com/Harzkane/AfriX.git
- **Render:** https://afrix.onrender.com/

---

## Docs in repo

- **Merchant & Kaalis docs (folder index):** [`docs/merchant-platform/README.md`](./docs/merchant-platform/README.md) — grouped guides; start here for follow-up.
- **Path A — standard merchant integration:** [`docs/merchant-platform/MERCHANT_PATH_A_STANDARD_INTEGRATION.md`](./docs/merchant-platform/MERCHANT_PATH_A_STANDARD_INTEGRATION.md) — single-merchant / default API integration.
- **Path B — marketplace partner integration:** [`docs/merchant-platform/MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md`](./docs/merchant-platform/MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md) — Kaalis-style partner scope and contracts.
- **Go-public phase gates:** [`docs/merchant-platform/MERCHANT_GO_PUBLIC_PHASE_GATES.md`](./docs/merchant-platform/MERCHANT_GO_PUBLIC_PHASE_GATES.md) — pass/fail criteria before public launch (Path A vs Path B).
- **Merchant — public release roadmap:** [`docs/merchant-platform/AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md`](./docs/merchant-platform/AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md) — phased plan (Path A → portal polish → DX → ops → Path B partners).
- **Merchant — external adoption:** [`docs/merchant-platform/AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md`](./docs/merchant-platform/AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md) — Path A vs Path B, checklist for onboarding other ecommerce/services.
- **Kaalis + AfriExchange architecture:** [`docs/merchant-platform/KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md`](./docs/merchant-platform/KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md) — how the two platforms work together and why.
- **Merchant integration (technical):** [`docs/merchant-platform/MERCHANT_INTEGRATION_GUIDE.md`](./docs/merchant-platform/MERCHANT_INTEGRATION_GUIDE.md) — standard merchant API integration for external platforms.
- **Platform overview (sales & value):** `/AfriX Platform Overview - Who It's For, What It Solves & Why Use It.md` — what AfriX is, who it’s for, what it solves, how to use it, benefits.
- **Progress (what we built):** `PROGRESS - What We Have Built So Far.md` (repo root) — implemented features in backend, admin web, and mobile.
- **Buy & Sell lifecycle:** `afriX_backend/docs/Buy and Sell Tokens - Full Lifecycle Documentation.md` — mint (buy) and burn (sell) flows from mobile through API to admin; states, timeouts, disputes, escrow, and API reference.
- **Send, Receive & Swap lifecycle:** `Send, Receive and Swap - Full Lifecycle Documentation.md` (repo root) — P2P transfer (send by email/QR), receive (share QR/email), and swap (NT/CT/USDT) flows; data flow diagrams, fees, rates, and API reference.
- **Docs vs code audit:** `afriX_backend/docs/Docs vs Code - Gap Audit.md` — gaps between backend/mobile/web and docs; what to implement or document.
- **afriX_backend:** See `afriX_backend/.env.example` and any `docs/` or `*.md` in that folder.
- **RAILWAY_SETUP.md**, **PostgreSQL**-related `.md` files: deployment and DB setup.
