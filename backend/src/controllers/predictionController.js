'use strict';

const Prediction = require('../models/Prediction');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/predictions
 */
exports.getAllPredictions = catchAsync(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.city) filter['location.city'] = req.query.city;
  if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
  if (req.query.category) filter.category = req.query.category;

  const predictions = await Prediction.find(filter)
    .populate('basedOnIssues', 'title category status')
    .sort('-riskScore -createdAt');

  res.status(200).json({ success: true, results: predictions.length, data: { predictions } });
});

/**
 * GET /api/v1/predictions/:id
 */
exports.getPrediction = catchAsync(async (req, res, next) => {
  const prediction = await Prediction.findById(req.params.id).populate(
    'basedOnIssues',
    'title category severity status'
  );
  if (!prediction) return next(new AppError('Prediction not found.', 404));
  res.status(200).json({ success: true, data: { prediction } });
});

/**
 * POST /api/v1/predictions  (admin/moderator)
 */
exports.createPrediction = catchAsync(async (req, res) => {
  const prediction = await Prediction.create({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: { prediction } });
});

/**
 * PATCH /api/v1/predictions/:id/status  (admin/moderator)
 */
exports.updatePredictionStatus = catchAsync(async (req, res, next) => {
  const prediction = await Prediction.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!prediction) return next(new AppError('Prediction not found.', 404));
  res.status(200).json({ success: true, data: { prediction } });
});
