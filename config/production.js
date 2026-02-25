module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  cors: { origin: '*' },
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
    max: process.env.RATE_LIMIT_MAX || 100
  },
  cacheTTL: 300 // 5 min
};