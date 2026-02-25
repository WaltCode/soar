const { logger } = require('../libs/logger');

const loadMongo = require('./mongoose');
const loadRedis = require('./redis');
const loadManagers = require('./manager');
const loadMiddlewares = require('./middleware');
const loadValidators = require('./validator');
const loadSwagger = require('./swagger');

async function initLoaders(app) {
  try {
    await loadMongo();
    await loadRedis();
    await loadManagers();
    await loadValidators();
    await loadMiddlewares(app);
    // await loadSwagger(app);
    logger.info('Loaders initialized');
  } catch (err) {
    throw err;
  }
}

module.exports = initLoaders;