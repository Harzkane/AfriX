## 🎯 **Updated Timeline (Now 10 Weeks)**

### **Priority 3: Merchant Features** (Weeks 7-8)

**Week 7:**

- ✅ Merchant registration (business profile)
- ✅ Merchant dashboard (stats, earnings)
- ✅ Payment request creation
- ✅ Transaction history (merchant view)

**Week 8:**

- ✅ QR code generation & scanning
- ✅ Payment links
- ✅ Customer payment flow
- ✅ Webhook configuration
- ✅ API key regeneration

### **Priority 4: Agent Features** (Weeks 9-10)

- Moved from Week 7-8 to Week 9-10

---

## 📱 **Merchant User Flow**

Based on your testing docs:

```
1. User registers as merchant
   ├─ Business info (name, type, email, phone)
   ├─ Address (country, city, address)
   └─ Default token (NT/CT/USDT)

2. Merchant creates payment request
   ├─ Amount + Currency
   ├─ Description + Customer email
   ├─ Reference (optional)
   └─ Gets QR code + Payment URL

3. Customer scans QR or clicks link
   ├─ Sees payment details
   ├─ Pays from their wallet
   └─ Transaction completes

4. Merchant receives notification
   ├─ Webhook fired (if configured)
   ├─ Balance updated
   └─ Transaction in history

5. Merchant can:
   ├─ View all transactions
   ├─ Filter by status
   ├─ Export reports
   └─ Regenerate API key
```

---

## 🎨 **New Components Needed**

```javascript
// Merchant-specific components
components/features/
├── MerchantCard.jsx           // Business profile card
├── PaymentRequestCard.jsx     // Payment request in list
├── QRGenerator.jsx            // Generate payment QR
├── PaymentLinkCard.jsx        // Shareable payment link
├── MerchantStatsCard.jsx      // Earnings, transactions
├── WebhookConfigForm.jsx      // Webhook URL setup
└── CustomerPaymentView.jsx    // Customer's payment screen
```

---

## 📊 **MVP Updated**

The **Merchant Journey** is now part of MVP:

**Merchant Journey:**

1. ✅ Register as merchant (business info)
2. ✅ Create payment request
3. ✅ Generate QR code
4. ✅ Customer pays via QR/link
5. ✅ View merchant transactions
6. ✅ Configure webhook (optional)
7. ✅ Regenerate API key

---

## 🚀 **Backend Already Ready**

From your testing docs, these endpoints exist:

- ✅ `POST /merchants/register`
- ✅ `GET /merchants/profile`
- ✅ `PUT /merchants/profile`
- ✅ `POST /merchants/payment-request`
- ✅ `GET /merchants/transactions`
- ✅ `POST /merchants/regenerate-api-key`

**We just need to build the UI!**

---

## 🎯 **Key Merchant Screens**

### **1. Merchant Registration**

```
Step 1: Business Info
├─ Business name
├─ Display name
├─ Business type (dropdown)
└─ Description

Step 2: Contact
├─ Email
├─ Phone
└─ Country/City

Step 3: Address
├─ Full address
└─ Default token (NT/CT)

Step 4: Confirmation
├─ Review all info
└─ Submit
```

### **2. Merchant Dashboard**

```
┌─────────────────────────────┐
│  Today's Earnings           │
│  💰 12,500 NT              │
│                             │
│  This Month: 45,000 NT      │
│  Total Payments: 156        │
│  Success Rate: 98.5%        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Quick Actions              │
│  [Create Payment Request]   │
│  [View Transactions]        │
│  [Settings]                 │
└─────────────────────────────┘

Recent Payments:
├─ Customer A - 5,000 NT ✅
├─ Customer B - 1,500 NT ✅
└─ Customer C - 2,000 NT ⏳
```

### **3. Create Payment Request**

```
┌─────────────────────────────┐
│  Amount: [5000] NT          │
│  Description: [Invoice...]   │
│  Customer: [email@...]       │
│  Reference: [INV-001]        │
│                             │
│  [Generate QR Code]         │
└─────────────────────────────┘

Result:
┌─────────────────────────────┐
│  [QR Code Image]            │
│                             │
│  Payment URL:               │
│  afritoken.com/pay/abc123   │
│  [Copy Link] [Share]        │
│                             │
│  Expires: 30 minutes        │
└─────────────────────────────┘
```

### **4. Customer Payment View**

```
When customer scans QR or clicks link:

┌─────────────────────────────┐
│  Pay AfriShop NG            │
│                             │
│  🛍️ Invoice for Services   │
│  Amount: 5,000 NT           │
│  Merchant Fee: 100 NT (2%)  │
│  Total: 5,100 NT            │
│                             │
│  Your Balance: 8,500 NT ✓   │
│                             │
│  [Pay with NT]              │
│                             │
│  Powered by AfriToken       │
└─────────────────────────────┘
```

---

## ✅ **Action Items**

To ship merchant features in Weeks 7-8:

**Week 7 Tasks:**

1. Build merchant registration flow (4-step form)
2. Create merchant dashboard with stats
3. Build payment request creation form
4. Implement QR code generation (using `qrcode` library)
5. Build merchant transaction history

**Week 8 Tasks:**

1. Build customer payment view (public, no auth)
2. Implement payment confirmation flow
3. Add webhook configuration in settings
4. Build API key regeneration UI
5. Add payment link sharing (WhatsApp, SMS, Copy)
6. Test end-to-end merchant → customer → payment flow

---

## 🎉 **Milestone Celebrations (Updated)**

- Week 2: First successful token mint 🎊
- Week 4: First P2P transfer 🚀
- Week 6: Core features complete 💪
- **Week 8: First merchant payment 💳** ← NEW!
- Week 10: Agent features live ✨
- Beta: 50 users testing 🏆
- Launch: Live on Play Store 🌍

---

Ready to start building? Should I:

1. **Generate the Merchant Registration screens** (Week 7)?
2. **Create the complete project structure** first (all 10 weeks)?
3. **Start with authentication** (Week 1) and work sequentially?

Say which approach you prefer! 🚀
