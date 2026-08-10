// src/middleware/agentAuth.js
const { Agent } = require("../models");
const { ApiError } = require("../utils/errors");
const { AGENT_STATUS, AGENT_TIERS, COUNTRIES, CURRENCIES, COUNTRY_DETAILS } = require("../config/constants");

const requireAgent = async (req, res, next) => {
  try {
    let agent = await Agent.findOne({
      where: { user_id: req.user.id },
    });

    // If agent profile does not exist yet, auto-create a pending agent profile for KYC
    if (!agent) {
      const userCountry =
        req.user?.country_code && Object.values(COUNTRIES).includes(req.user.country_code)
          ? req.user.country_code
          : COUNTRIES.NIGERIA;

      const userCurrency = COUNTRY_DETAILS[userCountry]?.currency || CURRENCIES.NGN;

      const defaultWithdrawalAddress =
        req.user?.wallet_address && /^0x[a-fA-F0-9]{40}$/.test(req.user.wallet_address)
          ? req.user.wallet_address
          : "0x0000000000000000000000000000000000000000";

      agent = await Agent.create({
        user_id: req.user.id,
        country: userCountry,
        currency: userCurrency,
        withdrawal_address: defaultWithdrawalAddress,
        status: AGENT_STATUS.PENDING,
        tier: AGENT_TIERS.STARTER,
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
