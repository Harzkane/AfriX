# AfriX Security & Production Readiness Audit

## Overall Verdict

> **Not quite production-ready yet — but closer than most.**
> The core architecture is solid. There are 4 critical issues that must be fixed before going live, and several important improvements. Nothing is architectural — all are fixable in a day.

---

## ✅ What's Already Good

| Area | Status |
| :--- | :--- |
| **Helmet.js** security headers | ✅ Enabled globally |
| **CORS** configured from env | ✅ No wildcard in production if env set |
| **Input sanitization** middleware | ✅ Applied globally |
| **Joi validation** on auth routes | ✅ `validateRegistration`, `validateLogin` |
| **JWT authentication** on protected routes | ✅ `authenticate` middleware |
| **Role-based access control** | ✅ `authorize()`, `requireAdmin()` middleware |
| **Admin secret** on `/register-admin` | ✅ Guards admin creation |
| **2FA (TOTP)** support | ✅ Speakeasy implemented |
| **Wallet private key encryption** | ✅ AES-256-CBC |
| **Sequelize transactions** on financial ops | ✅ Atomic debit/credit |
| **Password hashing** | ✅ bcrypt via model hook |
| **Login attempt locking** | ✅ `incrementLoginAttempts` / `isLocked()` |
| **Error messages hidden in production** | ✅ `NODE_ENV` conditional |
| **.env excluded from git** | ✅ In .gitignore |
| **Firebase credentials not in git** | ✅ Confirmed clean |

---

## 🔴 Critical — Fix Before Production

### 1. Hardcoded fallback secrets
Three places fall back to weak placeholder strings if env vars are missing:

```js
// jwt.js
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// authController.js
const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET || "your-super-secret-key";
```

**Risk:** If any env var is missing at deploy time, the app silently runs with a predictable secret — any attacker can forge JWTs.

**Fix:** Throw a fatal error at startup if these are missing:
```js
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
```

---

### 2. No rate limiting on authentication endpoints
`rateLimiter.js` is empty. The `/auth/login`, `/auth/register`, `/auth/forgot-password`, and `/auth/2fa/*` routes have **zero rate limiting**. An attacker can brute-force passwords indefinitely.

**Risk:** Credential stuffing, brute-force attacks, OTP enumeration.

**Fix:** Add `express-rate-limit` to all auth routes. Already used on merchant routes — copy that pattern.

---

### 3. Encrypted private key logged to console in production
```js
// walletService.js line 33
console.log("Encrypted private key:", result);  // 🔴 CRITICAL
// line 54
console.log("Creating wallet with encrypted_private_key:", encryptedPrivateKey); // 🔴 CRITICAL
// line 66
console.log("Wallet created:", wallet.toJSON()); // exposes full wallet row
```

**Risk:** In production (Render), these logs are visible in the Render dashboard. Anyone with dashboard access can extract encrypted private keys from logs.

**Fix:** Remove or gate behind `NODE_ENV === "development"`.

---

### 4. CORS allows wildcard by default
```js
// app.js line 40
origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
```

If `CORS_ORIGIN` is not set in the Render env, the API accepts requests from **any origin** — including malicious websites.

**Fix:** Ensure `CORS_ORIGIN` is set in Render env vars, or make the default fail-closed:
```js
origin: (process.env.CORS_ORIGIN || "").split(",").filter(Boolean),
```

---

## 🟡 Important — Fix Before Launch

### 5. Body size limit is 10MB
```js
app.use(express.json({ limit: "10mb" }));
```
This allows 10MB JSON payloads to hit every endpoint. A bot can exhaust server memory with large uploads.

**Fix:** Reduce to `100kb` globally. Allow larger only on specific file upload endpoints.

---

### 6. No global API rate limiter
Even with per-auth rate limiting added, there is no global limiter protecting all routes from DDoS / endpoint enumeration.

**Fix:** Add a global limiter (e.g. 300 req/15min/IP) in `app.js` before routes.

---

### 7. `JSON.parse` floating point arithmetic on financial amounts
```js
senderWallet.balance = senderBalance - parseFloat(amount);
```
JavaScript floating point arithmetic causes rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). This can create micro-discrepancies in balances over time.

**Fix:** Use Sequelize's `DECIMAL` type (already likely set) and avoid `parseFloat` arithmetic — use `toFixed(8)` or better, the `decimal.js` library for all money math.

---

### 8. Admin registration endpoint is public
`POST /api/v1/auth/register-admin` is publicly accessible — protected only by a secret in the body. While the secret provides a layer of protection, this endpoint should not be publicly routable in production.

**Fix:** Add an IP allowlist middleware or remove the route entirely once initial admin accounts are created.

---

## 🟢 Minor — Polish for Production

| Issue | Fix |
| :--- | :--- |
| `console.log` in `getOrCreateWallet` logs `userId` and wallet data | Gate behind `NODE_ENV === 'development'` |
| `morgan("combined")` logs full request paths in production | Consider log redaction for sensitive query params |
| No request ID / correlation ID in logs | Add `uuid` header per request for traceability |
| JWT refresh token not blacklisted on logout | Add token blacklist or short expiry |

---

## Priority Fix Order

```
1. 🔴 Remove private key console.logs  (walletService.js)
2. 🔴 Add startup check for required env vars  (jwt.js, authController.js)
3. 🔴 Add rate limiting to auth routes  (routes/auth.js)
4. 🔴 Harden CORS default  (app.js)
5. 🟡 Reduce JSON body size limit  (app.js)
6. 🟡 Add global rate limiter  (app.js)
7. 🟡 Restrict /register-admin route  (routes/auth.js)
8. 🟡 Use decimal.js for financial arithmetic
```
