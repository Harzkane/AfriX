# AfriToken API - Postman Testing Guide

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/harz/AfriExchange/afriX_backend
npm install
```

### 2. Create .env file

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` and set at minimum:

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=afritoken
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_key_change_this_min_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this_min_32_characters

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (optional for now)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 4. Start PostgreSQL and Redis

```bash
# PostgreSQL
brew services start postgresql
# or
sudo systemctl start postgresql

# Redis
brew services start redis
# or
sudo systemctl start redis
```

### 5. Create Database

```bash
createdb afritoken
```

### 6. Start Server

```bash
npm run dev
```

You should see:

```
✅ Database connection established successfully
✅ Database models synchronized
✅ Redis connection test successful
✅ Server running on port 5000
```

---

## Postman Collection

### Base URL

```
http://localhost:5000/api/v1
```

---

## 1. Health Check

**Endpoint:** `GET /health`

**Description:** Check if API is running

**Request:**

```http
GET http://localhost:5000/health
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "AfriToken API is running",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "environment": "development"
}
```

---

## 2. Register New User

**Endpoint:** `POST /api/v1/auth/register`

**Description:** Create a new user profile (regulatory-safe terminology)

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "country_code": "NG",
  "language": "en"
}
```

**Expected Response (201 Created):**

```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "country_code": "NG",
      "role": "user",
      "email_verified": false,
      "verification_level": 0,
      "language": "en",
      "theme": "nigeria",
      "referral_code": "ABC12345",
      "created_at": "2025-10-23T10:30:00.000Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": "24h"
    }
  },
  "education_reminder": {
    "message": "Tokens are digital assets that represent value on our platform, not actual currency",
    "required_before_exchange": true
  }
}
```

**Test Variations:**

1. **Missing required field:**

```json
{
  "email": "test@example.com",
  "password": "SecurePass123"
  // Missing full_name and country_code
}
```

Expected: 400 Bad Request

2. **Weak password:**

```json
{
  "email": "test@example.com",
  "password": "weak",
  "full_name": "Test User",
  "country_code": "NG"
}
```

Expected: 400 Bad Request with message about password requirements

3. **Duplicate email:**
   Register same email twice. Second attempt should return 409 Conflict.

4. **French-speaking user (XOF country):**

```json
{
  "email": "marie@example.com",
  "password": "SecurePass123",
  "full_name": "Marie Diop",
  "country_code": "SN",
  "language": "fr"
}
```

---

## 3. Login User

**Endpoint:** `POST /api/v1/auth/login`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "country_code": "NG",
      "role": "user",
      "email_verified": false,
      "last_login_at": "2025-10-23T10:35:00.000Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": "24h"
    }
  }
}
```

**Test Variations:**

1. **Wrong password:**

```json
{
  "email": "john.doe@example.com",
  "password": "WrongPassword123"
}
```

Expected: 401 Unauthorized

2. **Non-existent email:**

```json
{
  "email": "nonexistent@example.com",
  "password": "SecurePass123"
}
```

Expected: 401 Unauthorized

3. **Multiple failed attempts (5+ times):**
   After 5 failed login attempts, the profile should be locked temporarily.
   Expected: 403 Forbidden with "Profile temporarily locked" message

---

## 4. Get Current User Profile

**Endpoint:** `GET /api/v1/auth/me`

**Description:** Get authenticated user's profile information

**Headers:**

```
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Request:**

```http
GET http://localhost:5000/api/v1/auth/me
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "country_code": "NG",
      "role": "user",
      "email_verified": false,
      "phone_verified": false,
      "identity_verified": false,
      "verification_level": 0,
      "language": "en",
      "theme": "nigeria",
      "education_what_are_tokens": false,
      "education_how_agents_work": false,
      "referral_code": "ABC12345",
      "is_active": true,
      "created_at": "2025-10-23T10:30:00.000Z",
      "updated_at": "2025-10-23T10:35:00.000Z"
    }
  }
}
```

**Test Variations:**

1. **No token provided:**
   Expected: 401 Unauthorized

2. **Invalid token:**

```
Authorization: Bearer invalid_token_here
```

Expected: 401 Unauthorized

3. **Expired token:**
   Wait for token to expire (or manually set short expiry in .env)
   Expected: 401 Unauthorized

---

## 5. Verify Email

**Endpoint:** `POST /api/v1/auth/verify-email`

**Description:** Verify user's email with token sent via email

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "token": "the_verification_token_from_email"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "verification_level": 1
  }
}
```

