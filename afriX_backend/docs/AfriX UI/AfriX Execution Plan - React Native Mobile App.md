# AfriX Execution Plan - React Native Mobile App

## 🎯 Mission Statement

Build a React Native mobile app that lets users buy, sell, swap, and send NT/CT tokens through a vetted agent network, with blockchain escrow protection, targeting Nigerian and XOF markets.

---

## 📋 What We Have Ready

### ✅ **Backend (Fully Built & Tested)**

**Complete API Routes:**

```
/api/v1/auth         ✓ Authentication (register, login, verify, reset)
/api/v1/merchants    ✓ Merchant operations (register, profile, payments)
/api/v1/payments     ✓ Payment processing
/api/v1/transactions ✓ Transaction history
/api/v1/users        ✓ User management
/api/v1/wallets      ✓ Wallet operations
/api/v1/agents       ✓ Agent operations (register, deposit, dashboard)
/api/v1/requests     ✓ Token requests (mint/burn)
/api/v1/admin        ✓ Admin operations (withdrawals, users, agents)
/api/v1/escrows      ✓ Escrow management
/api/v1/disputes     ✓ Dispute resolution
/api/v1/education    ✓ User education system
```

**Backend Services:**

- ✅ Express.js API server on Railway
- ✅ PostgreSQL database with complete schema
- ✅ Blockchain service (ethers.js) for Polygon
- ✅ Smart contracts deployed on Polygon Amoy testnet
- ✅ Authentication system (JWT)
- ✅ Email service
- ✅ Notification service
- ✅ WebSocket server for real-time updates
- ✅ Background jobs (rate updates, auto-dispute, etc.)
- ✅ Cloudflare R2 for file storage
- ✅ Redis for caching

**All Routes Tested:** ✅ Postman collections working perfectly

### ✅ **Design Direction**

- OPay-inspired UI (card-based, green theme)
- Clear status indicators
- Timer components for time-sensitive actions
- Escrow protection messaging
- Agent rating cards

### ✅ **Documentation**

- Complete transaction flows (minting, burning, P2P, swaps)
- User FAQ (comprehensive)
- Agent onboarding process
- Dispute resolution flows
- Merchant testing guide
- 36-week roadmap

---

## 🎯 What We Need to Build (Mobile App)

### **Priority 1: Core User Flows** (Weeks 1-4)

#### Week 1: Authentication & Setup

```
Screens:
├── Welcome/Language selector
├── Registration form
├── Email verification (6-digit code)
├── Login screen
└── Dashboard (home)

Backend Integration:
- POST /auth/register
- POST /auth/verify-email
- POST /auth/login
- GET /auth/refresh-token

State Management:
- User auth slice (Redux/Zustand)
- Token storage (react-native-keychain)
- Auto-login on app start

Deliverables:
✓ User can register with email
✓ User can verify email
✓ User can login and stay logged in
✓ Dashboard shows placeholder balance cards
```

#### Week 2: Token Minting (Buy from Agent)

```
Screens:
├── Buy Tokens (token selection: NT/CT)
├── Amount input (with presets)
├── Agent selection list
├── Payment instructions
├── Upload payment proof
└── Transaction status (with timer)

Backend Integration (All Tested ✅):
- GET /api/v1/agents (get available agents)
- POST /api/v1/requests/mint (create mint request)
- POST /api/v1/requests/:id/upload-proof (upload payment proof)
- GET /api/v1/requests/:id (check request status)
- GET /api/v1/wallets (get balances)

Components:
- AgentCard (rating, response time, capacity)
- TimerComponent (15-min countdown)
- UploadComponent (camera + gallery)
- StatusTracker (pending → reviewing → minted)

Deliverables:
✓ User can select token type
✓ User can choose agent from list
✓ User can upload payment proof
✓ User sees real-time status updates
✓ Balance updates after minting
```

#### Week 3: Token Burning (Sell to Agent)

