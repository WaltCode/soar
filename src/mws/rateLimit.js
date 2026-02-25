const rateLimit = require('express-rate-limit');
const config = require('config');

module.exports = rateLimit({
  windowMs: config.get('rateLimit.windowMs'),
  max: config.get('rateLimit.max'),
  message: { error: { code: 429, message: 'Too many requests' } }
});