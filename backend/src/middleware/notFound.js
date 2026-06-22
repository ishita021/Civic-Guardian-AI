'use strict';

const AppError = require('../utils/AppError');

/**
 * 404 Not Found middleware.
 * Catches all requests that don't match a defined route.
 */
const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

module.exports = notFound;
