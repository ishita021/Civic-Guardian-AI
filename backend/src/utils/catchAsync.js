'use strict';

/**
 * Wraps an async route handler and forwards any errors to Express's next().
 * Eliminates repetitive try/catch blocks in controllers.
 *
 * @param {Function} fn - Async express route handler
 * @returns {Function} Express middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
