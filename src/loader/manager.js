const fs = require('fs');
const path = require('path');
const { logger } = require('../libs/logger');

async function loadManagers() {
  const dir = path.join(__dirname, '../managers');
  fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => {
    require(path.join(dir, f));
    logger.info(`Loaded manager: ${f}`);
  });
}

module.exports = loadManagers;