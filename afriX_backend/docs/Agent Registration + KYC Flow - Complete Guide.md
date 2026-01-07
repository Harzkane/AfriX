# **Agent Registration + KYC Flow - Complete Guide**

**Date:** November 09, 2025  
**Base URL:** `http://localhost:5001/api/v1`

---

## **📋 Agent Lifecycle Overview**

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: QUICK REGISTRATION (2 minutes)                │
│  POST /api/agents/register                             │
│  Status: PENDING                                        │
│  Can: View dashboard, browse agents                    │
│  Cannot: Mint/burn tokens                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: KYC UPLOAD (5-10 minutes)                     │
│  POST /api/agents/kyc/upload                           │
│  Status: UNDER_REVIEW                                   │
│  Can: Wait for admin approval                          │
│  Cannot: Still can't mint/burn                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: ADMIN APPROVAL (Manual)                       │
│  Admin reviews KYC → Approves/Rejects                  │
│  Status: KYC APPROVED                                   │
│  Agent.is_verified = true                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4: FIRST DEPOSIT ($100+ USDT)                   │
│  POST /api/agents/deposit                              │
│  Status: ACTIVE                                         │
│  Can: Mint/burn tokens, earn fees!                    │
└─────────────────────────────────────────────────────────┘
```

---

## **🚀 STEP 1: Agent Registration (Quick)**

### **1.1 Register as Agent**

```http
POST http://localhost:5001/api/v1/agents/register
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "country": "NG",
  "currency": "NGN",
  "withdrawal_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Agent registered successfully. Please complete KYC verification.",
  "data": {
    "id": "agent-uuid",
    "tier": "STARTER",
    "status": "PENDING",
    "is_verified": false,
    "withdrawal_address": "0x742d35...",
    "next_steps": {
      "1": "Complete KYC verification: POST /api/agents/kyc/upload",
      "2": "Wait for admin approval",
      "3": "Deposit USDT to activate"
    }
  }
}
```

✅ **Agent can now:**

- View their dashboard
- See financial stats (all zeros)
- Browse other agents

❌ **Agent cannot:**

- Mint/burn tokens
- Accept requests
- Withdraw funds

---

## **📄 STEP 2: KYC Document Upload**

### **2.1 Prepare Documents**

You need:

1. **ID Document** (passport/driver's license/national ID)
2. **Selfie** holding ID document
3. **Proof of Address** (utility bill/bank statement, <3 months old)
4. **Business Registration** (optional)

### **2.2 Upload KYC Documents**

```http
POST http://localhost:5001/api/v1/agents/kyc/upload
Authorization: Bearer {{AGENT_JWT}}
Content-Type: multipart/form-data

Form Data:
  id_document: [File: passport.jpg]
  selfie: [File: selfie.jpg]
  proof_of_address: [File: utility_bill.pdf]
  business_registration: [File: business_cert.pdf] (optional)

  full_legal_name: "John Agent Smith"
  date_of_birth: "1990-05-15"
  id_document_type: "passport"
  id_document_number: "A12345678"
  nationality: "NG"
  residential_address: "123 Main St, Lagos, Nigeria"
```

**Response:**

```json
{
  "success": true,
  "message": "KYC documents uploaded successfully. Under review.",
  "data": {
    "status": "under_review",
    "submitted_at": "2025-11-09T10:30:00.000Z",
    "estimated_review_time": "1-3 business days"
  }
}
```

---

### **2.3 Check KYC Status**

```http
GET http://localhost:5001/api/v1/agents/kyc/status
Authorization: Bearer {{AGENT_JWT}}
```

**Response (Under Review):**

```json
{
  "success": true,
  "data": {
    "id": "kyc-uuid",
    "status": "under_review",
    "submitted_at": "2025-11-09T10:30:00.000Z",
    "reviewed_at": null,
    "full_legal_name": "John Agent Smith",
    "id_document_type": "passport"
  }
}
```

**Response (Not Submitted):**

```json
{
  "success": true,
  "data": {
    "status": "not_submitted",
    "message": "Please upload your KYC documents to get verified"
  }
}
```

**Response (Approved):**

```json
{
  "success": true,
  "data": {
    "status": "approved",
    "submitted_at": "2025-11-09T10:30:00.000Z",
    "reviewed_at": "2025-11-10T15:20:00.000Z",
    "message": "KYC approved! You can now deposit USDT to activate your agent account."
  }
}
```

**Response (Rejected):**

```json
{
  "success": true,
  "data": {
    "status": "rejected",
    "submitted_at": "2025-11-09T10:30:00.000Z",
    "reviewed_at": "2025-11-10T15:20:00.000Z",
    "rejection_reason": "ID document is blurry. Please upload a clearer photo."
  }
}
```

---

### **2.4 Resubmit KYC (After Rejection)**

```http
PUT http://localhost:5001/api/v1/agents/kyc/resubmit
Authorization: Bearer {{AGENT_JWT}}
Content-Type: multipart/form-data

Form Data:
  id_document: [File: passport_clear.jpg]  ← New clearer photo
  selfie: [File: selfie_new.jpg]
  proof_of_address: [File: utility_bill.pdf]

  full_legal_name: "John Agent Smith"
  date_of_birth: "1990-05-15"
  id_document_type: "passport"
  id_document_number: "A12345678"
  nationality: "NG"
  residential_address: "123 Main St, Lagos, Nigeria"