```
Screens:
├── Sell Tokens (amount input)
├── Agent selection
├── Escrow confirmation screen
├── Waiting for agent payment
├── Confirm receipt screen
└── Dispute form (if needed)

Backend Integration (All Tested ✅):
- POST /api/v1/requests/burn (create burn request)
- GET /api/v1/escrows/:id (check escrow status)
- POST /api/v1/escrows/:id/confirm (confirm receipt)
- POST /api/v1/escrows/:id/dispute (raise dispute)
- GET /api/v1/wallets (updated balance)

Components:
- EscrowProtectionBanner
- CountdownTimer (2-hour window)
- ConfirmationModal ("Did you receive ₦X?")
- DisputeForm (reason + evidence upload)

Deliverables:
✓ User can initiate token sale
✓ Tokens locked in escrow (UI shows protection)
✓ User can confirm fiat receipt
✓ User can dispute if no payment
✓ Balance updates after confirmation
```

#### Week 4: P2P Transfer & Receive

```
Screens:
├── Send (QR scanner + email input)
├── Amount + Note input
├── Confirmation screen
├── Receive (QR code display)
└── Success animation

Backend Integration (All Tested ✅):
- POST /api/v1/transactions/send (P2P transfer)
- GET /api/v1/users/search (find by email)
- GET /api/v1/wallets/qr-code (generate QR)
- GET /api/v1/transactions (transaction history)
- WebSocket: Real-time balance updates

Components:
- QRScanner (full screen, react-native-camera)
- QRDisplay (user's wallet address)
- AmountInput (with balance display)
- SuccessAnimation (confetti)

Deliverables:
✓ User can scan QR to send
✓ User can enter email to send
✓ User can show QR to receive
✓ Transactions appear in history
✓ Real-time balance updates
```

---

### **Priority 2: Enhanced Features** (Weeks 5-6)

#### Week 5: Token Swap & History

```
Screens:
├── Swap interface (From → To)
├── Transaction history (filterable)
└── Transaction detail (full receipt)

Backend Integration (All Tested ✅):
- POST /api/v1/transactions/swap (token swap)
- GET /api/v1/transactions (all transactions)
- GET /api/v1/transactions/:id (single transaction)
- GET /api/v1/wallets/rates (exchange rates)

Components:
- SwapInterface (like Uniswap)
- RateTicker (updates every 5 min)
- TransactionCard (list item)
- FilterModal (by token, type, status)

Deliverables:
✓ User can swap NT ↔ CT ↔ USDT
✓ Live rates displayed
✓ Instant swap execution
✓ Complete transaction history
✓ Search and filter transactions
```

#### Week 6: Profile & Settings

```
Screens:
├── Profile (view/edit info)
├── Settings (preferences)
├── Security (password, 2FA)
├── Language switcher
├── Education modules (4 mandatory)
└── Help/Support

Backend Integration (All Tested ✅):
- GET /api/v1/users/profile
- PUT /api/v1/users/profile
- POST /api/v1/auth/change-password
- GET /api/v1/education/modules (4 modules)
- POST /api/v1/education/complete (track progress)
- GET /api/v1/help/faq

Components:
- ProfileCard
- SettingsGroup
- LanguagePicker (EN/FR)
- ThemePicker (Nigeria/XOF)
- EducationModule (interactive)

Deliverables:
✓ User can view/edit profile
✓ User can change language
✓ User can change theme
✓ User completes education modules
✓ User can access help/FAQ
✓ User can change password
```

---

### **Priority 3: Merchant Features** (Weeks 7-8)

#### Week 7: Merchant Registration & Dashboard

```
Screens:
├── Merchant Registration (multi-step form)
├── Merchant Dashboard (stats, earnings)
├── Payment Request Creation
└── Transaction History (merchant view)

Backend Integration (All Tested ✅):
- POST /api/v1/merchants/register
- GET /api/v1/merchants/profile
- PUT /api/v1/merchants/profile
- POST /api/v1/merchants/payment-request
- GET /api/v1/merchants/transactions

Components:
- MerchantRegistrationForm
- MerchantStatsCard
- PaymentRequestForm
- QRCodeGenerator
- MerchantTransactionCard

Deliverables:
✓ User can register as merchant
✓ Merchant can view dashboard
✓ Merchant can create payment requests
✓ Merchant can view transaction history
✓ QR codes generated for payments
```

