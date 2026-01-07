# AfriToken Backend File Structure (Updated)

```
/Users/harz/AfriExchange/afriX_backend/
│
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection config
│   │   ├── redis.js             # Redis client setup
│   │   ├── blockchain.js        # Web3/Ethers.js configuration
│   │   ├── cloudflare.js        # Cloudflare R2 storage config
│   │   └── constants.js         # App-wide constants & terminology
│   │
│   ├── models/
│   │   ├── User.js              # User model (profile, not account)
│   │   ├── Wallet.js            # Token wallet model
│   │   ├── Transaction.js       # Token transaction model
│   │   ├── Agent.js             # Independent agent model
│   │   ├── MintingTransaction.js  # Token acquisition records
│   │   ├── BurningTransaction.js  # Token exchange records
│   │   ├── Dispute.js           # Dispute resolution records
│   │   ├── AgentCapacityLog.js  # Agent capacity history
│   │   ├── ExchangeRate.js      # Platform-set daily rates
│   │   └── EducationProgress.js # User education tracking
│   │
│   ├── controllers/
│   │   ├── authController.js    # Registration, login, verification
│   │   ├── userController.js    # User profile management
│   │   ├── walletController.js  # Token wallet operations
│   │   ├── transactionController.js  # Token transfers & swaps
│   │   ├── mintController.js    # Token acquisition from agents
│   │   ├── burnController.js    # Token exchange with agents
│   │   ├── agentController.js   # Agent operations
│   │   ├── disputeController.js # Dispute management
│   │   ├── rateController.js    # Exchange rate queries
│   │   └── educationController.js # User education modules
│   │
│   ├── services/
│   │   ├── authService.js       # Auth business logic
│   │   ├── blockchainService.js # Blockchain interactions
│   │   ├── emailService.js      # Email notifications
│   │   ├── notificationService.js # Push/SMS notifications
│   │   ├── agentMatchingService.js # Agent selection algorithm
│   │   ├── disputeService.js    # Dispute resolution logic
│   │   ├── analyticsService.js  # Analytics tracking
│   │   ├── rateService.js       # Exchange rate management
│   │   ├── storageService.js    # Cloudflare R2 operations
│   │   ├── educationService.js  # User education & onboarding
│   │   └── terminologyService.js # Regulatory terminology enforcement
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── validation.js        # Request validation (terminology-aware)
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── logger.js            # Request logging
│   │   └── terminologyChecker.js # Response terminology validation
│   │
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── users.js             # User profile routes
│   │   ├── wallets.js           # Token wallet routes
│   │   ├── transactions.js      # Token transaction routes
│   │   ├── agents.js            # Agent routes
│   │   ├── disputes.js          # Dispute routes
│   │   ├── rates.js             # Exchange rate routes
│   │   └── education.js         # User education routes
│   │
│   ├── utils/
│   │   ├── jwt.js               # JWT helpers
│   │   ├── validation.js        # Validation helpers
│   │   ├── encryption.js        # Encryption utilities
│   │   ├── qrcode.js            # QR code generation
│   │   ├── terminology.js       # Approved/prohibited terms
│   │   └── helpers.js           # General utilities
│   │
│   ├── jobs/
│   │   ├── rateUpdateJob.js     # Platform sets daily exchange rates
│   │   ├── transactionCleanupJob.js # Cleanup stale transactions
│   │   ├── agentPerformanceJob.js # Calculate agent metrics
│   │   ├── depositVerificationJob.js # Verify agent deposits
│   │   ├── autoDisputeJob.js    # Auto-escalate unconfirmed exchanges
│   │   └── educationReminderJob.js # Nudge incomplete education
│   │
│   ├── websocket/
│   │   ├── server.js            # WebSocket server setup
│   │   └── handlers.js          # WebSocket event handlers
│   │
│   └── app.js                   # Express app setup
│
├── migrations/                   # Database migrations
│   ├── 001-create-users.js
│   ├── 002-create-wallets.js
│   ├── 003-create-transactions.js
│   ├── 004-create-agents.js
│   ├── 005-create-exchange-rates.js
│   ├── 006-create-education-progress.js
│   └── ...
│
├── seeders/                      # Database seeders
│   ├── demo-users.js
│   ├── demo-agents.js
│   └── education-modules.js
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── utils/
│   │   └── terminology.test.js  # Test terminology enforcement
│   ├── integration/
│   │   └── api/
│   └── setup.js
│
├── docs/
│   ├── terminology-guide.md     # Regulatory terminology reference
│   ├── api-docs.md              # API documentation
│   └── education-content.md     # User education materials
│
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js                     # Entry point
```

