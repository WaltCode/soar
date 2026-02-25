const { getRedisClient } = require('../connect/redis');
const { logger } = require('../libs/logger');
const config = require('config');

const TTL = config.get('cacheTTL');

async function get(key) {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Cache get error:', err);
    return null;
  }
}

async function set(key, value, ttl = TTL) {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.error('Cache set error:', err);
  }
}

async function del(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    logger.error('Cache del error:', err);
  }
}

module.exports = { get, set, del };