#### Week 8: Payment Collection & QR Scanning

```
Screens:
├── QR Payment Scanner (customer view)
├── Payment Confirmation (customer)
├── Payment Success (customer)
├── Merchant Payment Links
└── Webhook Settings

Backend Integration (All Tested ✅):
- GET /api/v1/payments/:transaction_id (payment page)
- POST /api/v1/payments/process (complete payment)
- POST /api/v1/merchants/regenerate-api-key
- Webhook: Automatic notification on payment

Components:
- QRPaymentScanner
- PaymentAmountDisplay
- PaymentConfirmation
- WebhookConfigForm
- PaymentLinkCard

Deliverables:
✓ Customers can scan QR to pay
✓ Customers can pay via payment link
✓ Merchants receive real-time notifications
✓ Webhooks fire on payment success
✓ API keys can be regenerated
```

### **Priority 4: Agent Features** (Weeks 9-10)

#### Week 9: Agent Dashboard

```
Screens:
├── Agent Dashboard (capacity, stats)
├── Pending Requests (mint/burn queue)
├── Transaction Detail (agent view)
└── Performance Metrics

Backend Integration (All Tested ✅):
- GET /api/v1/agents/dashboard
- GET /api/v1/agents/requests/pending
- POST /api/v1/agents/requests/:id/confirm
- POST /api/v1/agents/requests/:id/upload-proof
- GET /api/v1/agents/performance

Components:
- CapacityMeter (visual gauge)
- RequestCard (pending mints/burns)
- AgentStatsCard
- ProofUpload

Deliverables:
✓ Agent can see capacity/stats
✓ Agent can view pending requests
✓ Agent can confirm payments
✓ Agent can upload proofs
```

#### Week 10: Agent Onboarding

```
Screens:
├── Application form (4 steps)
├── Document upload (KYC)
├── Training modules
└── Deposit instructions

Backend Integration (All Tested ✅):
- POST /api/v1/agents/register
- POST /api/v1/agents/kyc/upload (document upload)
- GET /api/v1/agents/deposit-address
- POST /api/v1/agents/deposit (verify deposit)
- GET /api/v1/agents/training
- POST /api/v1/agents/training/complete

Components:
- MultiStepForm
- DocumentUpload (Cloudflare R2)
- TrainingModule
- QuizComponent

Deliverables:
✓ User can apply to become agent
✓ User can upload KYC docs
✓ User can complete training
✓ User can deposit USDT
```

---

## 🏗️ Technical Architecture

### **Tech Stack (Final)**

```
Frontend:
- React Native (Expo)
- TypeScript (strict mode)
- Zustand (state management - Redux-style structure)
- React Navigation (navigation)
- React Native Paper (UI components)
- ethers.js (blockchain)
- Socket.io-client (WebSocket)
- react-native-camera (QR scanning)
- react-native-keychain (secure storage)
- i18next (translations)

Backend: (Already built)
- Node.js + Express
- PostgreSQL
- Redis
- ethers.js

Infrastructure:
- Railway (backend)
- Cloudflare R2 (file storage)
- EAS Build (app builds)
- Firebase (push notifications)

Testing:
- Jest (unit tests)
- Detox (E2E tests)
- Manual QA on real devices
```

### **Navigation Structure**

```
App
├── AuthStack (if not logged in)
│   ├── Welcome
│   ├── Register
│   ├── Verify
│   └── Login
│
└── MainStack (if logged in)
    ├── BottomTabs
    │   ├── Home (Dashboard)
    │   ├── Tokens (Swap/Request)
    │   ├── Activity (History)
    │   └── Profile (Settings)
    │
    ├── RoleBasedTabs (conditional)
    │   ├── MerchantTab (if merchant)
    │   │   ├── Merchant Dashboard
    │   │   ├── Payment Requests
    │   │   └── Merchant Settings
    │   │
    │   └── AgentTab (if agent)
    │       ├── Agent Dashboard
    │       ├── Pending Requests
    │       └── Agent Performance
    │
    └── Modals
        ├── BuyTokens (stack)
        ├── SellTokens (stack)
        ├── Send (stack)
        ├── Receive
        ├── CreatePaymentRequest (merchant)
        └── BecomeMerchant/Agent
```

