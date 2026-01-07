<!-- // terminology-guide.md -->

# AfriToken Backend

Peer-to-peer token exchange platform connecting Nigeria and XOF countries.

## Tech Stack

- Node.js + Express
- PostgreSQL + Sequelize
- Redis
- Ethereum/Polygon (Ethers.js)
- Cloudflare R2

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Create database: `createdb afritoken`
4. Run migrations: `npm run migrate`
5. Start development server: `npm run dev`

## Terminology Note

This platform uses regulatory-safe terminology:

- ✅ "tokens" not "money"
- ✅ "transfer" not "payment"
- ✅ "acquire" not "deposit"
- ✅ "exchange" not "withdraw"

See `docs/terminology-guide.md` for complete reference.
