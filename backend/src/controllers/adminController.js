'use strict';

/**
 * ================================================================
 *  Civic Guardian AI — Admin Controller
 *  File: src/controllers/adminController.js
 *
 *  All handlers here are protected by adminOnly middleware.
 * ================================================================
 */

const Issue      = require('../models/Issue');
const User       = require('../models/User');
const Alert      = require('../models/Alert');
const AppError   = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a pagination meta object */
const paginate = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

// ── Dashboard Overview ────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard
 * Full analytics snapshot: counts, breakdowns, trends, top reporters, recent activity.
 */
exports.getDashboardOverview = catchAsync(async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

  const [
    totalIssues,
    pendingIssues,
    verifiedIssues,
    inProgressIssues,
    resolvedIssues,
    rejectedIssues,
    totalUsers,
    newUsersThisWeek,
    activeAlerts,
    categoryBreakdown,
    statusBreakdown,
    severityBreakdown,
    priorityBreakdown,
    resolutionTrend,
    topReporters,
    recentIssues,
  ] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: 'pending' }),
    Issue.countDocuments({ status: 'verified' }),
    Issue.countDocuments({ status: 'in_progress' }),
    Issue.countDocuments({ status: 'resolved' }),
    Issue.countDocuments({ status: 'rejected' }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Alert.countDocuments({ isActive: true }),

    // Category distribution
    Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Status distribution
    Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Severity distribution
    Issue.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),

    // Priority distribution
    Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),

    // 30-day daily resolution trend
    Issue.aggregate([
      {
        $match: {
          resolvedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } },
          resolved: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top 5 reporters by civic score
    User.find({ isActive: true })
      .select('name email avatar civicScore issuesReported role')
      .sort('-civicScore')
      .limit(5),

    // 10 most recent issues
    Issue.find()
      .select('title status priority category createdAt createdBy')
      .populate('createdBy', 'name avatar')
      .sort('-createdAt')
      .limit(10),
  ]);

  const resolutionRate =
    totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalIssues,
        pendingIssues,
        verifiedIssues,
        inProgressIssues,
        resolvedIssues,
        rejectedIssues,
        totalUsers,
        newUsersThisWeek,
        activeAlerts,
        resolutionRate: parseFloat(resolutionRate),
      },
      analytics: {
        categoryBreakdown,
        statusBreakdown,
        severityBreakdown,
        priorityBreakdown,
        resolutionTrend,
      },
      topReporters,
      recentActivity: recentIssues,
    },
  });
});

// ── User Management ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/users
 * Paginated, searchable, filterable user list.
 *
 * Query params:
 *   page, limit, search (name/email), role, sort
 */
exports.getUsers = catchAsync(async (req, res) => {
  const page   = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip   = (page - 1) * limit;
  const { search, role, sort = '-createdAt' } = req.query;

  const filter = {};
  if (role)   filter.role = role;
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data:    { users },
    meta:    paginate(total, page, limit),
  });
});

/**
 * PATCH /api/v1/admin/users/:id
 * Update a user's role or active status.
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  const allowed = ['role', 'isActive'];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields to update.', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) return next(new AppError('User not found.', 404));

  res.status(200).json({ success: true, data: { user } });
});

/**
 * DELETE /api/v1/admin/users/:id
 * Soft-delete by setting isActive = false.
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!user) return next(new AppError('User not found.', 404));

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully.',
  });
});

// ── Complaint / Issue Management ──────────────────────────────────────────────

/**
 * GET /api/v1/admin/complaints
 * Paginated, searchable, filterable, sortable issue list.
 *
 * Query params:
 *   page, limit, search (title), status, category, priority, severity, sort
 */
exports.getComplaints = catchAsync(async (req, res) => {
  const page   = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip   = (page - 1) * limit;
  const {
    search, status, category, priority, severity,
    sort = '-createdAt',
  } = req.query;

  const filter = {};
  if (status)   filter.status   = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (severity) filter.severity = severity;
  if (search)   filter.title    = { $regex: search, $options: 'i' };

  const [issues, total] = await Promise.all([
    Issue.find(filter)
      .populate('createdBy',  'name email avatar')
      .populate('assignedTo', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Issue.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data:    { complaints: issues },
    meta:    paginate(total, page, limit),
  });
});

/**
 * PATCH /api/v1/admin/complaints/:id/assign
 * Assign a complaint to a moderator or admin user.
 * Body: { assignedTo: userId }
 */
exports.assignComplaint = catchAsync(async (req, res, next) => {
  const { assignedTo } = req.body;

  if (!assignedTo) {
    return next(new AppError('assignedTo (user ID) is required.', 400));
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee) return next(new AppError('Assignee user not found.', 404));

  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    { assignedTo },
    { new: true, runValidators: false }
  )
    .populate('createdBy',  'name email')
    .populate('assignedTo', 'name email role');

  if (!issue) return next(new AppError('Complaint not found.', 404));

  res.status(200).json({
    success: true,
    message: `Complaint assigned to ${assignee.name}.`,
    data:    { complaint: issue },
  });
});

/**
 * PATCH /api/v1/admin/complaints/:id/status
 * Change complaint status (admin override — bypasses ownership check).
 * Body: { status, note? }
 */
exports.updateComplaintStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  if (!status) return next(new AppError('status is required.', 400));

  const issue = await Issue.findById(req.params.id);
  if (!issue)  return next(new AppError('Complaint not found.', 404));

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
    message: `Complaint status changed to "${status}".`,
    data:    { complaint: issue },
  });
});

/**
 * DELETE /api/v1/admin/complaints/:id
 * Permanently delete a complaint.
 */
exports.deleteComplaint = catchAsync(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return next(new AppError('Complaint not found.', 404));

  await issue.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Complaint permanently deleted.',
  });
});