### **State Management** (Zustand + TypeScript)

#### **Folder Structure:**

```typescript
src/stores/
├── index.ts                    // Export all stores
├── slices/                     // Redux-style slices
│   ├── authSlice.ts           // Auth state + actions
│   ├── walletSlice.ts         // Wallet state + actions
│   ├── transactionSlice.ts    // Transaction state + actions
│   ├── merchantSlice.ts       // Merchant state + actions
│   ├── agentSlice.ts          // Agent state + actions
│   └── appSlice.ts            // App settings
│
├── types/                      // TypeScript types
│   ├── auth.types.ts
│   ├── wallet.types.ts
│   ├── transaction.types.ts
│   ├── merchant.types.ts
│   ├── agent.types.ts
│   └── app.types.ts
│
└── middleware/                 // Zustand middleware
    ├── persist.ts             // Offline persistence
    ├── devtools.ts            // Redux DevTools integration
    └── logger.ts              // Action logging
```

#### **Example Store (TypeScript + Zustand):**

**types/auth.types.ts:**

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string;
  country_code: string;
  role: "user" | "admin" | "agent" | "merchant";
  email_verified: boolean;
  verification_level: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;
```

**slices/authSlice.ts:**

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/services/authService";
import { AuthStore } from "../types/auth.types";

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        tokens: null,
        loading: false,
        error: null,
        isAuthenticated: false,

        // Actions
        login: async (email: string, password: string) => {
          set({ loading: true, error: null }, false, "auth/login/pending");

          try {
            const response = await authService.login(email, password);

            set(
              {
                user: response.data.user,
                tokens: response.data.tokens,
                isAuthenticated: true,
                loading: false,
              },
              false,
              "auth/login/fulfilled"
            );
          } catch (error: any) {
            set(
              {
                error: error.message || "Login failed",
                loading: false,
              },
              false,
              "auth/login/rejected"
            );
            throw error;
          }
        },

        register: async (data) => {
          set({ loading: true, error: null }, false, "auth/register/pending");

          try {
            const response = await authService.register(data);

            set(
              {
                user: response.data.user,
                loading: false,
              },
              false,
              "auth/register/fulfilled"
            );
          } catch (error: any) {
            set(
              {
                error: error.message || "Registration failed",
                loading: false,
              },
              false,
              "auth/register/rejected"
            );
            throw error;
          }
        },

        logout: () => {
          set(
            {
              user: null,
              tokens: null,
              isAuthenticated: false,
            },
            false,
            "auth/logout"
          );
        },

        refreshToken: async () => {
          const { tokens } = get();
          if (!tokens?.refresh_token) return;

          try {
            const response = await authService.refreshToken(
              tokens.refresh_token
            );
            set(
              {
                tokens: response.data.tokens,
              },
              false,
              "auth/refreshToken"
            );
          } catch (error) {
            // Token refresh failed, logout user
            get().logout();
          }
        },

        clearError: () => {
          set({ error: null }, false, "auth/clearError");
        },
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" } // Redux DevTools name
  )
);
```

**stores/index.ts:**

```typescript
// Export all stores
export { useAuthStore } from "./slices/authSlice";
export { useWalletStore } from "./slices/walletSlice";
export { useTransactionStore } from "./slices/transactionSlice";
export { useMerchantStore } from "./slices/merchantSlice";
export { useAgentStore } from "./slices/agentSlice";
export { useAppStore } from "./slices/appSlice";

// Export all types
export * from "./types/auth.types";
export * from "./types/wallet.types";
export * from "./types/transaction.types";
export * from "./types/merchant.types";
export * from "./types/agent.types";
export * from "./types/app.types";
```

### **Usage in Components:**

```typescript
// screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text } from "react-native";
import { useAuthStore } from "@/stores";
import { Button, TextInput } from "react-native-paper";

export const LoginScreen: React.FC = () => {
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      // Navigation handled by auth state change
    } catch (err) {
      // Error already set in store
      console.error("Login failed:", err);
    }
  };

  return (
    <View>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
      >
        Login
      </Button>
    </View>
  );
};
```