**How to Test:**

1. Register a new user
2. Check your PostgreSQL database for the verification token:

```sql
SELECT email_verification_token FROM users WHERE email = 'john.doe@example.com';
```

3. Use that token in the request above

**Test Variations:**

1. **Invalid token:**

```json
{
  "token": "invalid_token_123"
}
```

Expected: 400 Bad Request

2. **Expired token:**
   Manually update the token expiry in database to past date, then try to verify.
   Expected: 400 Bad Request

---

## 6. Resend Verification Email

**Endpoint:** `POST /api/v1/auth/resend-verification`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Note:** For security, this endpoint always returns 200 OK even if email doesn't exist.

---

## 7. Forgot Password

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "If this email exists, a password reset link has been sent"
}
```

---

## 8. Reset Password

**Endpoint:** `POST /api/v1/auth/reset-password`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "token": "password_reset_token_from_email",
  "new_password": "NewSecurePass123"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**How to Get Reset Token:**

```sql
SELECT password_reset_token FROM users WHERE email = 'john.doe@example.com';
```

---

## 9. Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Request:**

```http
POST http://localhost:5000/api/v1/auth/logout
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Testing Flow

### Complete User Registration & Login Flow

1. **Register new user** → Save access_token
2. **Login with credentials** → Verify token works
3. **Get user profile** (use token from step 2)
4. **Verify email** (get token from database)
5. **Get user profile again** → verification_level should be 1
6. **Logout**

---

## Database Queries for Testing

### View all users

```sql
SELECT id, email, full_name, email_verified, verification_level, created_at
FROM users;
```

### Get user with wallets (once we create wallet system)

```sql
SELECT u.email, u.full_name, w.token_type, w.balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id;
```

### Clear all users (for clean testing)

```sql
DELETE FROM users;
```

### Get verification token

```sql
SELECT email, email_verification_token, email_verification_expires
FROM users
WHERE email = 'john.doe@example.com';
```

---

## Common Issues & Solutions

### Issue 1: "Database connection failed"

**Solution:**

- Check PostgreSQL is running: `pg_isready`
- Verify credentials in .env match your PostgreSQL setup
- Ensure database exists: `psql -l | grep afritoken`

### Issue 2: "Redis connection failed"

**Solution:**

- Check Redis is running: `redis-cli ping` (should return PONG)
- Verify Redis port in .env (default: 6379)

### Issue 3: "Email not sending"

**Solution:**

- Check email configuration in .env
- For Gmail, you need an "App Password" not regular password
- Set `SKIP_EMAIL_VERIFICATION=true` in .env for testing

### Issue 4: "Token expired"

**Solution:**

- Login again to get fresh token
- Or increase JWT_EXPIRE in .env to something like "7d"

---

## Next Steps

After testing authentication successfully:

1. ✅ User registration works
2. ✅ Login/logout works
3. ✅ Email verification works
4. ✅ Profile retrieval works

Next we'll build:

- Wallet creation (automatic on registration)
- Wallet balance queries
- Token transfers (P2P)
- Token swaps
- Agent minting system
- Agent burning with escrow

---

## Postman Environment Variables

Create a Postman environment with these variables:

| Variable           | Initial Value                | Current Value       |
| ------------------ | ---------------------------- | ------------------- |
| base_url           | http://localhost:5000/api/v1 |                     |
| access_token       |                              | {set after login}   |
| refresh_token      |                              | {set after login}   |
| user_id            |                              | {set after login}   |
| verification_token |                              | {get from database} |

**Auto-set token after login:**

In Postman, add this to the "Tests" tab of your login request:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("access_token", response.data.tokens.access_token);
  pm.environment.set("refresh_token", response.data.tokens.refresh_token);
  pm.environment.set("user_id", response.data.user.id);
}
```

Then use `{{access_token}}` in Authorization headers automatically!

---

## Success Checklist

- [ ] Health endpoint returns 200 OK
- [ ] Can register new user with valid data
- [ ] Registration fails with weak password
- [ ] Registration fails with duplicate email
- [ ] Can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Can get current user profile with valid token
- [ ] Get profile fails without token
- [ ] Can verify email with valid token
- [ ] Can logout successfully

Once all these pass, you're ready for the next phase! 🎉
