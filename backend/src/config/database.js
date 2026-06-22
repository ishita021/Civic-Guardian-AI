'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Establishes a connection to MongoDB using the URI from environment variables.
 * Implements retry logic with exponential backoff.
 */
const connectDB = async (retries = 5, delay = 3000) => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    logger.error('MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  const options = {
    // Connection pool
    maxPoolSize: 10,
    minPoolSize: 2,
    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    // Keep alive
    heartbeatFrequencyMS: 10000,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(MONGO_URI, options);
      logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

      // Connection event listeners
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected.');
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });

      return conn;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);

      if (attempt === retries) {
        logger.error('All MongoDB connection attempts failed. Exiting.');
        throw err;
      }

      const backoff = delay * attempt;
      logger.info(`Retrying in ${backoff / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
};

module.exports = connectDB;
