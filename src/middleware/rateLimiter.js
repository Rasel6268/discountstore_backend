/**
 * In-memory rate limiter for upload endpoints
 */
const rateLimitMap = new Map();

// Clean up expired rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * Create a rate limiter middleware
 * @param {Object} options
 * @param {number} [options.windowMs=15*60*1000] - Window size in ms (default 15 minutes)
 * @param {number} [options.max=100] - Max requests in window
 * @param {string} [options.message='Too many upload requests, please try again later.']
 */
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const message = options.message || 'Too many upload requests, please try again later.';

  return (req, res, next) => {
    // Identify by authenticated user ID if available, otherwise by IP
    const identifier = req.user?._id?.toString() || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const now = Date.now();

    let record = rateLimitMap.get(identifier);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitMap.set(identifier, record);
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
};

module.exports = {
  uploadRateLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 120, // 120 requests per 15 min per admin
    message: 'Upload rate limit exceeded. Please wait before uploading more images.',
  }),
  createRateLimiter,
};
