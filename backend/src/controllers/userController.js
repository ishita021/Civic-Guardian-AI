'use strict';

const User = require('../models/User');
const Issue = require('../models/Issue');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/users  (admin)
 */
exports.getAllUsers = catchAsync(async (_req, res) => {
  const users = await User.find().select('-__v');
  res.status(200).json({ success: true, results: users.length, data: { users } });
});

/**
 * GET /api/v1/users/:id
 */
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: { user } });
});

/**
 * PATCH /api/v1/users/me
 */
exports.updateMe = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'phone', 'avatar', 'location'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: { user } });
});

/**
 * DELETE /api/v1/users/me
 */
exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  res.status(204).json({ success: true, data: null });
});

/**
 * GET /api/v1/users/:id/issues
 */
exports.getUserIssues = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  const issues = await Issue.find({ reportedBy: req.params.id })
    .sort('-createdAt')
    .select('-verifications -statusHistory');

  res.status(200).json({ success: true, results: issues.length, data: { issues } });
});

/**
 * PATCH /api/v1/users/:id/role  (admin)
 */
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: { user } });
});
