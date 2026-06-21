# Deployment Guide

## 1. Backend (Render)

### Step 1: Create Database (PostgreSQL)
1. In Render Dashboard, click **New +** -> **PostgreSQL**.
2. **Name**: `afrix-db` (or similar).
3. **Region**: `Frankfurt` (Must match your Backend region so they can talk internally).
4. **Plan**: Free (for testing) or Starter.
5. **Version**: 14+ recommended (User: `afrix_user` or default).
6. **Wait for it to deploy**, then copy the **Internal Database URL** (starts with `postgres://...`).
   - *Note: External Database URL is for connecting from your laptop.*

### Step 2: Create Web Service
Create a new **Web Service** on Render and connect your GitHub repo `Harzkane/AfriX`.

### Configuration Fields
| Field | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `afrix-backend` | Or any name you like |
| **Region** | `Frankfurt` (EU Central) | Or closest to your users (e.g. `Nigeria` if available, otherwise EU is good) |
| **Branch** | `main` | |
| **Root Directory** | `afriX_backend` | **Important:** This tells Render where the backend lives. |
| **Runtime** | `Node` | |
| **Build Command** | `npm install` | Installs dependencies. |
| **Start Command** | `node server.js` | Starts the server. |

### Environment Variables (Critical)
You **MUST** add these in the "Environment" tab on Render. 

#### 1. Database (REQUIRED)
> [!WARNING]
> You mentioned setting up Postgres later, but **the app will crash on startup** without a valid `DATABASE_URL`.
> If you don't have a production DB yet, you can create a managed PostgreSQL on Render (it costs ~$7/mo) or use a free tier on Railway/Neon.
- `DATABASE_URL`: Paste the **Internal Database URL** you copied in Step 1.
- `DB_SSL`: `true`
- `NODE_ENV`: `production`

#### 2. Copy from Local `.env` (Cleaned Up)
Copy these values from your `file.md` / `.env`, but **DO NOT** copy the `localhost` lines.

```bash
# Core
PORT=10000
API_VERSION=v1
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=30d
ADMIN_REGISTRATION_SECRET=your_admin_secret_key_change_this
ENCRYPTION_KEY=914ce4aa815e38e72a2fd4c7aa8c2149792a0463a243aeb30a09682e8e147465

# Blockchain (Polygon)
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_CHAIN_ID=137
POLYGON_TESTNET_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_TESTNET_CHAIN_ID=80002
PRIVATE_KEY=126b7de4e68fcb27191274f22e2001eb9e671fd0c83ab3df0527aea9e8f4330f
TEST_USDT_ADDRESS=0xYourDeployedTokenAddress
TREASURY_WALLET_ADDRESS=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
PLATFORM_PRIVATE_KEY=your_platform_key

# Smart Contract Addresses (Update after deployment)
NT_TOKEN_ADDRESS=0x...
CT_TOKEN_ADDRESS=0x...
ESCROW_CONTRACT_ADDRESS=0x...
AGENT_REGISTRY_ADDRESS=0x...
SWAP_CONTRACT_ADDRESS=0x...

# Cloudflare R2 Storage
R2_ACCOUNT_ID=11c59324aa996dcaa879444ac86cd84e
R2_ACCESS_KEY_ID=2dc98ce38cb4f27f0c9839bf16a50b20
R2_SECRET_ACCESS_KEY=cc777d11f29f8e6e05e45505442e3b698f85ddc4661da0dd4175396f06e3c44d
R2_BUCKET_NAME=afritoken-uploads
R2_PUBLIC_URL=https://pub-738dd2841eaf43f2a5eb5dae20d915d0.r2.dev
R2_ENDPOINT=https://11c59324aa996dcaa879444ac86cd84e.r2.cloudflarestorage.com

# OneSignal (Push Notifications)
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_API_KEY=your-rest-api-key-here

# Firebase Admin SDK
FIREBASE_PROJECT_ID=afrix-notifications
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@afrix-notifications.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n... (Copy full string)

# Email (Nodemailer / Resend)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=harunbah93@gmail.com
EMAIL_PASSWORD=zydv uwhm yppk iyzw
EMAIL_FROM=AfriToken <noreply@afritoken.com>
# RESEND_API_KEY=re_3Gnc2J5k_33AcdwcCiHKRrXykck36HtRH #exonec
RESEND_API_KEY=re_L8BNVsnK_AMQyehCcS1VTJJ4gXtTf2asG #nexgentech.dev
RESEND_FROM=AfriX <hello@nexgentech.dev>
# RESEND_FROM=AfriX <support@exonec.com>

# Business Logic & Fees
P2P_TRANSFER_FEE=0.5
TOKEN_SWAP_FEE=1.5
MERCHANT_COLLECTION_FEE=2.0
AGENT_FACILITATION_FEE=1.0
FEE_COLLECTION_ENABLED=true
PLATFORM_USER_EMAIL=platform@afritoken.com
AGENT_MIN_DEPOSIT_USD=100
AGENT_RECOMMENDED_DEPOSIT_USD=1000
AGENT_PREMIUM_DEPOSIT_USD=2500
AGENT_RATE_DEVIATION_PERCENT=5

# Feature Flags & Limits
ENABLE_WEBSOCKET=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_SMS_VERIFICATION=false
ENABLE_TWO_FACTOR_AUTH=false
ENABLE_KYC=false
REDIS_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
USER_DAILY_LIMIT_BASIC=100
USER_DAILY_LIMIT_VERIFIED=500
USER_DAILY_LIMIT_PREMIUM=2000

# Other
COINGECKO_API_URL=https://api.coingecko.com/api/v3
EDUCATION_REQUIRED=false
EDUCATION_PASS_SCORE=80
TERMINOLOGY_CHECK_ENABLED=true
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
SESSION_SECRET=change_this_session_secret_min_32_chars
CORS_ORIGIN=https://your-vercel-app.vercel.app
CORS_CREDENTIALS=true
```

---

## 2. Frontend (Vercel)
Import your GitHub repo `Harzkane/AfriX` into Vercel.

### Configuration
| Field | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Next.js` | Should auto-detect |
| **Root Directory** | `afrix-web` | Click "Edit" next to Root Directory and select `afrix-web`. |
| **Build Command** | `npm run build` | Default |
| **Output Directory** | `.next` | Default |

### Environment Variables
- `NEXT_PUBLIC_API_URL`: The **URL of your Render backend** (e.g. `https://afrix-backend.onrender.com/api/v1`)
