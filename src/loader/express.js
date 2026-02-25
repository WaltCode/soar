// loaders/express.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('config');
const { logger } = require('../libs/logger');

async function loadExpress(app) {
  // Security headers
  app.use(helmet());

  // CORS (restrict in prod)
  app.use(cors({
    origin: config.get('cors.origin') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting (global + can override per-route)
  const limiter = rateLimit({
    windowMs: config.get('rateLimit.windowMs') || 15 * 60 * 1000,
    max: config.get('rateLimit.max') || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 429, message: 'Too Many Requests' } },
  });
  app.use(limiter);

  // Body parsing (already in app.js usually, but ensure)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Optional: request logging in dev
  if (config.util.getEnv('NODE_ENV') !== 'production') {
    const morgan = require('morgan');
    app.use(morgan('dev'));
  }

  logger.info('Express middleware & config loaded');
}

module.exports = loadExpress;