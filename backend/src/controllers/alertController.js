'use strict';

const Alert = require('../models/Alert');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/v1/alerts
 */
exports.createAlert = catchAsync(async (req, res) => {
  const alert = await Alert.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: { alert } });
});

/**
 * GET /api/v1/alerts
 */
exports.getAllAlerts = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.city) filter['location.city'] = req.query.city;

  const alerts = await Alert.find(filter)
    .populate('createdBy', 'name role')
    .populate('relatedIssue', 'title category status')
    .sort('-createdAt');

  res.status(200).json({ success: true, results: alerts.length, data: { alerts } });
});

/**
 * GET /api/v1/alerts/nearby
 */
exports.getNearbyAlerts = catchAsync(async (req, res) => {
  const { lng, lat, radius = 10 } = req.query;
  const radiusInRadians = radius / 6378.1;

  const alerts = await Alert.find({
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
      },
    },
  })
    .populate('createdBy', 'name role')
    .sort('-createdAt');

  res.status(200).json({ success: true, results: alerts.length, data: { alerts } });
});

/**
 * GET /api/v1/alerts/:id
 */
exports.getAlert = catchAsync(async (req, res, next) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('createdBy', 'name role');

  if (!alert) return next(new AppError('Alert not found.', 404));
  res.status(200).json({ success: true, data: { alert } });
});

/**
 * PATCH /api/v1/alerts/:id
 */
exports.updateAlert = catchAsync(async (req, res, next) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!alert) return next(new AppError('Alert not found.', 404));
  res.status(200).json({ success: true, data: { alert } });
});

/**
 * DELETE /api/v1/alerts/:id
 */
exports.deleteAlert = catchAsync(async (req, res, next) => {
  const alert = await Alert.findByIdAndDelete(req.params.id);
  if (!alert) return next(new AppError('Alert not found.', 404));
  res.status(204).json({ success: true, data: null });
});
