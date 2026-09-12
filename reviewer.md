Me: 
here is our landing page https://afri-x.vercel.app
and a doc files

/Users/harz/Documents/backUps/izmir/AfriExchange/AfriX Platform Overview - Who It's For, What It Solves & Why Use It.md,
/Users/harz/Documents/backUps/izmir/AfriExchange/PROGRESS - What We Have Built So Far.md


Claude:
I've pulled up the landing page and read through both docs — good picture now of AfriX end to end (platform overview, build progress, and the live site).

I don't see a specific ask yet though — what would you like me to do with this? A few things come to mind:

- **Review the landing page copy/positioning** against what's actually built (I noticed a couple of places where the site's language is slightly ahead of or different from the docs — e.g., it says "decentralized/non-custodial" and "smart contract" escrow pretty heavily, while the docs describe a more traditional PostgreSQL ledger + admin-controlled escrow with on-chain verification only for agent deposits)
- **Update your memory file** with anything new from these docs (I can do that now)
- **Draft something** — pitch deck, investor one-pager, CBN sandbox application material, technical documentation cleanup, etc.
- **Something else entirely**

Which direction do you want to go?

Me:
Great.

Claude:
# AfriX — Engineering Architecture, Gaps & Roadmap
*Internal document — engineering reference*
*Compiled from: Platform Overview v2.0, Progress Audit v1.0, and live landing page review*

---

## 1. System Architecture

### 1.1 Repos & surfaces
| Repo/surface | Stack | Role |
|---|---|---|
| `afriX_backend` | Node.js, Express 5, PostgreSQL (Sequelize), Redis (optional) | Canonical API, ledger, business logic, cron jobs |
| `afriX_backend/afrix-web` | Next.js (App Router), Tailwind, shadcn-style UI | Admin dashboard, merchant portal, hosted checkout (`/pay/[id]`) |
| `afriX-mobile` | Expo (React Native), Expo Router, Zustand | End-user and agent-mode consumer app |
| Landing page (`afri-x.vercel.app`) | Next.js/Vercel, separate deploy | Marketing site, calculator, FAQ, docs links |

### 1.2 Data layer
- **Source of truth:** PostgreSQL via Sequelize. `Transaction` is the canonical ledger (type, status, amount, fee, from/to wallet, merchant/agent refs).
- **Cache:** Redis is optional — in-memory fallback if not configured. Worth confirming which environment (staging/prod) currently runs without Redis, since that affects rate-limiting and any cache-dependent logic.
- **Blockchain touchpoint:** Polygon (Amoy testnet referenced), ethers.js. On-chain usage today is narrow and specific — see §3.1.

### 1.3 Core domain flows
- **Mint (buy):** user → agent, `MintRequest` state machine (pending → proof_submitted → confirmed/rejected/expired).
- **Burn (sell):** user → agent, `BurnRequest` + `Escrow` (escrowed → fiat_sent → confirmed/rejected/expired), with dispute escalation on expiry.
- **P2P transfer / swap:** direct wallet-to-wallet debit/credit in Postgres, fee applied per config.
- **Merchant settlement:** Path A (direct API + hosted checkout, live on PlugNG Shop) and Path B (partner/marketplace integration, live on Kaalis Store/bruthol.com) — both settle to a merchant `settlement_wallet_id` inside the same ledger.
- **Payment requests:** `payment-request` API + mobile modals (create → review → share via QR/URL → detail/status → cancel), auto-settles on matching transfer.

### 1.4 Background jobs
- `expireRequests` (every 5 min) is the only job explicitly wired into `server.js`: expires pending mints, refunds expired escrowed burns, opens auto-disputes on expired fiat-sent burns.
- Other job files exist (autoDispute, depositVerification, agentPerformance, transactionCleanup, rateUpdate, educationReminder) but their scheduler wiring is **unconfirmed** — worth an explicit audit of `scheduler.js` to confirm what's actually running versus present-but-inert.

---

## 2. Implementation Status Snapshot

| Capability | Backend | Web | Mobile |
|---|---|---|---|
| Auth, 2FA, wallets, P2P, swap | ✅ | — | ✅ |
| Mint / burn / escrow / disputes | ✅ | Admin ops | ✅ |
| Agent register, KYC, deposit, withdrawals | ✅ | Admin | ✅ |
| Merchant register/KYC/pay (Path A) | ✅ live on plugng.shop | Portal + `/pay/[id]` | Scan-to-pay ✅ |
| Kaalis partner integration (Path B) | ✅ live on bruthol.com | ✅ Admin settings | — |
| Request tokens from contact | ✅ | Hosted pay ✅ | ✅ |
| WebSocket real-time updates | Present (`websocket/`) | Not confirmed in use | Uses polling instead |

Mobile "Receive" flow has no backend call of its own — it's just the display side of another user's transfer. Mobile "Request Tokens" is marked as fully wired end-to-end in the audit, but a "Coming soon" placeholder is also referenced in the mobile home quick-actions — **worth reconciling which is current**, since one doc says shipped and another suggests the entry point may still be gated in the UI.

---

## 3. Gaps & Risks

### 3.1 Marketing copy vs. actual implementation — highest priority to reconcile
The live landing page uses language that goes further than what the backend docs describe. This matters both for engineering honesty internally and for regulatory exposure (CBN sandbox, investor DD) if the two are inconsistent when someone checks under the hood.