---

## Tech Stack (Updated)

- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis
- **Blockchain**: Ethers.js (Polygon)
- **Storage**: Cloudflare R2 (S3-compatible API)
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **WebSocket**: Socket.io
- **Job Queue**: node-cron
- **Email**: Nodemailer
- **SMS**: Twilio
- **Monitoring**: Winston logger + Sentry

---

## Key Updates & Rationale

### 1. Cloudflare R2 Instead of AWS S3
**Benefits**:
- Zero egress fees (AWS charges for downloads)
- S3-compatible API (easy migration if needed)
- Better pricing for African markets
- Integrated with Cloudflare CDN

**Implementation**:
- New `src/config/cloudflare.js` for R2 setup
- `storageService.js` uses S3-compatible SDK
- Environment variables updated for R2

### 2. Lower Agent Deposit ($500-$1K)
**Changes**:
- Minimum deposit: $500 USDT (down from $5,000)
- Recommended: $1,000 USDT (down from $10,000)
- Capacity tiers:
  - Starter: $500 deposit → $500 minting capacity
  - Standard: $1,000 deposit → $1,000 minting capacity
  - Premium: $2,500+ deposit → Higher capacity + perks

**Why This Helps**:
- Lowers barrier to entry for agents
- Faster agent network growth
- More agents = better liquidity
- Risk mitigated by escrow protection

### 3. Platform Sets Exchange Rates Daily
**Implementation**:
- `rateUpdateJob.js` runs daily at 6 AM WAT
- Fetches crypto prices from CoinGecko/CoinMarketCap
- Calculates NT/NGN, CT/XOF reference rates
- Stores in `ExchangeRate` model with timestamp
- Agents can still set their own rates within ±5% of platform rate

**Benefits**:
- Consistent reference point for users
- Prevents extreme agent rate manipulation
- Transparent rate discovery
- Historical rate tracking for audits

### 4. Extended Escrow Timer (2 Hours)
**Changed from 30 minutes to 2 hours**:
- Users have 2 hours to confirm fiat receipt
- Agent has 2 hours to send fiat after accepting
- Auto-dispute triggers if:
  - User doesn't confirm after 2 hours
  - Agent doesn't send after 2 hours
- Gives breathing room for mobile money delays

**Smart Contract Update**:
```solidity
uint256 public constant ESCROW_TIMEOUT = 2 hours; // Was 30 minutes
```

### 5. User Education System
**New Components**:
- `educationController.js`: Manage education modules
- `educationService.js`: Track user progress
- `EducationProgress` model: Store completion status

**Education Modules**:
1. **"What Are Tokens?"** (Required before first acquisition)
   - Explains NT/CT are digital assets, not Naira/CFA
   - Interactive quiz to confirm understanding
   - Must score 80% to proceed

2. **"How Agents Work"** (Required before first exchange)
   - Agents are independent facilitators
   - Escrow protection explained
   - What to do if issues arise

3. **"Understanding Value"** (Optional, recommended)
   - Token reference rates vs actual exchange rates
   - How agent rates may vary
   - Platform fee structure

4. **"Safety & Security"** (Optional, recommended)
   - How to spot scams
   - Verifying agent profiles
   - Dispute process overview

**Implementation**:
```javascript
// Check education completion before allowing actions
if (!user.completedEducation.whatAreTokens) {
  return res.status(403).json({
    error: 'Please complete "What Are Tokens?" education module first',
    educationRequired: 'whatAreTokens'
  });
}
```

### 6. Terminology Enforcement
**New Utils**:
- `terminology.js`: Approved/prohibited terms lists
- `terminologyChecker.js` middleware: Scans API responses
- `terminologyService.js`: Validation helpers

