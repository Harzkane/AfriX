// File: src/routes/admin.js
const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/adminDashboardController");
const adminWithdrawalController = require("../controllers/adminWithdrawalController");
const adminMerchantController = require("../controllers/adminMerchantController");
const adminAgentController = require("../controllers/adminAgentController");
const adminUserController = require("../controllers/adminUserController");
const adminOperationsController = require("../controllers/adminOperationsController");
const adminFinancialController = require("../controllers/adminFinancialController");
const adminEducationAuthController = require("../controllers/adminEducationAuthController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

/**
 * Admin Routes
 * Base path: /api/v1/admin
 * All routes require admin authentication
 */

// =====================================================
// DASHBOARD OVERVIEW
// =====================================================

/**
 * Get comprehensive dashboard overview
 * GET /api/v1/admin/dashboard/overview
 * Returns all critical metrics in a single API call
 */
router.get(
  "/dashboard/overview",
  authenticate,
  authorizeAdmin,
  adminDashboardController.getOverview
);

// =====================================================
// WITHDRAWAL MANAGEMENT ROUTES
// =====================================================

/**
 * List all pending withdrawal requests
 * GET /api/v1/admin/withdrawals/pending
 */
router.get(
  "/withdrawals/pending",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.listPending
);

/**
 * List all withdrawals with filters
 * GET /api/v1/admin/withdrawals
 * Query: { status?, agent_id?, start_date?, end_date? }
 */
router.get(
  "/withdrawals",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.listAll
);

/**
 * Approve withdrawal request
 * POST /api/v1/admin/withdrawals/approve
 * Body: { request_id }
 */
router.post(
  "/withdrawals/approve",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.approve
);

/**
 * Mark withdrawal as paid
 * POST /api/v1/admin/withdrawals/paid
 * Body: { request_id, tx_hash }
 */
router.post(
  "/withdrawals/paid",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.markPaid
);

/**
 * Reject withdrawal request
 * POST /api/v1/admin/withdrawals/reject
 * Body: { request_id, reason }
 */
router.post(
  "/withdrawals/reject",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.reject
);

/**
 * Get withdrawal statistics
 * GET /api/v1/admin/withdrawals/stats
 */
router.get(
  "/withdrawals/stats",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.getStats
);

/**
 * Get single withdrawal request
 * GET /api/v1/admin/withdrawals/:id
 */
router.get(
  "/withdrawals/:id",
  authenticate,
  authorizeAdmin,
  adminWithdrawalController.getWithdrawal
);

// =====================================================
// MERCHANT MANAGEMENT ROUTES
// =====================================================

/**
 * List all merchants
 * GET /api/v1/admin/merchants
 * Query: { status?: "pending" | "approved" | "rejected" }
 */
router.get(
  "/merchants",
  authenticate,
  authorizeAdmin,
  adminMerchantController.listMerchants
);

/**
 * Get single merchant details
 * GET /api/v1/admin/merchants/:id
 */
router.get(
  "/merchants/:id",
  authenticate,
  authorizeAdmin,
  adminMerchantController.getMerchant
);

/**
 * Approve merchant KYC
 * POST /api/v1/admin/merchants/:id/approve
 */
router.post(
  "/merchants/:id/approve",
  authenticate,
  authorizeAdmin,
  adminMerchantController.approveMerchant
);

/**
 * Reject merchant KYC
 * POST /api/v1/admin/merchants/:id/reject
 * Body: { reason: string }
 */
router.post(
  "/merchants/:id/reject",
  authenticate,
  authorizeAdmin,
  adminMerchantController.rejectMerchant
);

// =====================================================
// AGENT MANAGEMENT ROUTES
// =====================================================

/**
 * Get agent statistics
 * GET /api/v1/admin/agents/stats
 */
router.get(
  "/agents/stats",
  authenticate,
  authorizeAdmin,
  adminAgentController.getStats
);

/**
 * List all agents
 * GET /api/v1/admin/agents
 * Query: { status?: "pending" | "active" | "suspended", verified?: "true" | "false", country?, tier? }
 */
router.get(
  "/agents",
  authenticate,
  authorizeAdmin,
  adminAgentController.listAgents
);

/**
 * Get single agent details
 * GET /api/v1/admin/agents/:id
 */
router.get(
  "/agents/:id",
  authenticate,
  authorizeAdmin,
  adminAgentController.getAgent
);

/**
 * Approve agent KYC
 * POST /api/v1/admin/agents/:id/approve-kyc
 */
router.post(
  "/agents/:id/approve-kyc",
  authenticate,
  authorizeAdmin,
  adminAgentController.approveKyc
);

/**
 * Reject agent KYC
 * POST /api/v1/admin/agents/:id/reject-kyc
 * Body: { reason: string }
 */
router.post(
  "/agents/:id/reject-kyc",
  authenticate,
  authorizeAdmin,
  adminAgentController.rejectKyc
);

/**
 * Suspend agent
 * POST /api/v1/admin/agents/:id/suspend
 * Body: { reason: string }
 */
router.post(
  "/agents/:id/suspend",
  authenticate,
  authorizeAdmin,
  adminAgentController.suspendAgent
);

/**
 * Activate/Reactivate agent
 * POST /api/v1/admin/agents/:id/activate
 */
router.post(
  "/agents/:id/activate",
  authenticate,
  authorizeAdmin,
  adminAgentController.activateAgent
);

// =====================================================
// USER MANAGEMENT ROUTES
// =====================================================

/**
 * Get user statistics
 * GET /api/v1/admin/users/stats
 */
router.get(
  "/users/stats",
  authenticate,
  authorizeAdmin,
  adminUserController.getStats
);

/**
 * List all users with filters
 * GET /api/v1/admin/users
 * Query: { role?, email_verified?, is_active?, is_suspended?, search?, limit?, offset? }
 */
router.get(
  "/users",
  authenticate,
  authorizeAdmin,
  adminUserController.listUsers
);

/**
 * Get single user details
 * GET /api/v1/admin/users/:id
 */
router.get(
  "/users/:id",
  authenticate,
  authorizeAdmin,
  adminUserController.getUser
);

/**
 * Suspend user account
 * POST /api/v1/admin/users/:id/suspend
 * Body: { reason: string, duration_days?: number }
 */
router.post(
  "/users/:id/suspend",
  authenticate,
  authorizeAdmin,
  adminUserController.suspendUser
);

/**
 * Unsuspend user account
 * POST /api/v1/admin/users/:id/unsuspend
 */
router.post(
  "/users/:id/unsuspend",
  authenticate,
  authorizeAdmin,
  adminUserController.unsuspendUser
);

/**
 * Verify user email manually
 * POST /api/v1/admin/users/:id/verify-email
 */
router.post(
  "/users/:id/verify-email",
  authenticate,
  authorizeAdmin,
  adminUserController.verifyEmail
);

/**
 * Reset user password
 * POST /api/v1/admin/users/:id/reset-password
 * Body: { new_password: string }
 */
router.post(
  "/users/:id/reset-password",
  authenticate,
  authorizeAdmin,
  adminUserController.resetPassword
);

/**
 * Credit user wallet
 * POST /api/v1/admin/users/:id/credit-wallet
 * Body: { amount: number, token_type: string, description?: string }
 */
router.post(
  "/users/:id/credit-wallet",
  authenticate,
  authorizeAdmin,
  adminUserController.creditWallet
);

/**
 * Debit user wallet
 * POST /api/v1/admin/users/:id/debit-wallet
 * Body: { amount: number, token_type: string, description?: string }
 */
router.post(
  "/users/:id/debit-wallet",
  authenticate,
  authorizeAdmin,
  adminUserController.debitWallet
);

/**
 * Freeze user wallet
 * POST /api/v1/admin/users/:id/freeze-wallet
 * Body: { token_type: string, reason: string }
 */
router.post(
  "/users/:id/freeze-wallet",
  authenticate,
  authorizeAdmin,
  adminUserController.freezeWallet
);

/**
 * Unfreeze user wallet
 * POST /api/v1/admin/users/:id/unfreeze-wallet
 * Body: { token_type: string }
 */
router.post(
  "/users/:id/unfreeze-wallet",
  authenticate,
  authorizeAdmin,
  adminUserController.unfreezeWallet
);

// =====================================================
// OPERATIONS MANAGEMENT (DISPUTES, ESCROWS, REQUESTS)
// =====================================================

// --- DISPUTE MANAGEMENT ---

/**
 * Get dispute statistics
 * GET /api/v1/admin/operations/disputes/stats
 */
router.get(
  "/operations/disputes/stats",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getDisputeStats
);

/**
 * List all disputes with filters
 * GET /api/v1/admin/operations/disputes
 * Query: { status?, escalation_level?, agent_id?, user_id?, limit?, offset? }
 */
router.get(
  "/operations/disputes",
  authenticate,
  authorizeAdmin,
  adminOperationsController.listDisputes
);

/**
 * Get single dispute details
 * GET /api/v1/admin/operations/disputes/:id
 */
router.get(
  "/operations/disputes/:id",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getDispute
);

/**
 * Escalate dispute level
 * POST /api/v1/admin/operations/disputes/:id/escalate
 * Body: { escalation_level: string, notes?: string }
 */
router.post(
  "/operations/disputes/:id/escalate",
  authenticate,
  authorizeAdmin,
  adminOperationsController.escalateDispute
);

/**
 * Resolve dispute
 * POST /api/v1/admin/operations/disputes/:id/resolve
 * Body: { action: string, penalty_amount_usd?: number, notes?: string }
 */
router.post(
  "/operations/disputes/:id/resolve",
  authenticate,
  authorizeAdmin,
  adminOperationsController.resolveDispute
);

// --- ESCROW MANAGEMENT ---

/**
 * Get escrow statistics
 * GET /api/v1/admin/operations/escrows/stats
 */
router.get(
  "/operations/escrows/stats",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getEscrowStats
);

/**
 * List all escrows with filters
 * GET /api/v1/admin/operations/escrows
 * Query: { status?, expired?, agent_id?, user_id?, limit?, offset? }
 */
router.get(
  "/operations/escrows",
  authenticate,
  authorizeAdmin,
  adminOperationsController.listEscrows
);

/**
 * Get single escrow details
 * GET /api/v1/admin/operations/escrows/:id
 */
router.get(
  "/operations/escrows/:id",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getEscrow
);

/**
 * Force finalize escrow (admin override)
 * POST /api/v1/admin/operations/escrows/:id/force-finalize
 * Body: { notes?: string }
 */
router.post(
  "/operations/escrows/:id/force-finalize",
  authenticate,
  authorizeAdmin,
  adminOperationsController.forceFinalize
);

/**
 * Process all expired escrows
 * POST /api/v1/admin/operations/escrows/process-expired
 * Body: { limit?: number }
 */
router.post(
  "/operations/escrows/process-expired",
  authenticate,
  authorizeAdmin,
  adminOperationsController.processExpiredEscrows
);

// --- REQUEST MANAGEMENT (MINT/BURN) ---

/**
 * Get request statistics
 * GET /api/v1/admin/operations/requests/stats
 */
router.get(
  "/operations/requests/stats",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getRequestStats
);

/**
 * List mint requests
 * GET /api/v1/admin/operations/requests/mint
 * Query: { status?, agent_id?, user_id?, expired?, limit?, offset? }
 */
router.get(
  "/operations/requests/mint",
  authenticate,
  authorizeAdmin,
  adminOperationsController.listMintRequests
);

/**
 * Get single mint request
 * GET /api/v1/admin/operations/requests/mint/:id
 */
router.get(
  "/operations/requests/mint/:id",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getMintRequest
);

/**
 * List burn requests
 * GET /api/v1/admin/operations/requests/burn
 * Query: { status?, agent_id?, user_id?, expired?, limit?, offset? }
 */
router.get(
  "/operations/requests/burn",
  authenticate,
  authorizeAdmin,
  adminOperationsController.listBurnRequests
);

/**
 * Get single burn request
 * GET /api/v1/admin/operations/requests/burn/:id
 */
router.get(
  "/operations/requests/burn/:id",
  authenticate,
  authorizeAdmin,
  adminOperationsController.getBurnRequest
);

/**
 * Cancel mint request
 * POST /api/v1/admin/operations/requests/mint/:id/cancel
 * Body: { reason: string }
 */
router.post(
  "/operations/requests/mint/:id/cancel",
  authenticate,
  authorizeAdmin,
  adminOperationsController.cancelMintRequest
);

/**
 * Cancel burn request (refunds escrow)
 * POST /api/v1/admin/operations/requests/burn/:id/cancel
 * Body: { reason: string }
 */
router.post(
  "/operations/requests/burn/:id/cancel",
  authenticate,
  authorizeAdmin,
  adminOperationsController.cancelBurnRequest
);

// =====================================================
// FINANCIAL MANAGEMENT (TRANSACTIONS, WALLETS, PAYMENTS)
// =====================================================

// --- TRANSACTION MANAGEMENT ---

/**
 * Get transaction statistics
 * GET /api/v1/admin/financial/transactions/stats
 */
router.get(
  "/financial/transactions/stats",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getTransactionStats
);

/**
 * List all transactions with filters
 * GET /api/v1/admin/financial/transactions
 * Query: { type?, status?, user_id?, merchant_id?, agent_id?, token_type?, start_date?, end_date?, limit?, offset? }
 */
router.get(
  "/financial/transactions",
  authenticate,
  authorizeAdmin,
  adminFinancialController.listTransactions
);

/**
 * Get single transaction details
 * GET /api/v1/admin/financial/transactions/:id
 */
router.get(
  "/financial/transactions/:id",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getTransaction
);

/**
 * Refund transaction
 * POST /api/v1/admin/financial/transactions/:id/refund
 * Body: { reason: string }
 */
router.post(
  "/financial/transactions/:id/refund",
  authenticate,
  authorizeAdmin,
  adminFinancialController.refundTransaction
);

/**
 * Flag transaction as suspicious
 * POST /api/v1/admin/financial/transactions/:id/flag
 * Body: { reason: string, severity?: string }
 */
router.post(
  "/financial/transactions/:id/flag",
  authenticate,
  authorizeAdmin,
  adminFinancialController.flagTransaction
);

// --- WALLET MANAGEMENT ---

/**
 * Get wallet statistics
 * GET /api/v1/admin/financial/wallets/stats
 */
router.get(
  "/financial/wallets/stats",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getWalletStats
);

/**
 * List all wallets with filters
 * GET /api/v1/admin/financial/wallets
 * Query: { token_type?, is_frozen?, user_id?, min_balance?, max_balance?, limit?, offset? }
 */
router.get(
  "/financial/wallets",
  authenticate,
  authorizeAdmin,
  adminFinancialController.listWallets
);

/**
 * Get wallet details
 * GET /api/v1/admin/financial/wallets/:id
 */
router.get(
  "/financial/wallets/:id",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getWallet
);

// --- PAYMENT MANAGEMENT ---

/**
 * Get payment statistics
 * GET /api/v1/admin/financial/payments/stats
 */
router.get(
  "/financial/payments/stats",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getPaymentStats
);

/**
 * List merchant payments
 * GET /api/v1/admin/financial/payments
 * Query: { merchant_id?, status?, start_date?, end_date?, limit?, offset? }
 */
router.get(
  "/financial/payments",
  authenticate,
  authorizeAdmin,
  adminFinancialController.listPayments
);

// --- PLATFORM FEE COLLECTION ---

/**
 * Get platform fee wallet balances (NT, CT, USDT)
 * GET /api/v1/admin/financial/platform-fees/balances
 */
router.get(
  "/financial/platform-fees/balances",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getPlatformFeeBalances
);

/**
 * Get platform fee collection report
 * GET /api/v1/admin/financial/platform-fees/report
 * Query: { start_date?, end_date?, type? }
 */
router.get(
  "/financial/platform-fees/report",
  authenticate,
  authorizeAdmin,
  adminFinancialController.getPlatformFeeReport
);

// =====================================================
// EDUCATION & SECURITY MANAGEMENT
// =====================================================

// --- EDUCATION MANAGEMENT ---

/**
 * Get education statistics
 * GET /api/v1/admin/education/stats
 */
router.get(
  "/education/stats",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.getEducationStats
);

/**
 * List users' education progress
 * GET /api/v1/admin/education/progress
 * Query: { module?, completed?, user_id?, limit?, offset? }
 */
router.get(
  "/education/progress",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.listProgress
);

/**
 * List users with education summary (one row per user)
 * GET /api/v1/admin/education/users
 * Query: { status?: "all" | "completed" | "in_progress", limit?, offset? }
 */
router.get(
  "/education/users",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.listUsersWithEducation
);

/**
 * Get user's education progress
 * GET /api/v1/admin/education/users/:user_id/progress
 */
router.get(
  "/education/users/:user_id/progress",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.getUserProgress
);

/**
 * Reset user's education progress
 * POST /api/v1/admin/education/users/:user_id/reset
 * Body: { module?: string, reason: string }
 */
router.post(
  "/education/users/:user_id/reset",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.resetProgress
);

/**
 * Manually mark module as complete
 * POST /api/v1/admin/education/users/:user_id/complete
 * Body: { module: string, reason: string }
 */
router.post(
  "/education/users/:user_id/complete",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.markComplete
);

// --- SECURITY MONITORING ---

/**
 * Get login security statistics
 * GET /api/v1/admin/security/stats
 */
router.get(
  "/security/stats",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.getSecurityStats
);

/**
 * List users with security issues
 * GET /api/v1/admin/security/issues
 * Query: { issue_type?: "locked" | "failed_logins" | "unverified", limit?, offset? }
 */
router.get(
  "/security/issues",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.listSecurityIssues
);

/**
 * Unlock user account
 * POST /api/v1/admin/security/users/:user_id/unlock
 */
router.post(
  "/security/users/:user_id/unlock",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.unlockAccount
);

/**
 * Reset failed login attempts
 * POST /api/v1/admin/security/users/:user_id/reset-attempts
 */
router.post(
  "/security/users/:user_id/reset-attempts",
  authenticate,
  authorizeAdmin,
  adminEducationAuthController.resetLoginAttempts
);

module.exports = router;
