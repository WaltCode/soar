const  connect  = require('../connect/mongoose');
const { logger } = require('../libs/logger');

async function loadMongo() {
  try {
    await connect();
  } catch (err) {
    logger.error('Mongo loader failed', err);
    throw err;
  }
}

module.exports = loadMongo;