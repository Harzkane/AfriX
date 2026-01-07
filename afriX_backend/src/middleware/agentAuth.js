// src/middleware/agentAuth.js
const { Agent } = require("../models");
const { ApiError } = require("../utils/errors");
const { AGENT_STATUS } = require("../config/constants");

const requireAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findOne({
      where: { user_id: req.user.id },
    });

    if (!agent) {
      throw new ApiError(
        "Agent profile not found. Please register as an agent first.",
        403
      );
    }

    //  if (agent.status !== AGENT_STATUS.ACTIVE) {
    //   throw new ApiError(`Agent not active. Status: ${agent.status}`, 403);
    // }

    // Status check removed to allow PENDING/UNDER_REVIEW agents to access profile/KYC
    // Individual services (mint/burn) should enforce ACTIVE status where needed

    req.agent = agent; // Attach for use in controllers
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAgent };
