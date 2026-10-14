// src/utils/cache.js
const { redis, REDIS_ENABLED } = require("../config/redis");

const setCache = async (key, value, ttl) => {
  if (!REDIS_ENABLED || !redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error("Cache set error:", err);
  }
};

const getCache = async (key) => {
  if (!REDIS_ENABLED || !redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get error:", err);
    return null;
  }
};

const deleteCache = async (key) => {
  if (!REDIS_ENABLED || !redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Cache delete error:", err);
  }
};

/**
 * Blacklist a JWT so it is rejected by the authenticate middleware
 * even before its exp claim elapses.
 *
 * @param {string} token  - Raw JWT string
 * @param {number} expAt  - Unix timestamp (seconds) when the token expires
 */
const blacklistToken = async (token, expAt) => {
  if (!REDIS_ENABLED || !redis) return;
  try {
    const ttl = Math.max(1, expAt - Math.floor(Date.now() / 1000));
    // Store only a sentinel — value is irrelevant, TTL is what matters.
    await redis.setex(`bl:jwt:${token}`, ttl, "1");
  } catch (err) {
    console.error("Token blacklist set error:", err);
  }
};

/**
 * Returns true if the token has been explicitly revoked (e.g. on logout).
 *
 * @param {string} token - Raw JWT string
 * @returns {Promise<boolean>}
 */
const isTokenBlacklisted = async (token) => {
  if (!REDIS_ENABLED || !redis) return false;
  try {
    const val = await redis.get(`bl:jwt:${token}`);
    return val !== null;
  } catch (err) {
    console.error("Token blacklist check error:", err);
    return false; // fail-open (natural exp still enforced by verifyToken)
  }
};

module.exports = { setCache, getCache, deleteCache, blacklistToken, isTokenBlacklisted };
