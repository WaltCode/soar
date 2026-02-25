const connect  = require('../connect/redis');
const { logger } = require('../libs/logger');

async function loadRedis() {
  try {
    global.redisClient = await connect();
  } catch (err) {
    logger.error('Redis loader failed', err);
    throw err;
  }
}

module.exports = loadRedis;