### **Zustand DevTools Setup:**

```typescript
// src/stores/middleware/devtools.ts
import { devtools as zustandDevtools } from "zustand/middleware";

// Enable only in development
export const devtools = __DEV__ ? zustandDevtools : (config: any) => config;
```

### **Store Organization Rules:**

1. **One slice per domain** (auth, wallet, merchant, agent)
2. **Keep slices under 300 lines** (split if larger)
3. **All types in separate files**
4. **Actions use async/await** (not thunks)
5. **Name actions like Redux** (`auth/login/pending`)
6. **Use devtools middleware** for debugging
7. **Persist only necessary state** (not loading/error)

### **API Service Layer**

```typescript
services/
├── api/
│   ├── client.ts              // Axios instance with interceptors
│   ├── endpoints.ts           // API endpoint constants
│   └── types.ts               // API response types
│
├── authService.ts            // Login, register, refresh
├── walletService.ts          // Balances, addresses
├── merchantService.ts        // Merchant operations, payments
├── agentService.ts           // Agent operations
├── transactionService.ts     // P2P, swaps, history
└── blockchainService.ts      // Direct blockchain calls
```

### **TypeScript Configuration:**

**tsconfig.json:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/stores/*": ["src/stores/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/constants/*": ["src/constants/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### **Project Structure (Complete):**

```
afriX-mobile/
├── src/
│   ├── screens/              // All screens
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── VerifyScreen.tsx
│   │   │   └── LoginScreen.tsx
│   │   ├── home/
│   │   │   └── DashboardScreen.tsx
│   │   ├── tokens/
│   │   │   ├── BuyTokensScreen.tsx
│   │   │   ├── SellTokensScreen.tsx
│   │   │   ├── SendScreen.tsx
│   │   │   ├── ReceiveScreen.tsx
│   │   │   └── SwapScreen.tsx
│   │   ├── merchant/
│   │   │   ├── MerchantDashboardScreen.tsx
│   │   │   ├── CreatePaymentScreen.tsx
│   │   │   └── MerchantTransactionsScreen.tsx
│   │   ├── agent/
│   │   │   ├── AgentDashboardScreen.tsx
│   │   │   └── AgentRequestsScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── components/           // Reusable components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Modal.tsx
│   │   ├── features/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── TransactionCard.tsx
│   │   │   ├── MerchantCard.tsx
│   │   │   ├── PaymentRequestCard.tsx
│   │   │   ├── TimerComponent.tsx
│   │   │   ├── StatusTracker.tsx
│   │   │   ├── QRScanner.tsx
│   │   │   ├── QRDisplay.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── SwapInterface.tsx
│   │   └── layout/
│   │       ├── Container.tsx
│   │       ├── Header.tsx
│   │       └── SafeAreaWrapper.tsx
│   │
│   ├── navigation/           // Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   │
│   ├── stores/              // Zustand stores (Redux-style)
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── walletSlice.ts
│   │   │   ├── transactionSlice.ts
│   │   │   ├── merchantSlice.ts
│   │   │   ├── agentSlice.ts
│   │   │   └── appSlice.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── wallet.types.ts
│   │   │   ├── transaction.types.ts
│   │   │   ├── merchant.types.ts
│   │   │   ├── agent.types.ts
│   │   │   └── app.types.ts
│   │   ├── middleware/
│   │   │   ├── persist.ts
│   │   │   ├── devtools.ts
│   │   │   └── logger.ts
│   │   └── index.ts
│   │
│   ├── services/            // API services
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── endpoints.ts
│   │   │   └── types.ts
│   │   ├── authService.ts
│   │   ├── walletService.ts
│   │   ├── merchantService.ts
│   │   ├── agentService.ts
│   │   ├── transactionService.ts
│   │   └── blockchainService.ts
│   │
│   ├── hooks/               // Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useTransaction.ts
│   │   └── useWebSocket.ts
│   │
│   ├── utils/               // Utility functions
│   │   ├── formatters.ts    // Currency, date formatters
│   │   ├── validators.ts    // Input validation
│   │   ├── storage.ts       // AsyncStorage helpers
│   │   └── constants.ts     // App constants
│   │
│   ├── constants/           // Constants
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── api.ts
│   │
│   ├── types/               // Global TypeScript types
│   │   ├── navigation.types.ts
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   │
│   └── i18n/                // Internationalization
│       ├── en.json
│       ├── fr.json
│       └── index.ts
│
├── assets/                  // Images, fonts, etc.
├── app.json                 // Expo config
├── tsconfig.json            // TypeScript config
├── package.json
└── README.md
```

---

## 🎨 Design System

### **Colors** (OPay-inspired)

```javascript
colors: {
  // Primary (Trust/Finance)
  primary: {
    green: '#00B14F',
    greenDark: '#008C3D',
    greenLight: '#E8F9F0',
  },

  // Functional
  success: '#00C851',
  warning: '#FFB800',
  error: '#FF4444',
  info: '#33B5E5',

  // Neutrals
  bg: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    tertiary: '#E8ECEF',
  },

  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  },

  border: '#E5E7EB',
}
```

### **Typography**

```javascript
fonts: {
  family: {
    primary: 'Inter',
    mono: 'JetBrains Mono', // For addresses
  },

  sizes: {
    xs: 12,    // Helper text
    sm: 14,    // Body
    base: 16,  // Default
    lg: 18,    // Subheadings
    xl: 20,    // Card titles
    '2xl': 24, // Section headers
    '3xl': 32, // Balance amounts
    '4xl': 40, // Hero numbers
  },
}
```

---

## 🔄 Development Workflow

### **Daily Routine**

```
1. Morning (2 hours):
   - Review yesterday's code
   - Plan today's tasks (max 3)
   - Write tests for yesterday's features

2. Afternoon (4 hours):
   - Build new features
   - Integrate with backend
   - Test on real device

3. Evening (2 hours):
   - Code review (self)
   - Update documentation
   - Commit and push
   - Plan tomorrow

Total: 8 hours/day
```

### **Weekly Cadence**

```
Monday:    Sprint planning, priority review
Tuesday:   Deep work, new features
Wednesday: Backend integration
Thursday:  Testing and bug fixes
Friday:    Code review, documentation
Saturday:  Optional (polish, refactor)
Sunday:    Rest (no code!)
```

### **Git Workflow**

```
main (protected, production-ready)
  ↓
develop (integration branch)
  ↓
feature/auth-screens
feature/buy-tokens-flow
feature/sell-tokens-flow
hotfix/balance-update-bug
```

### **Commit Convention**

```
feat: Add QR scanner for P2P transfers
fix: Balance not updating after mint
refactor: Extract agent card to component
docs: Update API integration guide
test: Add tests for swap calculation
style: Format code with Prettier
```

---

## 📊 Success Metrics (Weekly Tracking)

### **Week 1 Metrics**

- [ ] User can register (100% success rate)
- [ ] Email verification works (100% delivery)
- [ ] Login persists across app restarts
- [ ] Dashboard loads within 2 seconds

### **Week 2 Metrics**

- [ ] Minting flow completable end-to-end
- [ ] Payment proof uploads successfully
- [ ] Agent sees notification within 1 minute
- [ ] Balance updates within 30 seconds of mint

### **Week 3 Metrics**

- [ ] Burning flow completable with escrow
- [ ] User can confirm receipt within 2 hours
- [ ] Dispute system works (manual test)
- [ ] Refund happens within 5 minutes

### **Week 4 Metrics**

- [ ] P2P transfer completes in <1 minute
- [ ] QR scanner works on both platforms
- [ ] Transaction history displays correctly
- [ ] Real-time balance updates via WebSocket

---

## ⚠️ Anti-Hallucination Checklist

Before building ANY feature, answer these:

1. **Does the backend endpoint exist?**

   - [ ] Yes → Integrate directly
   - [ ] No → Create backend first, then integrate

2. **Is this in the original plan?**

   - [ ] Yes → Build as specified
   - [ ] No → Is it essential? If no, skip for now

3. **Can I test this without real money?**

   - [ ] Yes → Use testnet USDT
   - [ ] No → Create mock data

4. **Does this match the design guide?**

   - [ ] Yes → Use exact components
   - [ ] No → Refer back to OPay-inspired patterns

5. **Is there a corresponding user flow?**
   - [ ] Yes → Follow the flow exactly
   - [ ] No → Don't build it yet

---

## 🚨 Red Flags (Stop & Reassess If...)

1. ❌ Adding features not in the blueprint
2. ❌ Building backend AND frontend simultaneously
3. ❌ No tests for 3+ days straight
4. ❌ Working on "nice to have" before "must have"
5. ❌ Not following the design system
6. ❌ Building custom components for things that exist
7. ❌ Skipping documentation
8. ❌ Not testing on real device

---

## 📦 Deliverables by Week

### **Week 1: Authentication** ✓

- APK with working registration/login
- Dashboard showing placeholder balances
- Language switcher working

### **Week 2: Minting** ✓

- Users can buy tokens from agents
- Payment proof upload works
- Transaction status tracking
- Balance updates after mint

### **Week 3: Burning** ✓

- Users can sell tokens to agents
- Escrow protection visible
- Confirmation/dispute flows work
- Refunds happen correctly

### **Week 4: P2P** ✓

- QR code send/receive
- Email-based sending
- Transaction history
- Real-time updates

### **Week 5: Swaps** ✓

- NT ↔ CT ↔ USDT swaps
- Live rates displayed
- Transaction filtering

### **Week 6: Profile** ✓

- Settings complete
- Multi-language working
- Theme switching
- Help/Support

### **Week 7: Merchant Registration** ✓

- Merchant registration flow
- Business profile creation
- Dashboard with stats
- Payment request creation

### **Week 8: Merchant Payments** ✓

- QR code generation
- Payment links
- Customer payment flow
- Webhook integration

### **Week 9-10: Agent Features** ✓

- Agent dashboard
- Onboarding flow
- Request management
- Performance tracking

---

## 🎯 MVP Definition (Must Ship)

Before declaring "MVP complete", all these must work:

**User Journey:**

1. ✅ Register → Verify → Login
2. ✅ See balance (NT, CT, USDT)
3. ✅ Buy NT from agent (complete flow)
4. ✅ Sell NT to agent (with escrow)
5. ✅ Send NT to friend via QR/email
6. ✅ View transaction history
7. ✅ Change language/theme

**Merchant Journey:**

1. ✅ Register as merchant
2. ✅ Create payment request
3. ✅ Generate QR code
4. ✅ Receive payment from customer
5. ✅ View merchant transactions
6. ✅ Configure webhook
7. ✅ Regenerate API key

**Agent Journey:**

1. ✅ Apply to become agent
2. ✅ Deposit USDT
3. ✅ See pending mint requests
4. ✅ Confirm user payments
5. ✅ View capacity/stats

**Technical:**

1. ✅ Works offline (cached data)
2. ✅ Real-time updates (WebSocket)
3. ✅ No crashes on common flows
4. ✅ Loads fast (<3s cold start)
5. ✅ Looks good on 5.5" and 6.5" screens

---

## 🛠️ Tech Stack (Final Decision)

```
Frontend:
- React Native (Expo)
- TypeScript (strict mode) ✨
- Zustand (Redux-style structure) ✨
- React Navigation (navigation)
- React Native Paper (UI components)
- ethers.js (blockchain)
- Socket.io-client (WebSocket)
- react-native-camera (QR scanning)
- react-native-keychain (secure storage)
- i18next (translations)

Backend: (Already built)
- Node.js + Express
- PostgreSQL
- Redis
- ethers.js

Infrastructure:
- Railway (backend)
- Cloudflare R2 (file storage)
- EAS Build (app builds)
- Firebase (push notifications)

Testing:
- Jest (unit tests)
- Detox (E2E tests)
- Manual QA on real devices
```

---

## 📚 **Zustand Best Practices (Redux-Style)**

### **1. Store Organization:**

```
✅ DO: One slice per domain
✅ DO: Keep slices under 300 lines
✅ DO: Use TypeScript for all stores
✅ DO: Name actions like Redux (domain/action/status)
✅ DO: Persist only necessary state

❌ DON'T: Put everything in one store
❌ DON'T: Mix concerns (auth + wallet in same slice)
❌ DON'T: Persist loading/error states
❌ DON'T: Use plain JavaScript (use TypeScript)
```

### **2. Debugging with Redux DevTools:**

```typescript
// Each store gets a name in DevTools
devtools(
  (set, get) => ({
    /* ... */
  }),
  { name: "AuthStore" } // Shows in DevTools
);

