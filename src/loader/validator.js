const fs = require('fs');
const path = require('path');
const { logger } = require('../libs/logger');

async function loadValidators() {
  const dir = path.join(__dirname, '../libs/validation');
  fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => {
    require(path.join(dir, f));
    logger.info(`Loaded schema: ${f}`);
  });
}

module.exports = loadValidators;