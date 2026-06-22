'use strict';

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Token Extraction ──────────────────────────────────────────────────────────

/**
 * Pulls the raw JWT string from the Authorization header.
 * Supports: "Bearer <token>"
 */
const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.split(' ')[1];
  }
  return null;
};

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * protect
 * Verifies the JWT, loads the user, and attaches them to req.user.
 * Rejects requests with expired, invalid, or missing tokens.
 */
const protect = catchAsync(async (req, _res, next) => {
  // 1. Extract token
  const token = extractToken(req);
  if (!token) {
    return next(
      new AppError('Authentication required. Please log in to continue.', 401)
    );
  }

  // 2. Verify signature & expiry
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Confirm the user account still exists
  const currentUser = await User.findById(decoded.id).select('+passwordChangedAt +isActive');
  if (!currentUser) {
    return next(
      new AppError('The account associated with this token no longer exists.', 401)
    );
  }

  // 4. Confirm the account is active
  if (!currentUser.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  // 5. Reject if password was changed after this token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was recently changed. Please log in again.', 401)
    );
  }

  // Attach user to request for downstream use
  req.user = currentUser;
  next();
});

/**
 * restrictTo(...roles)
 * Factory that returns a middleware allowing only the specified roles.
 *
 * @param  {...string} roles  e.g. 'admin', 'moderator'
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. Requires one of the following roles: ${roles.join(', ')}.`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, restrictTo };
