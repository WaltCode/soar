// loaders/redis.js
const Redis = require('ioredis');
const config = require('config');
const { logger } = require('../libs/logger');

let redisClient;

async function loadRedis() {
  const url = config.get('redisUrl');
  redisClient = new Redis(url, {
    maxRetriesPerRequest: 5,
    retryStrategy: (times) => Math.min(times * 50, 2000), // fail fast in prod if Redis down
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  try {
    await redisClient.ping();
    logger.info('Redis ping successful');
    global.redisClient = redisClient;
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
    throw err;
  }
}

module.exports = loadRedis;