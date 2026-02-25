require('dotenv').config(); 

const config = require('config');
const app = require('./app');
const { logger } = require('./libs/logger');
const initLoaders = require('./loader');

(async () => {
  try {
    await initLoaders(app);
    logger.info('All loaders initialized successfully');

    const port = config.get('port') || 3000;
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port} (single process)`);
    });

    global.server = server;

  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
})();

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  try {
    if (global.server) {
      await new Promise((resolve) => {
        global.server.close(() => {
          logger.info('HTTP server closed – no new connections accepted');
          resolve();
        });
      });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false); 
      logger.info('MongoDB connection closed cleanly');
    }

    const redisClient = global.redisClient;
    if (redisClient && redisClient.status !== 'end') {
      await redisClient.quit(); 
      logger.info('Redis connection closed cleanly');
    }

    logger.info('Graceful shutdown complete. Exiting.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));  

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});