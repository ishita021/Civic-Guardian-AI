'use strict';

/**
 * Standardized JSON response helper.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code
 * @param {Object} options
 * @param {string}  [options.message]
 * @param {*}       [options.data]
 * @param {number}  [options.results]
 * @param {number}  [options.total]
 */
const sendResponse = (res, statusCode, { message, data, results, total } = {}) => {
  const body = { success: statusCode < 400 };

  if (message) body.message = message;
  if (results !== undefined) body.results = results;
  if (total !== undefined) body.total = total;
  if (data !== undefined) body.data = data;

  return res.status(statusCode).json(body);
};

module.exports = sendResponse;