```

---

## **✅ STEP 3: Admin Approval (Manual Process)**

This happens on the admin side. Admin reviews:

- ID document quality
- Selfie matches ID
- Address proof validity
- Risk assessment

**Admin actions:**

1. Approve → `agent.is_verified = true`, `kyc.status = 'approved'`
2. Reject → `kyc.status = 'rejected'`, provide reason
3. Flag as high risk → `kyc.risk_level = 'high'`, add notes

---

## **💰 STEP 4: First Deposit (Activation)**

Once KYC is approved, agent deposits USDT:

```http
POST http://localhost:5001/api/v1/agents/deposit
Authorization: Bearer {{AGENT_JWT}}
Content-Type: application/json

{
  "amount_usd": 100,
  "tx_hash": "0x123abc..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Deposit verified! Your agent account is now ACTIVE.",
  "data": {
    "agent": {
      "id": "agent-uuid",
      "status": "ACTIVE",
      "deposit_usd": 100,
      "available_capacity": 100
    }
  }
}
```

✅ **Agent can now:**

- Accept mint/burn requests
- Earn transaction fees
- Mint/burn tokens
- Build reputation

---

## **🧪 Complete Testing Flow**

### **Test 1: Registration Without KYC**

```bash
# 1. Register agent
POST /api/agents/register

# 2. Try to accept mint request (should fail)
POST /api/requests/mint/confirm
Expected: 400 "KYC verification required"
```

---

### **Test 2: KYC Submission**

```bash
# 1. Upload KYC
POST /api/agents/kyc/upload

# 2. Check status
GET /api/agents/kyc/status
Expected: "under_review"

# 3. Try to deposit (should fail)
POST /api/agents/deposit
Expected: 400 "KYC must be approved first"
```

---

### **Test 3: KYC Rejection + Resubmission**

```bash
# 1. Admin rejects KYC (manual)

# 2. Check status
GET /api/agents/kyc/status
Expected: "rejected" with reason

# 3. Resubmit
PUT /api/agents/kyc/resubmit
Expected: Status back to "under_review"
```

---

### **Test 4: Full Agent Activation**

```bash
# 1. Register
POST /api/agents/register

# 2. Upload KYC
POST /api/agents/kyc/upload

# 3. Admin approves (manual)

# 4. Check status
GET /api/agents/kyc/status
Expected: "approved"

# 5. Deposit USDT
POST /api/agents/deposit
Expected: Agent status = "ACTIVE"

# 6. Accept mint request
POST /api/requests/mint/confirm
Expected: ✅ Success!
```

---

## **📦 Installation Steps**

### **1. Create Database Table**

```bash
node src/scripts/create-agent-kyc-table.js
```

### **2. Update Models**

Add to `src/models/index.js`:

```javascript
const AgentKyc = require("./AgentKyc");

Agent.hasOne(AgentKyc, {
  foreignKey: "agent_id",
  as: "kyc",
  onDelete: "CASCADE",
});
AgentKyc.belongsTo(Agent, {
  foreignKey: "agent_id",
  as: "agent",
});

module.exports = {
  // ... existing
  AgentKyc,
};
```

### **3. Add Routes**

Add to `src/routes/agents.js`:

```javascript
const { upload } = require("../middleware/upload");

router.post(
  "/kyc/upload",
  authenticate,
  requireAgent,
  upload.fields([
    { name: "id_document", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "proof_of_address", maxCount: 1 },
    { name: "business_registration", maxCount: 1 },
  ]),
  agentController.uploadKyc
);

router.get(
  "/kyc/status",
  authenticate,
  requireAgent,
  agentController.getKycStatus
);

router.put(
  "/kyc/resubmit",
  authenticate,
  requireAgent,
  upload.fields([
    { name: "id_document", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "proof_of_address", maxCount: 1 },
    { name: "business_registration", maxCount: 1 },
  ]),
  agentController.resubmitKyc
);
```

### **4. Add Controller Methods**

Copy the 3 methods from the artifact to `src/controllers/agentController.js`

### **5. Restart Server**

```bash
npm start
```

---

## **🔒 Security Best Practices**

1. **Document Encryption** - Consider encrypting sensitive docs at rest
2. **Access Logs** - Track who accessed KYC documents
3. **Auto-Delete** - Delete rejected docs after 90 days (GDPR compliance)
4. **Rate Limiting** - Limit KYC submissions to prevent abuse
5. **File Validation** - Check file types, sizes, and scan for malware

---

## **📱 Mobile App Flow**

```
Registration Screen
   ↓
Upload ID Screen (Camera/Gallery)
   ↓
Selfie Screen (Camera with face detection)
   ↓
Address Proof Screen (Camera/Gallery/PDF)
   ↓
Review Screen (Show all uploaded docs)
   ↓
Submit Button → "Under Review" screen
   ↓
Push Notification when approved/rejected
```

---

## **✅ Checklist**

| Step                    | Status |
| ----------------------- | ------ |
| Create `AgentKyc` model | ☐      |
| Run migration script    | ☐      |
| Add KYC routes          | ☐      |
| Add controller methods  | ☐      |
| Update models/index.js  | ☐      |
| Test registration flow  | ☐      |
| Test KYC upload         | ☐      |
| Test KYC status check   | ☐      |
| Test rejection flow     | ☐      |
| Test full activation    | ☐      |

---

**Ready to implement!** 🚀
