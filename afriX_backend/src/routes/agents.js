const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agentController");
const { authenticate } = require("../middleware/auth");
const { requireAgent } = require("../middleware/agentAuth");
const { upload } = require("../middleware/upload");


/**
 * Get Agent Profile
 * GET /api/agents/profile
 */
router.get("/profile", authenticate, requireAgent, agentController.getProfile);

/**
 * Update Agent Profile
 * PUT /api/agents/profile
 */
router.put("/profile", authenticate, requireAgent, agentController.updateProfile);

/**
 * Get Agent Dashboard
 * GET /api/agents/dashboard
 */
router.get("/dashboard", authenticate, requireAgent, agentController.getDashboard);

/**
 * List Active Agents
 * GET /api/agents/list
 */
router.get("/list", authenticate, agentController.listActiveAgents);




/**
 * Register as Agent
 * POST /api/agents/register
 */
router.post("/register", authenticate, agentController.register);

/**
 * Upload KYC documents
 * POST /api/agents/kyc/upload
 */
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

/**
 * Check KYC Status
 * GET /api/agents/kyc/status
 */
router.get("/kyc/status", authenticate, requireAgent, agentController.checkKycStatus);

/**
 * Resubmit KYC documents
 * PUT /api/agents/kyc/resubmit
 */
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

/**
 * Submit Deposit
 * POST /api/agents/deposit
 */
router.post("/deposit", authenticate, requireAgent, agentController.deposit);

/**
 * Create Withdrawal Request
 * POST /api/agents/withdraw-request
 */
router.post(
    "/withdraw-request",
    authenticate,
    requireAgent,
    agentController.createWithdrawalRequest
);

/**
 * Get Withdrawal Requests
 * GET /api/agents/withdraw-requests
 */
router.get(
    "/withdraw-requests",
    authenticate,
    requireAgent,
    agentController.getWithdrawalRequests
);

/**
 * Get Deposit History
 * GET /api/agents/deposit-history
 */
router.get(
    "/deposit-history",
    authenticate,
    requireAgent,
    agentController.getDepositHistory
);

/**
 * Get platform deposit address for agents
 * GET /api/agents/deposit-address
 */
router.get(
  "/deposit-address",
  authenticate,
  requireAgent,
  agentController.getDepositAddress
);

/**
 * Get Agent by ID
 * GET /api/agents/:agent_id
 */
router.get("/:agent_id", authenticate, agentController.getAgentById);

/**
 * Get Agent Reviews
 * GET /api/agents/:agent_id/reviews
 */
router.get(
    "/:agent_id/reviews",
    authenticate,
    agentController.getReviews
);

/**
 * Submit Review
 * POST /api/agents/review
 */
router.post(
    "/review",
    authenticate,
    agentController.submitReview
);

/**
 * Respond to Review
 * POST /api/agents/review/:review_id/respond
 */
router.post(
    "/review/:review_id/respond",
    authenticate,
    requireAgent,
    agentController.respondToReview
);

module.exports = router;