| Landing page claims | What the docs describe |
|---|---|
| "Decentralized escrow," "Smart Lock Escrow," "Escrow State Machine" released via smart contract | Escrow is a Postgres-backed state machine (`Escrow` model, `escrowService`) managed by application logic and admin tooling, not an on-chain smart contract |
| "100% Non-Custodial Escrow," "Non-Custodial Infrastructure," "you maintain custody" | Wallet balances are custodial rows in `Wallet`/`Transaction` tables controlled by the backend; admins can credit/debit/freeze wallets directly. This is a centrally-operated ledger, not a non-custodial wallet architecture |
| "Direct Peer-to-Peer On-Chain Settlement" (consumer rails section) | P2P transfer is implemented as a backend wallet transfer (`POST /wallets/transfer`) — no on-chain settlement described for ordinary P2P |
| General smart-contract framing throughout | The only confirmed on-chain path is **agent deposit verification** — agent sends USDT to treasury, submits tx hash, backend verifies via `blockchainService.verifyDeposit`. No automatic treasury sweep or detection without that submission |

**Recommendation:** before this goes in front of a regulator (CBN sandbox) or a technical investor, either (a) tone the landing page down to match reality, or (b) treat closing this gap as a roadmap item and don't submit claims that assume it's already closed. Non-custodial/decentralized-escrow language is a common area regulators specifically probe.

### 3.2 Operational gaps
- **No automatic on-chain deposit detection** — confirmed by design, not a bug, but worth flagging as a manual-dependency/scale risk if agent volume grows (agent must self-report tx hash; no treasury-scanning job).
- **Background job coverage unconfirmed** — several job files exist without confirmed scheduler wiring (see §1.4).
- **Redis optional** — confirm prod behavior without it; rate limiting and dispute/escrow timing logic should be checked for correctness under the in-memory fallback.
- **WebSocket infra present but unused (or unconfirmed)** — mobile uses polling (`useIncomingTransferListener` polls `GET /transactions?limit=1`) for incoming transfers; decide whether to formally deprecate the websocket code or finish wiring it, rather than leaving it in an ambiguous state.
- **Dispute visibility on mobile** — user opens disputes from mint/burn status screens, but it's unclear from the docs whether users see dispute resolution status directly (vs. inferring from activity/transaction state).

### 3.3 Documentation gaps
- Two audit documents exist with different "as of" dates and slightly different structure (Overview v2.0 "May 2026" vs Progress v1.0 "February 2025") — worth confirming which is current before using either as a reference for engineering decisions or external-facing claims.
- No single up-to-date architecture diagram tying together backend/web/mobile/blockchain — this doc's §1 can seed one, but a visual diagram would help onboarding and any technical due-diligence conversation.

---

## 4. Roadmap (suggested, pending prioritization)

**Near-term (fix before external exposure — investors/regulator):**
1. Reconcile landing page claims with actual custody/escrow architecture (§3.1) — either update copy or scope engineering work to match claims.
2. Confirm and document which cron jobs actually run in production (§1.4, §3.2).
3. Resolve the "Request Tokens" shipped-vs-placeholder discrepancy in mobile UI.

**Medium-term:**
4. Decide on WebSocket: finish it for real-time balance/transfer updates, or remove the unused scaffolding.
5. Add a treasury-scanning job (or clearly document the manual-submission model as an intentional design choice, if keeping it).
6. Redis: make caching/rate-limiting behavior explicit and tested under both configurations, or make Redis required in production.

**Longer-term:**
7. If pursuing CBN sandbox (VASP track) or continuing to raise, consider actually building toward the non-custodial/on-chain claims already made publicly, since the gap between marketing and architecture will only get more visible with regulatory or investor scrutiny.
8. Formal architecture diagram + single source-of-truth doc (merge/retire one of the two existing audit docs going forward).

---

*This document is a synthesis of existing internal docs and a live review of the production landing page; it does not replace direct codebase inspection for any item marked "unconfirmed."*


me:
Are you sure about the architecture gaps roadmap?

Here is our AfriExchange (AfriX) — Platform Overview /Users/harz/Documents/backUps/izmir/AfriExchange/AfriX Platform Overview - Who It's For, What It Solves & Why Use It.md?


Claude:
Yes — and this doc is the same one I read before, so let me point to exactly where the gaps come from in the text itself (not something I inferred):

**Ledger is Postgres, not on-chain:**
> "Auditability: Ledger in PostgreSQL; blockchain verification for agent deposits and on-chain flows where enabled."

That's the doc's own words — the ledger of record is a database, and blockchain is scoped narrowly to "agent deposits" plus a vague "on-chain flows where enabled" (enabled where? not specified anywhere else in either doc).

**Blockchain touches one thing specifically — agent deposits:**
> Tech Stack table: "Blockchain — Polygon (e.g. Amoy testnet), ethers.js, smart contracts; **on-chain deposit verification for agents**"
> Agent Onboarding section: "Agent sends USDT to treasury, then submit tx hash and amount → backend verifies on-chain → capacity credited"

Both docs (this Overview and the Progress audit) only ever describe one concrete on-chain interaction: verifying an agent's USDT deposit via a submitted tx hash. Neither doc describes escrow, P2P transfer, mint, or burn as happening on-chain.

**Escrow is application logic, not a smart contract:**
The Progress doc's data model section lists `Escrow` as a Sequelize model with a status field (active/finalized/disputed/refunded), and `escrowService` (lockForBurn, finalizeBurn, refundEscrow) as backend business logic — that's a database row and application code, not a deployed smart contract, even though the landing page calls it "Smart Lock Escrow" with an "Escrow State Machine."

So the gap I flagged isn't a guess — it's the Overview doc's own "honest snapshot" language (its words) sitting next to the landing page's "100% Non-Custodial Escrow" and "Decentralized escrow" claims. Those two things describe different architectures.

If the actual codebase has since added on-chain escrow or non-custodial wallet logic beyond what's in these docs, that would close the gap — but based on what's in front of me, the gap stands. Is there something specific in the doc you think I'm misreading, or has the implementation moved past what these docs describe?