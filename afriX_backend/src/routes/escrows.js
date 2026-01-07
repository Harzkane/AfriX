// File: src/routes/escrows.js
const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const escrowController = require("../controllers/escrowController");

/**
 * Escrow endpoints
 * Base: /api/escrows
 */

router.post("/lock", authenticate, escrowController.lockForBurn); // user locks tokens
router.post("/:id/finalize", authenticate, escrowController.finalize); // agent/admin finalizes
router.post("/:id/refund", authenticate, authorizeAdmin, escrowController.refund); // admin refund
router.get("/:id", authenticate, escrowController.get);

module.exports = router;
