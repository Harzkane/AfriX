# AfriX Backend

AfriX is a **custodial** hybrid-ledger token-exchange platform. User token balances are recorded in a Postgres database (ledger wallets). Polygon/USDT is used for agent collateral only — end-user wallets are **not** on-chain.

## Architecture

| Layer | Technology |
|---|---|
| Token ledger | Postgres (Sequelize) |
| Agent collateral | Polygon (USDT) |
| Auth | JWT (RS256) + Redis token blacklist |
| Wallet encryption | AES-256-GCM |
| Money arithmetic | decimal.js (`src/utils/money.js`) |

## Running locally

```bash
cp .env.example .env   # fill in secrets
npm install
npm run migrate
npm run dev
```

## Testing

```bash
npm test                            # unit tests (no DB required)
TEST_DATABASE_URL=postgres://... npm test  # + integration race tests
```
