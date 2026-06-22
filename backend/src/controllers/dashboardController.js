'use strict';

const Issue = require('../models/Issue');
const User = require('../models/User');
const Alert = require('../models/Alert');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/dashboard/overview
 * Civic DNA Dashboard — aggregate stats
 */
exports.getOverview = catchAsync(async (_req, res) => {
  const [
    totalIssues,
    pendingIssues,
    resolvedIssues,
    inProgressIssues,
    totalUsers,
    activeAlerts,
    categoryBreakdown,
    severityBreakdown,
    resolutionTrend,
  ] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: 'pending' }),
    Issue.countDocuments({ status: 'resolved' }),
    Issue.countDocuments({ status: 'in_progress' }),
    User.countDocuments({ isActive: true }),
    Alert.countDocuments({ isActive: true }),

    // Category distribution
    Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Severity distribution
    Issue.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),

    // Last 30 days resolution trend
    Issue.aggregate([
      {
        $match: {
          status: 'resolved',
          resolvedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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
  ]);

  const resolutionRate =
    totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalIssues,
        pendingIssues,
        resolvedIssues,
        inProgressIssues,
        totalUsers,
        activeAlerts,
        resolutionRate: parseFloat(resolutionRate),
      },
      categoryBreakdown,
      severityBreakdown,
      resolutionTrend,
    },
  });
});

/**
 * GET /api/v1/dashboard/leaderboard
 * Top civic contributors by civic score
 */
exports.getLeaderboard = catchAsync(async (_req, res) => {
  const leaders = await User.find({ isActive: true })
    .select('name avatar civicScore issuesReported issuesVerified')
    .sort('-civicScore')
    .limit(10);

  res.status(200).json({ success: true, data: { leaders } });
});

/**
 * GET /api/v1/dashboard/heatmap
 * Returns geoJSON-ready data for issue heatmap
 */
exports.getHeatmapData = catchAsync(async (req, res) => {
  const { city, category } = req.query;

  const match = {};
  if (city) match['location.city'] = city;
  if (category) match.category = category;

  const issues = await Issue.find(match)
    .select('location.coordinates category severity status')
    .limit(500);

  const geoJson = {
    type: 'FeatureCollection',
    features: issues.map((issue) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: issue.location.coordinates,
      },
      properties: {
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
      },
    })),
  };

  res.status(200).json({ success: true, data: { geoJson } });
});