**How It Works**:
```javascript
// Middleware scans all API responses
app.use(terminologyChecker);

// Logs warnings if prohibited terms detected
// Example: "payment" → Warning logged, suggest "token transfer"
// Helps developers catch terminology issues during development
```

**Approved Terms Reference**:
- ✅ "token transfer" (not "payment")
- ✅ "acquire tokens" (not "deposit money")
- ✅ "exchange tokens" (not "withdraw cash")
- ✅ "token wallet" (not "bank account")
- ✅ "platform fee" (not "transaction charge")

---

## Environment Variables (.env) - UPDATED

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/afritoken
DB_HOST=localhost
DB_PORT=5432
DB_NAME=afritoken
DB_USER=your_user
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=30d

# Blockchain (Polygon)
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_CHAIN_ID=137
POLYGON_TESTNET_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_TESTNET_CHAIN_ID=80001

# Smart Contract Addresses (Update after deployment)
NT_TOKEN_ADDRESS=0x...
CT_TOKEN_ADDRESS=0x...
ESCROW_CONTRACT_ADDRESS=0x...
AGENT_REGISTRY_ADDRESS=0x...
SWAP_CONTRACT_ADDRESS=0x...

# Platform Wallet (Hot wallet for gas fees)
PLATFORM_PRIVATE_KEY=0x...
PLATFORM_ADDRESS=0x...

# Cloudflare R2 (Replaces AWS S3)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=afritoken-uploads
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Email (Nodemailer + Gmail or SendGrid)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@afritoken.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=AfriToken <noreply@afritoken.com>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000,https://afritoken.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# CoinGecko API (for exchange rates)
COINGECKO_API_KEY=your_api_key_optional

# Agent Configuration (NEW)
AGENT_MIN_DEPOSIT_USD=500
AGENT_RECOMMENDED_DEPOSIT_USD=1000
AGENT_RATE_DEVIATION_PERCENT=5  # Max ±5% from platform rate

# Escrow Configuration (NEW)
ESCROW_TIMEOUT_HOURS=2  # Changed from 0.5 hours (30 min)
AUTO_DISPUTE_DELAY_HOURS=2

# Education Configuration (NEW)
EDUCATION_REQUIRED=true
EDUCATION_PASS_SCORE=80  # Must score 80% on quizzes

