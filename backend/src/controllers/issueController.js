'use strict';

const Issue = require('../models/Issue');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/ApiFeatures');

/**
 * POST /api/v1/issues
 */
exports.createIssue = catchAsync(async (req, res) => {
  const { title, description, category, severity, location } = req.body;

  // Attach uploaded image URLs if any
  const images = req.files
    ? req.files.map((f) => ({ url: `/uploads/${f.filename}`, filename: f.filename }))
    : [];

  const issue = await Issue.create({
    title,
    description,
    category,
    severity,
    location,
    images,
    reportedBy: req.user._id,
    statusHistory: [{ status: 'pending', changedBy: req.user._id }],
  });

  // Increment user's reported count and civic score
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { issuesReported: 1, civicScore: 10 },
  });

  res.status(201).json({ success: true, data: { issue } });
});

/**
 * GET /api/v1/issues
 */
exports.getAllIssues = catchAsync(async (req, res) => {
  const features = new ApiFeatures(
    Issue.find().populate('reportedBy', 'name avatar civicScore'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const issues = await features.query;
  const total = await Issue.countDocuments(features.filterQuery);

  res.status(200).json({
    success: true,
    results: issues.length,
    total,
    data: { issues },
  });
});

/**
 * GET /api/v1/issues/:id
 */
exports.getIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id)
    .populate('reportedBy', 'name avatar civicScore')
    .populate('assignedTo', 'name email')
    .populate('verifications.user', 'name avatar');

  if (!issue) return next(new AppError('Issue not found.', 404));

  res.status(200).json({ success: true, data: { issue } });
});

/**
 * PATCH /api/v1/issues/:id
 */
exports.updateIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return next(new AppError('Issue not found.', 404));

  // Only reporter or admin can update
  if (
    issue.reportedBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorized to update this issue.', 403));
  }

  const allowedFields = ['title', 'description', 'severity', 'location'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) issue[field] = req.body[field];
  });

  await issue.save();
  res.status(200).json({ success: true, data: { issue } });
});

/**
 * PATCH /api/v1/issues/:id/status
 */
exports.updateIssueStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  const issue = await Issue.findById(req.params.id);
  if (!issue) return next(new AppError('Issue not found.', 404));

  issue.status = status;
  issue.statusHistory.push({ status, changedBy: req.user._id, note });
  if (status === 'resolved') {
    issue.resolvedAt = new Date();
    issue.resolutionNote = note || '';
  }

  await issue.save();
  res.status(200).json({ success: true, data: { issue } });
});

/**
 * POST /api/v1/issues/:id/verify
 */
exports.verifyIssue = catchAsync(async (req, res, next) => {
  const { vote, comment } = req.body;

  const issue = await Issue.findById(req.params.id);
  if (!issue) return next(new AppError('Issue not found.', 404));

  // Prevent reporter from verifying their own issue
  if (issue.reportedBy.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot verify your own issue.', 403));
  }

  // Prevent double voting
  const alreadyVoted = issue.verifications.some(
    (v) => v.user.toString() === req.user._id.toString()
  );
  if (alreadyVoted) {
    return next(new AppError('You have already submitted a verification vote.', 409));
  }

  issue.verifications.push({ user: req.user._id, vote, comment });

  if (vote === 'confirm') issue.confirmCount += 1;
  else issue.denyCount += 1;

  // Auto-verify if 3+ confirms
  if (issue.confirmCount >= 3 && issue.status === 'pending') {
    issue.status = 'verified';
    issue.statusHistory.push({ status: 'verified', changedBy: req.user._id, note: 'Auto-verified by community.' });
  }

  await issue.save();

  // Reward verifier
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { issuesVerified: 1, civicScore: 5 },
  });

  res.status(200).json({ success: true, data: { issue } });
});

/**
 * POST /api/v1/issues/:id/upvote
 */
exports.upvoteIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return next(new AppError('Issue not found.', 404));

  const userId = req.user._id;
  const alreadyUpvoted = issue.upvotes.some((id) => id.toString() === userId.toString());

  if (alreadyUpvoted) {
    issue.upvotes = issue.upvotes.filter((id) => id.toString() !== userId.toString());
    issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
  } else {
    issue.upvotes.push(userId);
    issue.upvoteCount += 1;
  }

  await issue.save();
  res.status(200).json({ success: true, data: { upvoteCount: issue.upvoteCount } });
});

/**
 * DELETE /api/v1/issues/:id
 */
exports.deleteIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return next(new AppError('Issue not found.', 404));

  if (
    issue.reportedBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorized to delete this issue.', 403));
  }

  await issue.deleteOne();
  res.status(204).json({ success: true, data: null });
});

/**
 * GET /api/v1/issues/nearby
 * Query: lng, lat, radius (in km, default 5)
 */
exports.getNearbyIssues = catchAsync(async (req, res) => {
  const { lng, lat, radius = 5, status } = req.query;

  const radiusInRadians = radius / 6378.1; // Earth radius in km

  const query = {
    location: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
      },
    },
  };

  if (status) query.status = status;

  const issues = await Issue.find(query)
    .populate('reportedBy', 'name avatar')
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({ success: true, results: issues.length, data: { issues } });
});
