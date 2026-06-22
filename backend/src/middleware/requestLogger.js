'use strict';

const logger = require('../config/logger');

/**
 * Logs every incoming HTTP request with method, URL, IP, and response time.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`
    );
  });

  next();
};

module.exports = requestLogger;
