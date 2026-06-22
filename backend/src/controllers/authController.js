'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Helpers ───────────────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Strips sensitive fields and sends token + user in a consistent shape.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Creates a new citizen account and returns a JWT.
 */
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('Email is already registered.', 409));
  }

  const user = await User.create({ name, email, password, phone });
  sendTokenResponse(user, 201, res);
});

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns a JWT.
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  // +password because it is select:false on the schema
  const user = await User.findOne({ email }).select('+password +isActive');

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact support.', 403));
  }

  sendTokenResponse(user, 200, res);
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
exports.getMe = catchAsync(async (req, res) => {
  // req.user is already populated by the protect middleware
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * PATCH /api/v1/auth/update-password
 * Allows an authenticated user to change their password.
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  if (currentPassword === newPassword) {
    return next(new AppError('New password must differ from the current password.', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});
