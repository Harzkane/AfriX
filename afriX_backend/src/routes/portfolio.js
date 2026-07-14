// File: src/routes/portfolio.js
const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolioController");
const { authenticate } = require("../middleware/auth");

/**
 * @route   GET /api/v1/portfolio/history
 * @desc    Get user's historical portfolio snapshots and trend analysis
 * @access  Private
 */
router.get("/history", authenticate, portfolioController.getHistory);

module.exports = router;
