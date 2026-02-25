// loaders/mongoose.js
const mongoose = require('mongoose');
const config = require('config');
const { logger } = require('../libs/logger');

async function loadMongoose() {
  mongoose.set('strictQuery', true);
  const uri = config.get('mongoUri');
  const options = {
    maxPoolSize: 50,                // Prod: tune pool
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,                     // Prefer IPv4 in some environments
  };

  try {
    await mongoose.connect(uri, options);
    logger.info(`MongoDB connected → ${mongoose.connection.host}`);

    // Optional: health check ping
    await mongoose.connection.db.admin().ping();
    logger.info('MongoDB ping successful');

    // Handle disconnection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected – attempting reconnect');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', err);
    });

  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}

module.exports = loadMongoose;