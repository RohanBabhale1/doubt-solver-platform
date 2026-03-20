const redis = require('../config/redis');

const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[Cache] getCache error:', err.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.error('[Cache] setCache error:', err.message);
  }
};

const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[Cache] deleteCache error:', err.message);
  }
};

const deletePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    console.error('[Cache] deletePattern error:', err.message);
  }
};

module.exports = { getCache, setCache, deleteCache, deletePattern };