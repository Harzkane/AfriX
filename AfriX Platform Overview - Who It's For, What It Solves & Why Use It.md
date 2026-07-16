# AfriExchange (AfriX) — Platform Overview

**Who it's for • What it solves • How to use it • Why it matters**

---

## What Is AfriX?

**AfriExchange (AfriX)** an **AfriExchange is a commerce infrastructure platform that enables users, merchants, agents, and partner marketplaces to move value across African markets through programmable settlement rails built on tokenized digital assets.** for African commerce. It lets people, independent agents, merchants, and partner platforms move value across currency zones quickly and transparently—using tokens (**NT**, **CT**, **USDT**) instead of relying only on banks and traditional remittance.

- **For users (mobile app):** Buy, send, receive, swap, and sell tokens with agent-backed mint/burn and escrow protection. **Request tokens from a contact** and **scan-to-pay merchants in the mobile app** are still on the roadmap.
- **For agents:** Earn by facilitating token–cash exchanges (mint/burn) with capacity tied to a USDT security deposit, clear rules, and dispute handling.
- **For merchants:** Accept token payments via **API**, **webhooks**, **hosted checkout** (`/pay/...` on the web app), and the **merchant portal** (collections, wallet, sell-through-agent, integration docs). Production references: **PlugNG Shop** (Path A, [plugng.shop](https://plugng.shop)) and **Kaalis Store** (Path B, XOF rail at [bruthol.com](https://bruthol.com)) via integration APIs.
- **For operators:** Admin dashboard for users, agents, merchants, financials, operations, disputes, withdrawals, education, and security.

We are **not a bank**. We are a **technology platform and marketplace** that connects users with independent agents and merchants. Tokens are blockchain-based digital assets with reference rates (e.g. 1 NT ≈ 1 Naira); they are not legal tender. We provide the rails; users and agents conduct the exchanges.

---

## Platform surfaces (what exists today)

| Surface | Location | Who uses it | Main capabilities |
|--------|----------|-------------|-------------------|
| **Mobile app** | `afriX-mobile` (Expo) | End users & agents | Auth, 2FA, biometrics, wallets, P2P send/receive, swap, mint/burn, agent mode, education, notifications, disputes |
| **Admin dashboard** | `afriX_backend/afrix-web` — `/login`, dashboard routes | Platform admins | Overview metrics, users, agents (KYC), merchants, financials, operations, disputes, withdrawals, education, security |
| **Merchant portal** | `afriX_backend/afrix-web` — `/merchant/*` | Approved merchants | Overview, collections, wallet assets, sell-through-agent, settings, API & webhooks, integration hub, docs, sandbox, KYC |
| **Hosted checkout** | `afriX_backend/afrix-web` — `/pay/[id]` | Customers paying a merchant | View payment request, sign in, pay from wallet (public page; no admin/merchant cookie required) |
| **REST API** | `afriX_backend` — `/api/v1/*` | Apps & integrations | Auth, wallets, requests (mint/burn), payments, merchants, agents, disputes, education, notifications, **integrations** (e.g. Kaalis) |
| **Partner APIs** | `/api/v1/integrations/kaalis/*` | Marketplace partners (Path B) | Account verify/link, collections, payouts (server-to-server + signed webhooks back to partner; verified on [bruthol.com](https://bruthol.com)) |

**Deployment (example):** API hosted on Render — see repo `readme.md` (`https://afrix.onrender.com/`). Mobile points at `EXPO_PUBLIC_API_URL`; web uses `NEXT_PUBLIC_API_URL`.

---

## Who Is It For?

### 1. **Everyday users (individuals)**

- People who want to **send value to family or friends** without slow, expensive bank or mobile-money routes.
- People who need **cross-border value** (e.g. Nigeria ↔ XOF) without high remittance fees.
- People who prefer **transparent fees**, instant P2P transfers, and 24/7 availability.
- People comfortable with **digital tokens** and a simple app loop: buy → send/receive/swap/sell.

### 2. **Agents (independent facilitators)**

- Reliable people with **bank and/or mobile money** who want to **earn from facilitating** token–cash exchanges.
- People who can meet **KYC and USDT security-deposit** requirements and follow a clear rulebook (mint/burn, escrow, disputes).
- Operators who care about **ratings, response time, and capacity** and want to grow volume and tier (Starter → Platinum).

### 3. **Merchants (businesses)**

- Shops, freelancers, SaaS, and marketplaces that want to **accept NT/CT** (often **CT-first** for XOF operations—see token strategy doc).
- Businesses wanting **lower fees than card processing** (~2% merchant collection fee), instant settlement to a settlement wallet, and **API + webhooks** for ecommerce.
- Teams that need a **merchant portal** for day-to-day visibility—not only mobile consumer flows.

### 4. **Commerce & marketplace partners**

- Platforms like **Kaalis Store** ([bruthol.com](https://bruthol.com)) that need a **dedicated settlement rail** (e.g. XOF) while keeping catalog, orders, and vendor logic on their side.
- **Path A:** single-merchant ecommerce using standard merchant APIs and hosted checkout (fully implemented and tested on **PlugNG Shop** at [plugng.shop](https://plugng.shop)).
- **Path B:** marketplace-style partners using **integration** routes and webhook contracts (fully implemented and tested on **Kaalis Store** at [bruthol.com](https://bruthol.com)).

### 5. **Families and communities**

- Groups that **send and receive value** frequently (support, shared expenses, gifts).
- Users who will benefit from **request-based flows** (“request 2,000 NT from a friend”) once the mobile feature ships.

---

## What Problems Does AfriX Solve?

| Problem | How AfriX helps |
|--------|------------------|
| **Slow, expensive bank transfers** | Instant P2P token transfers (typically under a minute) and low fees (e.g. 0.5% send, 1.5% swap). |
| **High remittance costs** | Cross-border value via tokens and agents; typically cheaper than traditional remittance (e.g. 8–15%). |
| **Weekends/holidays = delays** | Platform and agents operate 24/7 where agents are online. |
| **Trust when swapping cash for “digital”** | Escrow on burns: user’s tokens lock; agent sends fiat; user confirms receipt. Disputes go to admin with evidence. |
| **Unclear or hidden fees** | Fees shown before confirm (send 0.5%, swap 1.5%, merchant collection 2%, etc.). Platform fee collection is documented for operators. |
| **Merchants paying high card fees** | Accept NT/CT at ~2% (merchant side); settlement to merchant wallet; **web checkout and APIs live today**. |
| **Agents taking on risk with no structure** | Clear mint/burn flows, capacity from USDT deposit, escrow, dispute process, and performance tiers. |
| **Scattered tools (payments, swaps, liquidity)** | Mobile app for consumer/agent loops; **merchant portal + APIs + hosted pay** for businesses; admin for oversight. |
| **Ecommerce without a workable XOF rail** | Partner integration (Kaalis model): collections and payouts over HTTPS + signed webhooks, CT-first strategy where configured. |

---

## How to Use AfriX

### As a **user** (mobile app)

1. **Get started:** Download the app → register (email, password) → verify email → wallets (NT, CT, USDT) are created.
2. **Get tokens:**  
   - **Buy from an agent:** Amount and token type → pick agent → pay via bank/mobile money → upload proof → agent confirms → tokens arrive (often 5–15 min).  
   - **Receive from someone:** Share QR or email → they send → you receive.  
   - **Swap:** e.g. USDT → NT/CT or NT ↔ CT in-app (~1.5% fee).
3. **Send value:** Send → scan QR or enter email → amount + note → confirm (0.5% fee).
4. **Sell tokens:** Sell → agent → bank details → tokens escrowed → agent sends fiat → you confirm receipt (or dispute within the window).
5. **Pay a merchant:** **In the mobile app — coming soon.** Today, customers can pay via **hosted checkout** on the web (`/pay/[transactionId]`) or merchants’ own sites calling the payment APIs.
6. **Request tokens from a friend:** **Coming soon** (placeholder modal in app; no backend flow yet).

Optional: Verify ID for higher limits; complete **education modules**; enable **2FA** and **biometric app lock** (requires a dev build, not Expo Go).

### As an **agent** (mobile app + API)

1. **Apply:** “Become an Agent” → register (country, currency, withdrawal address) → **KYC upload** → await admin approval.
2. **Activate:** After KYC approval, send USDT to the platform treasury → **submit tx hash and amount** (`POST /agents/deposit`) → backend **verifies on-chain** → capacity credited → status **ACTIVE**.
3. **Operate:** Mint (user buy) and burn (user sell) queues in agent mode; maintain payment methods, response time, and evidence for disputes.
4. **Earn & withdraw:** Fee share and tiers per platform rules; request withdrawal via app; admin approves and marks paid in the dashboard.

Minimum deposit and tiers are **environment-configurable** (see agent handbook and `AGENT_MIN_DEPOSIT_USD` in backend config).

### As a **merchant**

**Onboarding (typical Path A)**

1. **User account** → register as **merchant** (API or merchant portal `/merchant/register`) → business profile → **merchant KYC** → **admin approval**.
2. **Go live:** Regenerate **API key**, set **webhook URL**, choose default token (often **CT** for XOF pilots).
3. **Get paid:**  
   - **Payment request API** → share **hosted pay link** (`/pay/[id]`) or embed flow on your site.  
   - Customer pays from AfriExchange wallet (web hosted page or `POST /payments/process` / `POST /transactions/pay-merchant` where applicable).  
   - Funds settle to **settlement wallet**; view in **merchant portal** (collections, wallet assets).
4. **Cash out or reuse:** **Sell through agent** from portal when you need fiat; or reuse tokens in your operations.
5. **Integrate deeper:** HMAC-signed webhooks, sandbox page, integration hub, and guides under `docs/merchant-platform/`.

**Path B (marketplace partner):** Server-to-server **Kaalis integration** routes (`/api/v1/integrations/kaalis/...`) plus webhook contract—see dual-platform architecture doc. Verified live on **Kaalis Store** ([bruthol.com](https://bruthol.com)). Not required for a single-store Path A merchant.

### As a **platform admin**

1. Sign in at **`/login`** on the web app (admin role).
2. Use dashboard areas: users, agents (KYC approve/reject), merchants, financials, operations (mint/burn, escrows, disputes), withdrawals, education, security.

---

## Benefits of Using AfriX

### For **users**

- **Speed:** P2P and swaps in under a minute; agent mint typically minutes once proof is confirmed.
- **Cost:** Lower than many banks and remittance options (e.g. 0.5% send, 1.5% swap; receive free).
- **24/7:** No bank hours for in-app P2P, swap, and agent availability.
- **Transparency:** Amount, fee, and recipient shown before confirm.
- **Safety when selling:** Escrow until you confirm fiat (or dispute).
- **One mobile home** for buy, send, receive, swap, sell (merchant pay & friend-request coming in-app).
- **Cross-border ready:** NT, CT, and USDT across supported markets.
- **Control:** Optional 2FA, biometrics, notification preferences.

### For **agents**

- **Earn on volume:** Fee share, optional spread within limits, volume bonuses by tier.
- **Clear rules:** Mint/burn, capacity = verified deposit, escrow on burns.
- **Reputation:** Ratings and response metrics affect visibility.
- **Tiers:** Starter → Platinum with operational benefits.
- **Support:** Handbook, education, dispute process, admin tooling.

### For **merchants**

- **Lower fees:** ~2% collection vs typical card stacks.
- **Instant settlement:** Tokens in settlement wallet on successful payment.
- **Operational portal:** Collections, balances, API keys, webhooks, sandbox, docs—not admin-only views.
- **Hosted checkout:** Customers without your app can pay on the web.
- **Adoption paths:** Documented and verified **Path A** (standard, live on [plugng.shop](https://plugng.shop)) and **Path B** (partner/marketplace, live on [bruthol.com](https://bruthol.com)).

### For **the ecosystem**

- **Regulatory-safe copy:** “Tokens” and “marketplace”; agents as independent facilitators; not a bank.
- **Education:** In-app modules on tokens, agents, value, and safety.
- **Dispute resolution:** Escrow + admin review; agent deposit slashing where rules apply.
- **Auditability:** Ledger in PostgreSQL; blockchain verification for agent deposits and on-chain flows where enabled.

---

## What Makes AfriX Stand Out?

- **Escrow on burns:** Tokens locked until user confirms fiat or dispute process runs.
- **Agent accountability:** USDT security deposit, capacity limits, slashing and suspension paths.
- **Full consumer loop on mobile:** Get tokens → move them → sell back to agents when you need cash.
- **Merchant stack beyond “API only”:** Portal, hosted pay page, webhooks, sandbox, and partner integration surface.
- **Proven partner rail:** Kaalis ↔ AfriExchange dual-platform model for XOF commerce (collections, payouts, signed webhooks; verified on [bruthol.com](https://bruthol.com)).
- **Transparent pricing:** Fees and verification-tier limits surfaced in product and config.
- **Built for Africa:** NT/CT, local payment methods, agents, and bilingual/product considerations in roadmap materials.

---

## Who Can Use It?

- **Individuals:** Register with email; verify email; optional ID for higher limits.
- **Agents:** Pass KYC, meet deposit/training rules, maintain performance standards.
- **Merchants:** Complete merchant onboarding and admin approval; operate via portal and/or API.
- **Admins:** Role-gated web dashboard.
- **Geographies:** Nigeria and XOF markets (e.g. Senegal pilots documented); expansion per product/legal docs.

Restrictions (sanctions, age, jurisdiction) follow platform terms and applicable law.

---

## Tech Stack

| Layer | Technologies |
|--------|---------------|
| **Backend** | Node.js, Express 5, PostgreSQL (Sequelize), Redis (optional), JWT + refresh, rate limiting, Helmet |
| **APIs & auth** | REST `/api/v1`, JWT, 2FA (TOTP), bcrypt; merchant-scoped auth for portal routes |
| **Blockchain** | Polygon (e.g. Amoy testnet), ethers.js, smart contracts; on-chain deposit verification for agents |
| **Storage** | Cloudflare R2 / S3-compatible (KYC, proofs, avatars); Multer uploads with validation |
| **Email & notifications** | Resend, Firebase Cloud Messaging, in-app notification center |
| **Mobile** | Expo (React Native), Expo Router, Zustand, SecureStore, expo-local-authentication (biometrics in dev builds) |
| **Web (admin + merchant + pay)** | Next.js App Router, Tailwind, shadcn-style UI, Axios clients (`lib/api.ts`, `lib/merchant-api.ts`, customer hosted-pay client) |
| **Jobs** | node-cron (e.g. mint/burn expiry, escrow refunds, auto-dispute triggers) |
| **Logging** | Winston; `afriX_backend/logs/` for app/database logs (`npm run logs` in backend) |

**Repo layout:** `afriX_backend`, `afriX-mobile`, `afriX_backend/afrix-web`, `docs/merchant-platform/`, lifecycle docs at repo root. See `readme.md` and `afriX_backend/.env.example` for local run instructions.

---

## Agent Onboarding & KYC at Scale

### Four-step lifecycle

1. **Quick registration (~2 min)** — `POST /agents/register` (country, currency, withdrawal address). Status **PENDING**; no mint/burn yet.
2. **KYC upload (5–10 min)** — ID, selfie, proof of address, optional business doc via `POST /agents/kyc/upload`. Status **UNDER_REVIEW**.
3. **Admin approval** — Dashboard review: approve → verified; reject with reason; resubmit path available.
4. **First deposit (activation)** — Agent sends USDT to treasury, then **`POST /agents/deposit`** with **tx hash + amount** → backend **verifies on-chain** → capacity credited → **ACTIVE**.

### Scale vs quality

- **Self-serve** registration and KYC upload; status API (`GET /agents/kyc/status`); resubmit without re-registering.
- **Admin batch review** with stats (pending KYC, agents, withdrawals).
- **Mobile-guided KYC** (camera/gallery, selfie, address proof).
- **Quality gates:** KYC before activation; deposit verification; human review on disputes.

There is **no automatic treasury sweep** without the agent submitting the transaction hash—the backend verifies the submitted on-chain transfer.

---

## Implementation status (honest snapshot)

Aligned with `PROGRESS - What We Have Built So Far.md` and `afriX_backend/docs/Docs vs Code - Gap Audit.md`:

| Capability | Backend | Web | Mobile |
|------------|---------|-----|--------|
| Auth, 2FA, wallets, P2P, swap | ✅ | — | ✅ |
| Mint / burn / escrow / disputes | ✅ | Admin ops | ✅ |
| Agent register, KYC, deposit, withdrawals | ✅ | Admin | ✅ |
| Merchant register, KYC, payment-request, pay (Path A) | ✅ (Live on plugng.shop) | Portal + `/pay/[id]` | — |
| Kaalis partner integration (Path B) | ✅ (Live on bruthol.com) | ✅ (Admin settings) | — |
| Request tokens from friend | — | — | 🔜 Coming soon |
| Pay merchant (scan QR / in-app) | ✅ | Hosted pay ✅ | 🔜 Coming soon |

**Merchant public launch:** Both **Path A** (standard checkout via **PlugNG Shop** at [plugng.shop](https://plugng.shop)) and **Path B** (partner marketplace integration via **Kaalis Store** at [bruthol.com](https://bruthol.com)) are fully implemented, tested, and working in production.

---

## Summary

| Dimension | AfriX in one line |
|----------|-------------------|
| **What** | P2P token platform (NT, CT, USDT) + agents + merchant settlement (API, portal, hosted pay, partner integrations). |
| **Who** | Users, agents, merchants, ecommerce/marketplace partners, and platform operators. |
| **Why** | Speed, lower cost, 24/7, escrow protection, transparency, and merchant rails without traditional gateway lock-in for every market. |
| **How** | **Mobile** for users/agents; **web** for admin, merchants, and customer checkout; **APIs** for integrations (Path A standard, Path B partner). |

AfriX is built so that **moving value across Africa is as simple, cheap, and safe as we can make it**—for users, agents, merchants, and partner platforms—without being a bank. We provide the platform; you move the value.

---

## Related docs (in this repo)

### Build & alignment

- **[Progress – What We Have Built So Far](PROGRESS%20-%20What%20We%20Have%20Built%20So%20Far.md)** — Backend, admin web, merchant portal, mobile; route and flow inventory.
- **[Docs vs Code – Gap Audit](afriX_backend/docs/Docs%20vs%20Code%20-%20Gap%20Audit.md)** — Documentation vs implementation gaps.
- **[readme.md](readme.md)** — Repo structure, run commands, doc index.

### Lifecycle & operations

- **[Buy & Sell Tokens – Full Lifecycle](Buy%20and%20Sell%20Tokens%20-%20Full%20Lifecycle%20Documentation.md)** — Mint/burn, escrow, timeouts, disputes.
- **[Send, Receive & Swap – Full Lifecycle](Send%2C%20Receive%20and%20Swap%20-%20Full%20Lifecycle%20Documentation.md)** — P2P and swap flows.
- **[Platform Fee Collection – Lifecycle & Admin Guide](Platform%20Fee%20Collection%20-%20Lifecycle%20%26%20Admin%20Guide.md)** — Fee collection behavior for operators.

### Merchant & partner platform (`docs/merchant-platform/`)

- **[Merchant platform README](docs/merchant-platform/README.md)** — Index of all merchant/Kaalis docs.
- **[Dual-platform architecture (Kaalis + AfriExchange)](docs/merchant-platform/KAALIS_AFRIEXCHANGE_DUAL_PLATFORM_ARCHITECTURE.md)** — Why and how partner commerce connects.
- **[Path A – standard integration](docs/merchant-platform/MERCHANT_PATH_A_STANDARD_INTEGRATION.md)** · **[Path A README](docs/merchant-platform/PATH_A_MERCHANT_INTEGRATION_README.md)** · **[Integration guide](docs/merchant-platform/MERCHANT_INTEGRATION_GUIDE.md)**
- **[Path B – marketplace partner](docs/merchant-platform/MERCHANT_PATH_B_PARTNER_MARKETPLACE_INTEGRATION.md)**
- **[Go-public phase gates](docs/merchant-platform/MERCHANT_GO_PUBLIC_PHASE_GATES.md)** · **[Public release phases](docs/merchant-platform/AFRIEXCHANGE_MERCHANT_PUBLIC_RELEASE_PHASES.md)**
- **[External adoption requirements](docs/merchant-platform/AFRIEXCHANGE_MERCHANT_EXTERNAL_ADOPTION_REQUIREMENTS.md)** · **[Token strategy (CT/NT/USDT)](docs/merchant-platform/TOKEN_STRATEGY_NOTE_CT_NT_USDT.md)**

### User, agent & compliance (`afriX_backend/docs/`)

- **[AfriToken User FAQ](afriX_backend/docs/AfriToken%20User%20FAQ.md)** — End-user “how do I…?” reference.
- **[Agent Registration + KYC Flow](afriX_backend/docs/Agent%20Registration%20+%20KYC%20Flow%20-%20Complete%20Guide.md)** · **[Agent Handbook](afriX_backend/docs/AfriToken%20Agent%20Handbook.md)** · **[Agent System](afriX_backend/docs/Agent%20System.md)**
- **[Complete Transaction Flows](afriX_backend/docs/AfriToken%3A%20Complete%20Transaction%20Flows.md)** · **[Merchant Payment System](afriX_backend/docs/AfriToken%20Merchant%20Payment%20System.md)**
- **[Architecture & interdependencies](afriX_backend/docs/Big-picture%3A%20AfriToken%20architecture%20%26%20interdependencies.md)** · **[Regulatory-Safe Terminology](afriX_backend/docs/AfriToken%3A%20Regulatory-Safe%20Terminology%20Guide.md)**

---

**Version:** 2.0  
**Last updated:** May 2026  
**Based on:** `afriX_backend`, `afriX-mobile`, `afriX_backend/afrix-web`, `docs/merchant-platform/`, and root lifecycle/progress docs.
