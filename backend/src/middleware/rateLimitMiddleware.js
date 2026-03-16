const redis = require('../config/redis');

const createRateLimiter = (resource, limit, windowSeconds) => {
  return async (req, res, next) => {
    if (!req.user) return next();

    const key = `ratelimit:${req.user.userId}:${resource}`;

    try {
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > limit) {
        const ttl = await redis.ttl(key);
        return res.status(429).json({
          message: `Too many requests. Try again in ${Math.ceil(ttl / 60)} minutes.`,
          retryAfter: ttl
        });
      }

      next();
    } catch (err) {
      console.error('[RateLimit] Error:', err.message);
      next(); // Fail open — don't block users if Redis is down
    }
  };
};

const doubtRateLimit = createRateLimiter('doubts', 10, 3600);
const replyRateLimit = createRateLimiter('replies', 50, 3600);

module.exports = { doubtRateLimit, replyRateLimit };