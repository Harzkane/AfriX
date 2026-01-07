# Admin Education & Security Management - Testing Guide

## 🎯 Overview

Admin now has **complete control** over:

- **Education monitoring** - Track user completion rates
- **Security monitoring** - Monitor failed logins, locked accounts
- **Support tools** - Reset education progress, unlock accounts

---

## 🎓 EDUCATION MANAGEMENT

### Test 1: Get Education Statistics

**GET** `/api/v1/admin/education/stats`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total_users": 500,
    "completion_by_module": {
      "what_are_tokens": {
        "completed": 300,
        "in_progress": 100,
        "not_started": 100,
        "completion_rate": "60.00"
      },
      "how_agents_work": {
        "completed": 250,
        "in_progress": 120,
        "not_started": 130,
        "completion_rate": "50.00"
      },
      "understanding_value": {
        "completed": 200,
        "in_progress": 80,
        "not_started": 220,
        "completion_rate": "40.00"
      },
      "safety_security": {
        "completed": 180,
        "in_progress": 70,
        "not_started": 250,
        "completion_rate": "36.00"
      }
    },
    "average_performance": {
      "what_are_tokens": {
        "avg_attempts": "1.50",
        "avg_score": "85.20"
      },
      "how_agents_work": {
        "avg_attempts": "1.80",
        "avg_score": "78.50"
      }
    },
    "recent_completions_7d": 45,
    "fully_educated_users": 150,
    "education_config": {
      "required": true,
      "pass_score": 80,
      "max_attempts": 3
    }
  }
}
```

**Use Case:** Dashboard to monitor education adoption

---

### Test 2: List Education Progress

**GET** `/api/v1/admin/education/progress`

**Query Parameters:**

- `module` - Filter by specific module
- `completed` - Show only completed: true/false
- `user_id` - Progress for specific user
- `limit`, `offset` - Pagination

**Examples:**

```bash
# Incomplete "what_are_tokens" module
GET /api/v1/admin/education/progress?module=what_are_tokens&completed=false

# Recently completed modules
GET /api/v1/admin/education/progress?completed=true

# Specific user's progress
GET /api/v1/admin/education/progress?user_id=USER_UUID
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "education-uuid",
      "user_id": "user-uuid",
      "module": "what_are_tokens",
      "completed": true,
      "completed_at": "2025-11-10T10:00:00.000Z",
      "attempts": 2,
      "score": 90,
      "created_at": "2025-11-09T15:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com",
        "country_code": "NG"
      }
    }
  ],
  "pagination": {
    "total": 300,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Test 3: Get User's Education Progress

**GET** `/api/v1/admin/education/users/:user_id/progress`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "full_name": "John Doe",
      "email": "john@test.com"
    },
    "summary": {
      "total_modules": 4,
      "completed_modules": 2,
      "completion_percentage": "50.00",
      "can_mint": true,
      "can_burn": false
    },
    "progress": [
      {
        "id": "ed-uuid-1",
        "module": "what_are_tokens",
        "completed": true,
        "completed_at": "2025-11-10T10:00:00.000Z",
        "attempts": 1,
        "score": 95
      },
      {
        "id": "ed-uuid-2",
        "module": "how_agents_work",
        "completed": true,
        "completed_at": "2025-11-11T14:00:00.000Z",
        "attempts": 2,
        "score": 85
      },
      {
        "id": "ed-uuid-3",
        "module": "understanding_value",
        "completed": false,
        "completed_at": null,
        "attempts": 1,
        "score": 60
      }
    ],
    "user_flags": {
      "education_what_are_tokens": true,
      "education_how_agents_work": true,
      "education_understanding_value": false,
      "education_safety_security": false
    }
  }
}
```

---

### Test 4: Reset User's Education Progress

**POST** `/api/v1/admin/education/users/:user_id/reset`

**Use Case:** User requests to retake quiz, or support troubleshooting

**Body (Reset specific module):**

```json
{
  "module": "what_are_tokens",
  "reason": "User reported quiz glitch. Allowing retake."
}
```

**Body (Reset all modules):**

```json
{
  "reason": "User wants to start education from scratch for review."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Education progress reset for module: what_are_tokens",
  "data": {
    "user_id": "user-uuid",
    "module": "what_are_tokens",
    "reason": "User reported quiz glitch...",
    "reset_by": "admin-uuid"
  }
}
```

---

### Test 5: Manually Mark Module Complete

**POST** `/api/v1/admin/education/users/:user_id/complete`

**Use Case:** User completed education offline, or special case exemption

**Body:**

```json
{
  "module": "what_are_tokens",
  "reason": "User completed in-person training. Manually marking complete."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Education module marked as complete: what_are_tokens",
  "data": {
    "user_id": "user-uuid",
    "module": "what_are_tokens",
    "reason": "User completed in-person training...",
    "completed_by": "admin-uuid"
  }
}
```

---

## 🔐 SECURITY MONITORING

### Test 6: Get Security Statistics

**GET** `/api/v1/admin/security/stats`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "failed_login_attempts": 25,
    "locked_accounts": 5,
    "suspended_accounts": 3,
    "recent_logins_24h": 150,
    "unverified_emails": 45,
    "users_by_country": [
      { "country": "NG", "count": 300 },
      { "country": "CM", "count": 120 },
      { "country": "SN", "count": 80 }
    ]
  }
}
```

