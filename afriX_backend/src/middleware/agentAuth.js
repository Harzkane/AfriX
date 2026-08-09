// src/middleware/agentAuth.js
const { Agent } = require("../models");
const { ApiError } = require("../utils/errors");
const { AGENT_STATUS } = require("../config/constants");

const requireAgent = async (req, res, next) => {
  try {
    let agent = await Agent.findOne({
      where: { user_id: req.user.id },
    });

    // If agent profile does not exist yet, auto-create a pending agent profile for KYC
    if (!agent) {
      agent = await Agent.create({
        user_id: req.user.id,
        status: "pending",
        tier: "Starter",
        deposit_usd: 0,
        available_capacity: 0,
        is_verified: false,
      });
    }

    req.agent = agent; // Attach for use in controllers
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAgent };
