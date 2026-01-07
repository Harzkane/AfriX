// File: src/routes/disputes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const disputeController = require("../controllers/disputeController");

/**
 * Dispute endpoints
 * Base: /api/disputes
 */

router.post("/", authenticate, disputeController.open);
router.get("/", authenticate, authorizeAdmin, disputeController.list);
router.get("/:id", authenticate, disputeController.get);
router.post("/:id/resolve", authenticate, authorizeAdmin, disputeController.resolve);

module.exports = router;
