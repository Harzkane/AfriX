❯ npm start

> afrix_backend@1.0.0 start
> node server.js

[dotenv@17.2.3] injecting env (110) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
{"level":"info","message":"ℹ️  Redis is disabled"}
🚀 Starting AfriToken Backend...

📊 Testing database connection...
info: ✅ Database connection established successfully {"timestamp":"2026-02-17T22:53:58.021Z"}
🔧 Initializing database...
✅ Database models synchronized
💾 Redis is disabled (using in-memory cache)

✅ Server running on port 5001
📍 Environment: development
🌐 API Base URL: http://localhost:5001/api/v1
🌐 On network: http://<this-machine-ip>:5001/api/v1
🏥 Health Check: http://localhost:5001/health

📝 Available endpoints:
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - POST /api/v1/auth/verify-email
   - GET  /api/v1/auth/me

🎯 Ready for Postman testing!

GET /api/v1/transactions?limit=1 304 35.630 ms - -
getOrCreateWallet called with: { userId: 'aa00f2e8-6d42-460c-aacb-ccefce3c8d22', token_type: 'NT' }
(node:48833) Warning: Accessing non-existent property 'getOrCreateWallet' of module exports inside circular dependency
(Use `node --trace-warnings ...` to show where the warning was created)
Error: TypeError: walletService.getOrCreateWallet is not a function
    at getPlatformWallets (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/platformService.js:77:46)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async getPlatformWallet (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/platformService.js:95:19)
    at async Object.collectFee (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/platformService.js:119:26)
    at async /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/walletService.js:219:27
    at async /Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/sequelize.js:507:18
    at async transfer (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/controllers/walletController.js:65:22)
POST /api/v1/wallets/transfer 500 31.842 ms - 967
GET /api/v1/transactions?limit=1 304 22.087 ms - -
GET /api/v1/transactions?limit=1 304 16.182 ms - -
GET /api/v1/wallets 304 4.239 ms - -
GET /api/v1/transactions 304 25.139 ms - -
🔍 getUserRequests: UserID=86df0960-a056-4676-94f7-37e70b739b91
GET /api/v1/notifications?page=1&limit=1 304 32.967 ms - -
Error: ApiError: Agent profile not found. Please register as an agent first.
    at requireAgent (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/middleware/agentAuth.js:13:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  status: 403
}
GET /api/v1/agents/profile 403 28.746 ms - 367
🔍 getUserRequests: UserID=86df0960-a056-4676-94f7-37e70b739b91
GET /api/v1/wallets/rates?from=USDT&to=NT 200 13.880 ms - 100
🔍 getUserRequests: Found 5 mint requests
  - MintID: e263e654-6909-4c2d-b113-3bb500025b9c
  - MintID: c78279fb-7673-4141-a97c-4f49b59cf265
  - MintID: 641219a4-bba1-4a81-83af-7ac14a001167
  - MintID: 1a7cbde2-5fa4-44d4-a7ca-b04e97578cb4
  - MintID: 309e32ce-fa37-40f3-9180-181def432d75
🔍 getUserRequests: Found 5 mint requests
  - MintID: e263e654-6909-4c2d-b113-3bb500025b9c
  - MintID: c78279fb-7673-4141-a97c-4f49b59cf265
  - MintID: 641219a4-bba1-4a81-83af-7ac14a001167
  - MintID: 1a7cbde2-5fa4-44d4-a7ca-b04e97578cb4
  - MintID: 309e32ce-fa37-40f3-9180-181def432d75
GET /api/v1/requests/user 304 35.650 ms - -
GET /api/v1/requests/user 304 42.873 ms - -
GET /api/v1/wallets 304 16.935 ms - -
GET /api/v1/transactions 304 16.221 ms - -
Error: ApiError: Agent profile not found. Please register as an agent first.
    at requireAgent (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/middleware/agentAuth.js:13:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  status: 403
}
GET /api/v1/agents/profile 403 14.452 ms - 367
🔍 getUserRequests: UserID=86df0960-a056-4676-94f7-37e70b739b91
🔍 getUserRequests: UserID=86df0960-a056-4676-94f7-37e70b739b91
🔍 getUserRequests: Found 5 mint requests
  - MintID: e263e654-6909-4c2d-b113-3bb500025b9c
  - MintID: c78279fb-7673-4141-a97c-4f49b59cf265
  - MintID: 641219a4-bba1-4a81-83af-7ac14a001167
  - MintID: 1a7cbde2-5fa4-44d4-a7ca-b04e97578cb4
  - MintID: 309e32ce-fa37-40f3-9180-181def432d75
GET /api/v1/wallets/rates?from=USDT&to=NT 200 18.251 ms - 100
🔍 getUserRequests: Found 5 mint requests
  - MintID: e263e654-6909-4c2d-b113-3bb500025b9c
  - MintID: c78279fb-7673-4141-a97c-4f49b59cf265
  - MintID: 641219a4-bba1-4a81-83af-7ac14a001167
  - MintID: 1a7cbde2-5fa4-44d4-a7ca-b04e97578cb4
  - MintID: 309e32ce-fa37-40f3-9180-181def432d75
GET /api/v1/requests/user 304 29.013 ms - -
GET /api/v1/notifications?page=1&limit=1 304 26.648 ms - -
GET /api/v1/requests/user 304 31.288 ms - -
GET /api/v1/transactions?limit=1 304 26.200 ms - -
GET /api/v1/wallets/rates?from=USDT&to=CT 200 3.721 ms - 99
GET /api/v1/wallets/rates?from=USDT&to=CT 200 3.712 ms - 99
GET /api/v1/transactions?limit=1 304 12.010 ms - -
GET /api/v1/wallets/rates?from=NT&to=CT 200 6.364 ms - 98
GET /api/v1/transactions?limit=1 304 15.184 ms - -
GET /api/v1/transactions?limit=1 304 13.591 ms - -
getOrCreateWallet called with: { userId: '86df0960-a056-4676-94f7-37e70b739b91', token_type: 'NT' }
getOrCreateWallet called with: { userId: '86df0960-a056-4676-94f7-37e70b739b91', token_type: 'CT' }
(node:48833) Warning: Accessing non-existent property 'getOrCreateWallet' of module exports inside circular dependency
Error: TypeError: walletService.getOrCreateWallet is not a function
    at getPlatformWallets (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/platformService.js:77:46)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async getPlatformWallet (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/platformService.js:95:19)
    at async Object.collectFee (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/platformService.js:119:26)
    at async /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/walletService.js:297:27
    at async /Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/sequelize.js:507:18
    at async swap (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/controllers/walletController.js:188:22)
POST /api/v1/wallets/swap 500 15.755 ms - 964
GET /api/v1/transactions?limit=1 304 8.152 ms - -
