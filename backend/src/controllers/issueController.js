'use strict';

/**
 * ============================================================
 *  Civic Guardian AI — Issue Controller
 *  File: src/controllers/issueController.js
 *
 *  Every new issue is automatically enriched by Gemini AI via
 *  geminiService.analyzeIssue(). The AI call is non-blocking —
 *  if Gemini is unavailable the issue is still saved with
 *  fallback AI fields (confidence: 0, aiError: <message>).
 * ============================================================
 */

const Issue       = require('../models/Issue');
const User        = require('../models/User');
const AppError    = require('../utils/AppError');
const catchAsync  = require('../utils/catchAsync');
const ApiFeatures = require('../utils/ApiFeatures');
const { analyzeIssue, reAnalyzeIssue } = require('../services/geminiService');

// ── Private Helpers ───────────────────────────────────────────────────────────

/**
 * Maps multer file objects to the images sub-document shape.
 */
const buildImageList = (files = []) =>
  files.map((f) => ({
    url:      `/uploads/${f.filename}`,
    filename: f.filename,
  }));

/**
 * Increments civic activity counters for a user and recalculates
 * their trustScore. Uses validateBeforeSave:false because we are
 * only touching numeric fields, not the full document.
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
 * @route   POST /api/v1/issues
 * @desc    Report a new civic issue.
 *          After saving, Gemini AI automatically enriches the issue
 *          with category, priority, department, and suggested resolution.
 * @access  Private
 *
 * Supports both JSON body and multipart/form-data (images).
 *
 * Body fields:
 *   title, description, category, severity, priority,
 *   location: { coordinates:[lng,lat], address, city, ward },
 *   imageUrl  (optional string — use for URL-based images)
 */
exports.createIssue = catchAsync(async (req, res) => {
  const {
    title, description, category,
    severity, priority, location, imageUrl,
  } = req.body;

  // ── 1. Handle image uploads ──────────────────────────────────────────────
  const uploadedImages  = buildImageList(req.files || []);
  const primaryImageUrl = uploadedImages.length
    ? uploadedImages[0].url
    : (imageUrl || null);

  // ── 2. Save issue with pending status ────────────────────────────────────
  const issue = await Issue.create({
    title,
    description,
    category,
    severity:  severity || 'medium',
    priority:  priority || 'medium',
    location,
    imageUrl:  primaryImageUrl,
    images:    uploadedImages,
    createdBy: req.user._id,
    statusHistory: [{ status: 'pending', changedBy: req.user._id }],
  });

  // ── 3. Gemini AI enrichment (non-blocking) ────────────────────────────────
  // analyzeIssue() NEVER throws — it returns a fallback on any error.
  const ai = await analyzeIssue({ title, description, category });

  // ── 4. Persist AI metadata back onto the issue ────────────────────────────
  issue.aiCategory   = ai.aiCategory;
  issue.aiPriority   = ai.aiPriority;
  issue.aiConfidence = ai.aiConfidence;
  issue.aiDepartment = ai.aiDepartment;
  issue.aiSuggestion = ai.aiSuggestion;
  issue.aiTags       = ai.aiTags || [];
  issue.aiAnalyzedAt = ai.aiAnalyzedAt;
  issue.aiError      = ai.aiError;   // null on success, message on failure

  // If AI detected a higher priority than user submitted, upgrade it
  const priorityRank = { low: 1, medium: 2, high: 3, urgent: 4 };
  const userRank     = priorityRank[issue.priority]   || 2;
  const aiRank       = priorityRank[ai.aiPriority]    || 0;
  if (aiRank > userRank) {
    issue.priority = ai.aiPriority;
  }

  await issue.save({ validateBeforeSave: false });

  // ── 5. Reward reporter ────────────────────────────────────────────────────
  await rewardUser(req.user._id, { reportDelta: 1, scoreDelta: 10 });

  // ── 6. Respond ────────────────────────────────────────────────────────────
  res.status(201).json({
    success: true,
    message: 'Issue reported and analyzed by Gemini AI.',
    aiAnalysis: {
      category:   issue.aiCategory,
      priority:   issue.aiPriority,
      confidence: issue.aiConfidence,
      department: issue.aiDepartment,
      suggestion: issue.aiSuggestion,
      tags:       issue.aiTags,
      analyzedAt: issue.aiAnalyzedAt,
      // Show warning in response if AI failed (does NOT block the issue save)
      warning: ai.aiError
        ? `AI analysis failed: ${ai.aiError}. Issue saved with defaults.`
        : undefined,
    },
    data: { issue },
  });
});

