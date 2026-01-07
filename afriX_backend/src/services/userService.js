// File: src/services/userService.js
const { Agent, User } = require("../models");
const { AGENT_STATUS } = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");

/**
 * Find available agents by country or user location.
 * @param {Object} options - Search filters
 * @param {string} [options.country] - Country code (e.g., 'NG')
 * @param {number} [options.limit] - Max number of agents to return
 * @returns {Promise<Array>} - List of matching agents
 */

async function findAgents({ country, limit = 10 }) {
  if (!country) {
    throw new ApiError("Country is required to find agents", 400);
  }

  const agents = await Agent.findAll({
    where: {
      status: AGENT_STATUS.ACTIVE,
      // Use Sequelize OR to allow either Agent.country matches or Agent.country is null (fallback to user)
      [Op.or]: [{ country }, { country: null }],
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "full_name",
          "email",
          "phone_number",
          "country_code",
        ],
        where: { country_code: country }, // fallback match if Agent.country is null
        required: true, // ensures at least the user matches the country
      },
    ],
    limit,
    order: [["rating", "DESC"]],
  });

  if (!agents || agents.length === 0) {
    throw new ApiError("No active agents found for this region", 404);
  }

  return agents;
}

module.exports = {
  findAgents,
};