// Actions show up as:
// AuthStore: auth/login/pending
// AuthStore: auth/login/fulfilled
// WalletStore: wallet/updateBalance
```

### **3. Troubleshooting Guide:**

**Problem: State not updating**

```
1. Check: Is action being called?
   → Add console.log in action

2. Check: Is set() being called?
   → Look for set({ ... }) in action

3. Check: Is Redux DevTools showing the action?
   → Open DevTools, look for action name

4. Check: Is component re-rendering?
   → Add console.log in component
```

**Where to look:**

- State not updating → `stores/slices/[domain]Slice.ts`
- API error → `services/[domain]Service.ts`
- Component not re-rendering → Component file
- Type error → `stores/types/[domain].types.ts`

### **4. File Naming Conventions:**

```typescript
// Stores
stores / slices / authSlice.ts; // Not: auth.ts or authStore.ts
stores / types / auth.types.ts; // Not: authTypes.ts

// Services
services / authService.ts; // Not: auth.service.ts

// Components
components / ui / Button.tsx; // PascalCase
components / features / BalanceCard.tsx;

// Screens
screens / auth / LoginScreen.tsx; // Always ends with Screen
```

### **5. Import Paths (TypeScript aliases):**

```typescript
// Always use aliases (not relative paths)
✅ import { useAuthStore } from '@/stores';
✅ import { Button } from '@/components/ui/Button';
✅ import { authService } from '@/services/authService';

