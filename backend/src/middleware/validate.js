'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware: Reads express-validator results and sends a 422 if any errors exist.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join('. ');

    return next(new AppError(messages, 422));
  }

  next();
};

module.exports = validate;
