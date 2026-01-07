// src/routes/requests.js
const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const { authenticate } = require("../middleware/auth");
const { requireAgent } = require("../middleware/agentAuth");
const { upload } = require("../middleware/upload");

// === LIST REQUESTS (for users) ===
router.get("/user", authenticate, requestController.getUserRequests);

// === LIST REQUESTS (for agents) ===
router.get("/", authenticate, requestController.getAgentRequests);

// === MINT FLOW ===
router.post("/mint", authenticate, requestController.createMintRequest);
router.post("/mint/:request_id/proof", authenticate, upload.single("proof"), requestController.uploadMintProof);
router.get("/mint/:request_id", authenticate, requestController.getMintRequest);
router.post("/mint/confirm", authenticate, requireAgent, requestController.confirmMint);
router.post("/mint/reject", authenticate, requireAgent, requestController.rejectMint);

// === BURN FLOW ===
router.post("/burn", authenticate, requestController.createBurnRequest);
router.post("/burn/reject", authenticate, requireAgent, requestController.rejectBurn);
router.post("/burn/:request_id/fiat-proof", authenticate, requireAgent, upload.single("proof"), requestController.confirmFiatSent);
router.get("/burn/:request_id", authenticate, requestController.getBurnRequest);
router.post("/burn/confirm", authenticate, requestController.confirmBurn);


module.exports = router;