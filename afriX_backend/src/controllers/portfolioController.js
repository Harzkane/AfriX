// File: src/controllers/portfolioController.js
const portfolioService = require("../services/portfolioService");

/**
 * Portfolio Controller
 *
 * Handles client requests for portfolio snapshot history and analytics.
 */
const portfolioController = {
  /**
   * Get historical portfolio snapshots for the user
   * GET /api/v1/portfolio/history
   * Query: { days } (default is 7)
   */
  getHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 7;

      const result = await portfolioService.getHistory(userId, days);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = portfolioController;
