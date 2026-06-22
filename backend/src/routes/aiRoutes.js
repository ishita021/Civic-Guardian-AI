'use strict';

const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// Analyze a single issue description
router.post(
  '/analyze-issue',
  [body('description').notEmpty().withMessage('Description is required.')],
  validate,
  aiController.analyzeIssue
);

// Generate city-level civic insights
router.get('/insight', aiController.generateCivicInsight);

// Predict infrastructure risk (admin/moderator only)
router.post(
  '/predict-risk',
  restrictTo('admin', 'moderator'),
  [
    body('category').notEmpty().withMessage('Category is required.'),
    body('city').notEmpty().withMessage('City is required.'),
  ],
  validate,
  aiController.predictRisk
);

module.exports = router;
