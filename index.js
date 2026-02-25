require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const config = require('config');
const app = require('./app');
const { logger } = require('./libs/logger');
const initLoaders = require('./loader');
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Master ${process.pid} is running. Forking ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    logger.error(`Worker ${worker.process.pid} died. Forking new...`);
    cluster.fork();
  });
} else {
  (async () => {
    try {
      await initLoaders(app);
      const port = config.get('port') || 3000;
      const server = app.listen(port, () => logger.info(`Worker ${process.pid} started on port ${port}`));
      global.server = server;
    } catch (err) {
      logger.error('Startup error:', err);
      process.exit(1);
    }
  })();
}

let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}. Shutting down...`);
  try {
    if (global.server) {
      await new Promise(resolve => global.server.close(resolve));
      logger.info('HTTP server closed');
    }
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      logger.info('Mongoose closed');
    }
    const redisClient = global.redisClient;
    if (redisClient && redisClient.status !== 'end') {
      await redisClient.quit();
      logger.info('Redis closed');
    }
    process.exit(0);
  } catch (err) {
    logger.error('Shutdown error:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', err => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});