❌ import { useAuthStore } from '../../stores/slices/authSlice';
❌ import { Button } from '../../../components/ui/Button';
```

---

## 📝 Next Immediate Action

**Right now, we should:**

1. **Initialize React Native project**

   ```bash
   npx create-expo-app afriX-mobile
   cd afriX-mobile
   npm install @react-navigation/native @react-navigation/stack
   npm install zustand react-native-paper ethers socket.io-client
   ```

2. **Set up project structure**

   ```
   src/
   ├── screens/
   ├── components/
   ├── services/
   ├── stores/
   ├── navigation/
   ├── constants/
   └── utils/
   ```

3. **Build Week 1 Screens**
   - Welcome screen
   - Register screen
   - Verify screen
   - Login screen
   - Dashboard skeleton

---

## ✅ Question Before Starting Each Feature

**Ask yourself:**

1. What exact backend endpoint am I calling?
2. What does the user see while waiting?
3. What happens if it fails?
4. Does this match the transaction flow doc?
5. Can I test this on testnet?

**If you can't answer all 5, STOP and clarify first.**

---

## 🎉 Milestone Celebrations

- Week 2: First successful token mint 🎊
- Week 4: First P2P transfer 🚀
- Week 6: MVP feature complete 💪
- Week 8: Agent features live ✨
- Beta: 50 users testing 🏆
- Launch: Live on Play Store 🌍

---

## 🔄 Weekly Review Template

Every Friday, answer:

1. **What shipped?** (Features completed)
2. **What's blocked?** (Waiting on backend/decisions)
3. **What learned?** (Technical insights)
4. **Next week goal?** (Single focus)
5. **Any scope creep?** (Features not in plan)

---

## 🎯 The One Rule

**"If it's not in the Blueprint, FAQ, or Transaction Flows docs, we don't build it until MVP ships."**

This keeps us focused and prevents scope creep.

---

Ready to start?

**Proposed First Action:**
Create the React Native project structure and build the authentication screens (Week 1).

Should I generate the initial project structure with:

1. Navigation setup
2. Auth screens (Welcome/Register/Login)
3. API service layer
4. Zustand stores

Say "yes" and I'll create the complete starter code! 🚀