/**
 * @route   GET /api/v1/issues
 * @desc    List all issues — filterable, sortable, paginated.
 * @access  Private
 *
 * Supported query params:
 *   status, category, severity, priority, aiPriority, aiCategory
 *   sort=-createdAt  (default)
 *   page=1, limit=20
 *   fields=title,status,aiPriority
 */
exports.getAllIssues = catchAsync(async (req, res) => {
  const features = new ApiFeatures(
    Issue.find().populate('createdBy', 'name avatar trustScore trustLevel'),
    req.query
  )
    .filter()
    .search([
      'title',
      'description',
      'category',
      'status',
      'priority',
      'severity',
      'location.address',
      'location.city',
      'location.ward',
      'aiCategory',
      'aiDepartment',
      'aiTags',
    ])
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
 * @route   GET /api/v1/issues/:id
 * @desc    Get full details of a single issue including AI metadata.
 * @access  Private
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
 * @route   PUT /api/v1/issues/:id/status
 * @desc    Update the lifecycle status of an issue.
 * @access  Private — moderator, admin
 *
 * Body: { status: 'in_progress' | 'resolved' | ..., note?: string }
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

  issue.statusHistory.push({
    status,
    changedBy: req.user._id,
    note:      note || '',
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

/**
 * @route   POST /api/v1/issues/:id/reanalyze
 * @desc    Re-run Gemini AI analysis on an existing issue.
 *          Useful after an issue description has been updated.
 * @access  Private — moderator, admin
 */
exports.reanalyzeIssue = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${req.params.id}`, 404));
  }

  const ai = await reAnalyzeIssue(issue);

  issue.aiCategory   = ai.aiCategory;
  issue.aiPriority   = ai.aiPriority;
  issue.aiConfidence = ai.aiConfidence;
  issue.aiDepartment = ai.aiDepartment;
  issue.aiSuggestion = ai.aiSuggestion;
  issue.aiTags       = ai.aiTags || [];
  issue.aiAnalyzedAt = ai.aiAnalyzedAt;
  issue.aiError      = ai.aiError;

  await issue.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Issue re-analyzed by Gemini AI.',
    aiAnalysis: {
      category:   issue.aiCategory,
      priority:   issue.aiPriority,
      confidence: issue.aiConfidence,
      department: issue.aiDepartment,
      suggestion: issue.aiSuggestion,
      tags:       issue.aiTags,
      analyzedAt: issue.aiAnalyzedAt,
    },
    data: { issue },
  });
});

/**
 * @route   GET /api/v1/issues/nearby
 * @desc    Find issues within a radius using geospatial query.
 *          Query: ?lng=&lat=&radius=5&status=pending
 * @access  Private
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
 * @route   POST /api/v1/issues/:id/verify
 * @desc    Submit a community verification vote (confirm | deny).
 *          Auto-verifies after 3 confirms.
 * @access  Private
 *
 * Body: { vote: 'confirm' | 'deny', comment?: string }
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

  vote === 'confirm' ? (issue.confirmCount += 1) : (issue.denyCount += 1);

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
 * @route   POST /api/v1/issues/:id/upvote
 * @desc    Toggle upvote on an issue.
 * @access  Private
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
 * @route   PATCH /api/v1/issues/:id
 * @desc    Edit issue fields (reporter or admin only).
 * @access  Private
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
 * @route   DELETE /api/v1/issues/:id
 * @desc    Delete an issue (reporter or admin only).
 * @access  Private
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
