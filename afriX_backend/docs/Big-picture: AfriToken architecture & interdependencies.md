# Big-picture: AfriToken architecture & interdependencies

I'll describe the actors, data models, flows, and how services/controllers interact — in a way you can use as an implementation reference.

## Actors (who/what)

- **User** — platform profile (login, verification, preferences). A user can be:

  - Normal consumer (payer / receiver)
  - Merchant (business profile linked to a user)
  - Agent (facilitates mint/burn)
  - Admin

- **Wallet** — per-user, per-token account (NT, CT, USDT). Tracks `balance`, `pending_balance`, `blockchain_address`, etc. Virtual `available_balance` = balance - pending_balance.
- **Merchant** — business entity tied to a User. Contains `settlement_wallet_id` which points to a Wallet receiving merchant collections.
- **Agent** (planned) — independent operator with deposit/capacity to mint/burn tokens. Tracks deposit, capacity, tier, status, etc.
- **Transaction** — canonical ledger record for every value movement (transfer, swap, mint, burn, merchant collection). This is the core model.
- **Services** — business logic implemented in service files (merchantService, paymentVerificationService, commissionService, etc.)
- **Controllers & Routes** — HTTP layer mapping endpoints to operations.

---

## Key Data Models & Relationships

- **User**

  - has many Wallets (`wallets.user_id`)
  - has optional Merchant (`merchants.user_id`)
  - may have Agent profile (if implemented)

- **Wallet**

  - belongs to User
  - unique per (user_id, token_type)
  - used as `from_wallet_id` / `to_wallet_id` in Transactions

- **Merchant**

  - belongs to User (merchant owner)
  - has `settlement_wallet_id` pointing to a Wallet (where merchant receives funds)

- **Transaction** (core)

  - fields: `id`, `reference`, `type`, `status`, `amount`, `fee`, `currency` (token type), `description`, `metadata` (json)
  - references:

    - `from_user_id` (payer)
    - `to_user_id` (receiver)
    - `merchant_id` (if merchant collection)
    - `agent_id` (if agent involved)
    - `from_wallet_id`, `to_wallet_id`

  - optional blockchain fields: `tx_hash`, `block_number`, `network`, `gas_fee`, `processed_at`
  - `created_at`, `updated_at` timestamps

---

## Core flows (step-by-step)

### A — User-to-user transfer (P2P)

1. User A initiates transfer to User B (recipient address or email).
2. Validate input (token type, recipient).
3. Check `Wallet.getUserWallet(userA, tokenType)` and `hasSufficientBalance`.
4. Create Transaction with `type: TRANSFER`, `status: COMPLETED` (or PENDING if on-chain confirmation required).
5. Update wallets: decrement sender.balance (or move to pending), increment receiver.balance after confirmation.
6. Update `Wallet.total_sent`, `total_received`, `transaction_count`.
7. Send notification/email.

### B — Merchant collection (Customer → Merchant)

1. Merchant creates payment request (creates a pending COLLECTION transaction).
2. Customer selects merchant and confirms payment via `/payments/process` with `merchant_id`, `amount`, `currency`.
3. Validate currency (use `TOKEN_TYPES`), ensure user wallet exists and has balance.
4. Create transaction record (COLLECTION), compute fee, net amount.
5. Update sender and merchant wallets (debit sender, credit merchant settlement wallet).
6. Optionally send webhook to merchant (`merchant.webhook_url`) and notify both parties.

### C — Agent mint (User buys tokens from agent)

1. User requests mint; agent receives request.
2. User pays fiat to agent off-chain.
3. Agent confirms payment; system mints tokens to user wallet (create MINT transaction).
4. Agent’s capacity decreases by amount minted; agent deposit backing adjusts.
5. Transaction status becomes COMPLETED.

### D — Agent burn (User sells tokens to agent)

1. User sends tokens to escrow wallet (transaction PENDING).
2. Agent sends fiat to user off-chain and confirms.
3. System burns tokens (BURN transaction), increases agent capacity.
4. If dispute arises, admin resolves using proofs; deposit slashing possible.

### E — Swap (Token A ↔ Token B)

1. User initiates swap (SWAP transaction).
2. System calculates rate and fee; optionally interacts with on-chain DEX or internal match engine.
3. Tokens are debited/credited to user wallets accordingly.

---

## Services & Cross-cutting concerns

- **paymentVerificationService** — verify transaction status by id or merchant reference; send merchant webhook notifications.
- **commissionService** — compute agent/ platform commissions and fee splits.
- **merchantService** — merchant registration, QR generation, payment request creation.
- **emailService** — send verification, reset and transaction receipts.

**Common concerns**:

- **Caching**: user and wallet data cached (getCache / setCache).
- **Validation**: input validated centrally (Joi or express-validator combos).
- **Errors**: use `ApiError` or `ValidationError` consistently, with HTTP_STATUS codes.

---

## Why `Transaction` is the core model

- Everything that modifies value is recorded as a Transaction — this is your source of truth for auditing, webhooks, disputes, reporting, and reconciliation.
- Agents and Merchants both reference transactions. Adding `merchant_id` and `agent_id` fields prevents special-case handling later.
- Blockchain sync and off-chain events can both create/update Transaction rows, enabling an accurate ledger.
