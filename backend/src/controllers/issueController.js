'use strict';

const Issue = require('../models/Issue');
const User  = require('../models/User');
const AppError  = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/ApiFeatures');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds the array of image objects from multer-uploaded files.
 * Falls back gracefully when no files are present.
 */
const buildImageList = (files = []) =>
  files.map((f) => ({
    url: `/uploads/${f.filename}`,
    filename: f.filename,
  }));

/**
 * Increments a user's civic activity counters and recalculates trustScore.
 */
const rewardUser = async (userId, { reportDelta = 0, verifyDelta = 0, scoreDelta = 0 } = {}) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.issuesReported += reportDelta;
  user.issuesVerified += verifyDelta;
  user.civicScore     += scoreDelta;
  user.recalculateTrustScore();
  await user.save({ validateBeforeSave: false });
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @route  POST /api/v1/issues
 * @desc   Create a new civic issue report
 * @access Private
 */
exports.createIssue = catchAsync(async (req, res) => {
  const { title, description, category, severity, priority, location, imageUrl } = req.body;

  // Handle file uploads (multipart) — falls back to imageUrl string field
  const uploadedImages = buildImageList(req.files || []);
  const primaryImageUrl = uploadedImages.length
    ? uploadedImages[0].url
    : (imageUrl || null);

  const issue = await Issue.create({
    title,
    description,
    category,
    severity:  severity  || 'medium',
    priority:  priority  || 'medium',
    location,
    imageUrl:  primaryImageUrl,
    images:    uploadedImages,
    createdBy: req.user._id,
    statusHistory: [
      { status: 'pending', changedBy: req.user._id },
    ],
  });

  // Reward the reporter: +10 civic score, +1 issue reported, recalc trust
  await rewardUser(req.user._id, { reportDelta: 1, scoreDelta: 10 });

  res.status(201).json({
    success: true,
    message: 'Issue reported successfully.',
    data: { issue },
  });
});

/**
 * @route  GET /api/v1/issues
 * @desc   List all issues with filtering, sorting, field selection & pagination.
 *         Supports: ?status=pending&category=pothole&sort=-createdAt&page=1&limit=20
 * @access Private
 */
exports.getAllIssues = catchAsync(async (req, res) => {
  const features = new ApiFeatures(
    Issue.find().populate('createdBy', 'name avatar trustScore trustLevel'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [issues, total] = await Promise.all([
    features.query,
    Issue.countDocuments(features.filterQuery),
  ]);

  res.status(200).json({
    success: true,
    results: issues.length,
    total,
    data: { issues },
  });
});

/**
 * @route  GET /api/v1/issues/:id
 * @desc   Get a single issue by ID (full detail with populated references)
 * @access Private
 */
exports.getIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id)
    .populate('createdBy',  'name avatar civicScore trustScore trustLevel')
    .populate('assignedTo', 'name email role')
    .populate('verifications.user', 'name avatar trustScore');

  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: { issue },
  });
});

/**
 * @route  PUT /api/v1/issues/:id/status
 * @desc   Update the status of an issue (moderator / admin only)
 * @access Private — moderator, admin
 *
 * Body: { status, note }
 */
exports.updateIssueStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  if (!status) {
    return next(new AppError('Status is required.', 400));
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  // Record audit entry before saving
  issue.statusHistory.push({
    status,
    changedBy: req.user._id,
    note: note || '',
    changedAt: new Date(),
  });

  issue.status = status;

  if (status === 'resolved') {
    issue.resolvedAt     = new Date();
    issue.resolutionNote = note || '';
  }

  await issue.save();

  res.status(200).json({
    success: true,
    message: `Issue status updated to "${status}".`,
    data: { issue },
  });
});

// ── Additional Useful Endpoints ───────────────────────────────────────────────

/**
 * @route  GET /api/v1/issues/nearby
 * @desc   Find issues near a coordinate
 *         Query: ?lng=<lng>&lat=<lat>&radius=<km, default 5>&status=<optional>
 * @access Private
 */
exports.getNearbyIssues = catchAsync(async (req, res) => {
  const { lng, lat, radius = 5, status } = req.query;

  const radiusInRadians = parseFloat(radius) / 6378.1;

  const query = {
    location: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
      },
    },
  };

  if (status) query.status = status;

  const issues = await Issue.find(query)
    .populate('createdBy', 'name avatar trustScore')
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({
    success: true,
    results: issues.length,
    data: { issues },
  });
});

/**
 * @route  POST /api/v1/issues/:id/verify
 * @desc   Submit a community verification vote (confirm | deny)
 * @access Private
 *
 * Body: { vote: 'confirm' | 'deny', comment? }
 */
exports.verifyIssue = catchAsync(async (req, res, next) => {
  const { vote, comment } = req.body;

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  if (issue.createdBy.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot verify your own issue.', 403));
  }

  const alreadyVoted = issue.verifications.some(
    (v) => v.user.toString() === req.user._id.toString()
  );
  if (alreadyVoted) {
    return next(new AppError('You have already submitted a vote for this issue.', 409));
  }

  issue.verifications.push({ user: req.user._id, vote, comment: comment || '' });

  if (vote === 'confirm') {
    issue.confirmCount += 1;
  } else {
    issue.denyCount += 1;
  }

  // Auto-verify after 3 community confirms
  if (issue.confirmCount >= 3 && issue.status === 'pending') {
    issue.status = 'verified';
    issue.statusHistory.push({
      status:    'verified',
      changedBy: req.user._id,
      note:      'Auto-verified by community consensus.',
      changedAt: new Date(),
    });
  }

  await issue.save();

  // Reward the verifier
  await rewardUser(req.user._id, { verifyDelta: 1, scoreDelta: 5 });

  res.status(200).json({
    success: true,
    message: 'Verification vote submitted.',
    data: {
      confirmCount: issue.confirmCount,
      denyCount:    issue.denyCount,
      status:       issue.status,
    },
  });
});

/**
 * @route  POST /api/v1/issues/:id/upvote
 * @desc   Toggle an upvote on an issue
 * @access Private
 */
exports.upvoteIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  const userId = req.user._id.toString();
  const idx    = issue.upvotes.findIndex((id) => id.toString() === userId);

  if (idx === -1) {
    issue.upvotes.push(req.user._id);
    issue.upvoteCount += 1;
  } else {
    issue.upvotes.splice(idx, 1);
    issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
  }

  await issue.save();

  res.status(200).json({
    success: true,
    data: { upvoteCount: issue.upvoteCount },
  });
});

/**
 * @route  PATCH /api/v1/issues/:id
 * @desc   Update issue details (reporter or admin only)
 * @access Private
 */
exports.updateIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  const isOwner = issue.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this issue.', 403));
  }

  const editable = ['title', 'description', 'severity', 'priority', 'location', 'imageUrl'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) issue[field] = req.body[field];
  });

  await issue.save();

  res.status(200).json({
    success: true,
    message: 'Issue updated.',
    data: { issue },
  });
});

/**
 * @route  DELETE /api/v1/issues/:id
 * @desc   Delete an issue (reporter or admin only)
 * @access Private
 */
exports.deleteIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  const isOwner = issue.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this issue.', 403));
  }

  await issue.deleteOne();

  res.status(204).json({ success: true, data: null });
});