**Use Case:** Daily security health check

---

### Test 7: List Security Issues

**GET** `/api/v1/admin/security/issues`

**Query Parameters:**

- `issue_type` - Filter by: "locked", "failed_logins", "unverified"
- `limit`, `offset` - Pagination

**Examples:**

```bash
# All security issues
GET /api/v1/admin/security/issues

# Locked accounts only
GET /api/v1/admin/security/issues?issue_type=locked

# Users with failed login attempts
GET /api/v1/admin/security/issues?issue_type=failed_logins

# Unverified emails (7+ days old)
GET /api/v1/admin/security/issues?issue_type=unverified
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "full_name": "John Doe",
      "email": "john@test.com",
      "country_code": "NG",
      "login_attempts": 5,
      "locked_until": "2025-11-11T15:00:00.000Z",
      "is_suspended": false,
      "suspension_reason": null,
      "email_verified": true,
      "last_login_at": "2025-11-11T10:00:00.000Z",
      "created_at": "2025-10-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Test 8: Unlock User Account

**POST** `/api/v1/admin/security/users/:user_id/unlock`

**Use Case:** User locked out after failed login attempts

**Expected Response:**

```json
{
  "success": true,
  "message": "Account unlocked successfully",
  "data": {
    "user_id": "user-uuid",
    "email": "john@test.com",
    "unlocked_by": "admin-uuid"
  }
}
```

**Error Response (if not locked):**

```json
{
  "success": false,
  "error": "Account is not locked"
}
```

---

### Test 9: Reset Failed Login Attempts

**POST** `/api/v1/admin/security/users/:user_id/reset-attempts`

**Use Case:** User suspects unauthorized access attempts, wants fresh start

**Expected Response:**

```json
{
  "success": true,
  "message": "Login attempts reset successfully",
  "data": {
    "user_id": "user-uuid",
    "email": "john@test.com",
    "previous_attempts": 4,
    "reset_by": "admin-uuid"
  }
}
```

---

## 🛠️ Common Admin Workflows

### Education Support Ticket:

```bash
# 1. Check user's progress
GET /admin/education/users/:user_id/progress

# 2. Reset if needed
POST /admin/education/users/:user_id/reset
{ "module": "what_are_tokens", "reason": "User reported issue" }

# 3. Or manually complete if justified
POST /admin/education/users/:user_id/complete
{ "module": "what_are_tokens", "reason": "Completed offline" }
```

### Security Incident Response:

```bash
# 1. Check security stats
GET /admin/security/stats

# 2. List all locked accounts
GET /admin/security/issues?issue_type=locked

# 3. Unlock legitimate user
POST /admin/security/users/:user_id/unlock

# 4. Reset login attempts
POST /admin/security/users/:user_id/reset-attempts
```

### Education Analytics:

```bash
# 1. Get overall stats
GET /admin/education/stats

# 2. Find incomplete modules
GET /admin/education/progress?completed=false

# 3. Check specific module adoption
GET /admin/education/progress?module=what_are_tokens
```

### 🚀 Key Features of Education & Security Module:

1. **Education Analytics** - Track adoption rates, completion rates, average scores
2. **Support Tools** - Reset progress, manually mark complete for special cases
3. **Security Dashboard** - Monitor failed logins, locked accounts, suspicious activity
4. **Quick Response** - Unlock accounts, reset attempts instantly
5. **Audit Trail** - All admin actions logged with admin_id

### 🧪 Priority Use Cases:

```bash
# Daily Education Monitoring
GET /admin/education/stats
GET /admin/education/progress?completed=false

# User Support
GET /admin/education/users/:id/progress
POST /admin/education/users/:id/reset

# Security Monitoring
GET /admin/security/stats
GET /admin/security/issues?issue_type=locked

# Incident Response
POST /admin/security/users/:id/unlock
POST /admin/security/users/:id/reset-attempts
```

### 📊 Education Module Details:

The system tracks:

- 4 education modules (what_are_tokens, how_agents_work, understanding_value, safety_security)
- Quiz attempts (max 3)
- Scores (pass: 80%)
- Completion status
- User flags in User model

Admin can:

- View platform-wide stats
- Monitor individual progress
- Reset for troubleshooting
- Manually override for special cases

---

## 🔥 Complete Admin Panel Summary

| Module        | Endpoints | Status          |
| ------------- | --------- | --------------- |
| Withdrawals   | 4         | ✅ Complete     |
| Merchants     | 4         | ✅ Complete     |
| Agents        | 7         | ✅ Complete     |
| Users         | 11        | ✅ Complete     |
| Operations    | 14        | ✅ Complete     |
| Financial     | 13        | ✅ Complete     |
| **Education** | **5**     | ✅ **NEW**      |
| **Security**  | **4**     | ✅ **NEW**      |
| **TOTAL**     | **62**    | 🎉 **Complete** |

### Education & Security Breakdown:

**Education Management:**

- Stats, list progress, get user progress, reset, manually complete

**Security Monitoring:**

- Stats, list issues, unlock accounts, reset login attempts

Your **AfriToken admin panel** is now **100% complete** with comprehensive education and security controls! 🎓🔐🚀