# Terminology Enforcement (NEW)
TERMINOLOGY_CHECK_ENABLED=true
TERMINOLOGY_LOG_WARNINGS=true
```

---

## New Database Tables

### ExchangeRate Table
```javascript
// stores platform-set daily rates
{
  id: UUID,
  fromToken: 'NT' | 'CT' | 'USDT',
  toToken: 'NT' | 'CT' | 'USDT',
  rate: DECIMAL(18, 8),
  effectiveDate: DATE,
  source: 'PLATFORM' | 'AGENT',  // Platform sets, agents can override
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

### EducationProgress Table
```javascript
// tracks user education completion
{
  id: UUID,
  userId: UUID (FK to Users),
  moduleName: STRING,  // 'whatAreTokens', 'howAgentsWork', etc.
  completed: BOOLEAN,
  score: INTEGER,  // Quiz score (0-100)
  attempts: INTEGER,
  completedAt: TIMESTAMP,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

---

## Package.json Dependencies (Updated)

```bash
npm install express pg sequelize redis ioredis ethers jsonwebtoken bcryptjs joi dotenv cors helmet morgan winston socket.io node-cron nodemailer twilio @aws-sdk/client-s3 @aws-sdk/lib-storage axios

# @aws-sdk works with Cloudflare R2 (S3-compatible)

npm install --save-dev nodemon jest supertest eslint
```

---

## Terminology Utility Example

**File: `/Users/harz/AfriExchange/afriX_backend/src/utils/terminology.js`**

```javascript
/**
 * Regulatory-Safe Terminology
 * 
 * CRITICAL: All API responses, error messages, and UI text MUST use
 * approved terminology to avoid financial services classification.
 */

const APPROVED_TERMS = {
  // Core Platform Terms
  platform: ['platform', 'marketplace', 'exchange', 'swap'],
  
  // Token Terms (USE THESE)
  tokens: ['token', 'digital asset', 'NT', 'CT', 'USDT', 'balance', 'value'],
  
  // User Actions (USE THESE)
  actions: ['acquire', 'obtain', 'send', 'receive', 'transfer', 'exchange', 'swap', 'convert'],
  
  // User Management (USE THESE)
  users: ['profile', 'wallet', 'address', 'user', 'participant', 'member'],
  
  // Agent Terms (USE THESE)
  agents: ['agent', 'facilitator', 'service provider', 'liquidity provider'],
  
  // Transaction Terms (USE THESE)
  transactions: ['transaction', 'activity', 'record', 'history', 'confirmation'],
  
  // Fee Terms (USE THESE)
  fees: ['platform fee', 'service fee', 'network fee', 'transaction fee']
};

const PROHIBITED_TERMS = {
  // Banking & Financial (NEVER USE)
  banking: ['bank', 'banking', 'account', 'financial service', 'financial institution'],
  
  // Money & Currency (NEVER USE)
  money: ['money', 'currency', 'cash', 'funds', 'capital', 'legal tender'],
  
  // Payment (NEVER USE)
  payment: ['payment', 'pay', 'remittance', 'send money', 'receive payment'],
  
  // Deposits & Withdrawals (NEVER USE)
  banking_actions: ['deposit', 'withdraw', 'withdrawal', 'cash out', 'top up', 'load money'],
  
  // Investment (NEVER USE)
  investment: ['investment', 'invest', 'return', 'profit', 'interest', 'yield', 'dividend'],
  
  // Credit (NEVER USE)
  credit: ['loan', 'lend', 'borrow', 'credit', 'debt'],
  
  // Regulatory Claims (NEVER USE)
  regulatory: ['licensed', 'regulated', 'approved', 'insured', 'guaranteed']
};

// Safe replacements
const TERM_REPLACEMENTS = {
  'payment': 'token transfer',
  'deposit': 'acquire tokens',
  'withdraw': 'exchange tokens',
  'money': 'tokens',
  'account': 'profile',
  'bank account': 'wallet'
};

module.exports = {
  APPROVED_TERMS,
  PROHIBITED_TERMS,
  TERM_REPLACEMENTS
};
```

---

## Education Module Content Example

**File: `/Users/harz/AfriExchange/afriX_backend/docs/education-content.md`**

```markdown
# Module 1: What Are Tokens?

## Introduction (Simple Language)
Tokens are like digital vouchers that represent value. Think of them like mobile phone credit - you buy credit, use it, but it's not actual cash.

## Key Points
1. **NT and CT are tokens** - They're digital assets on a blockchain, not Nigerian Naira or CFA Francs
2. **Reference rates** - 1 NT is designed to be roughly equal to 1 Naira for easy understanding, but it's NOT the same thing
3. **You can exchange** - Trade tokens with other users or with agents who convert them to/from fiat
4. **Protected by blockchain** - All transactions are secured by smart contracts

## Interactive Quiz (Must score 80%)
1. What are NT tokens?
   a) Nigerian Naira stored digitally ❌
   b) Digital assets that reference Naira value ✅
   c) A type of mobile money ❌

2. Can you use NT tokens to buy things at any Nigerian store?
   a) Yes, everywhere accepts them ❌
   b) Only at AfriToken partner stores ❌
   c) Only by exchanging with someone who wants tokens ✅

3. What protects your tokens when exchanging with an agent?
   a) Government insurance ❌
   b) Smart contract escrow ✅
   c) The agent's promise ❌

[Continue with 7 more questions...]
```

---

## Next Steps - Ready to Code! 🚀

Now we have a **regulatory-safe, user-friendly** architecture. Let's start building:

### Phase 1: Foundation (Choose Your Path)

**Option A: Database First** (Recommended)
1. Set up PostgreSQL connection
2. Create User and Wallet models
3. Create authentication endpoints
4. Test with Postman

**Option B: Terminology System First** (Unique to this project)
1. Build terminology utility
2. Create terminology checker middleware
3. Set up response validation
4. Document approved terms

**Option C: Education System First** (User-focused)
1. Create education modules
2. Build progress tracking
3. Design quiz system
4. Integrate with auth flow

Which would you like to start with? I'm ready to write complete, production-ready code for whichever you choose! 💪