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

module.exports = { setCache, getCache, deleteCache };
