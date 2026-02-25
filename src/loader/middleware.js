const fs = require('fs');
const path = require('path');
const { logger } = require('../libs/logger');

async function loadMiddlewares(app) {
  const dir = path.join(__dirname, '../mws');
  fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => {
    const mw = require(path.join(dir, f));
    if (typeof mw === 'function') app.use(mw);
    logger.info(`Loaded mw: ${f}`);
  });
}

module.exports = loadMiddlewares;