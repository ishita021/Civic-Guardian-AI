'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom log format for development console
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console transport
    new transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? combine(json())
          : combine(colorize(), devFormat),
    }),

    // Error log file
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: combine(json()),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new transports.File({
      filename: path.join('logs', 'combined.log'),
      format: combine(json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
