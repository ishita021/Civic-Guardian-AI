'use strict';

const express = require('express');
const { body, query } = require('express-validator');
const issueController = require('../controllers/issueController');
const { protect, restrictTo } = require('../middleware/auth');
const validate  = require('../middleware/validate');
const upload    = require('../middleware/upload');

const router = express.Router();

// All issue routes require a valid JWT
router.use(protect);

// ── Validation Rule Sets ──────────────────────────────────────────────────────

const createIssueRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ min: 5, max: 150 }).withMessage('Title must be 5–150 characters.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters.'),
  body('category')
    .notEmpty().withMessage('Category is required.')
    .isIn([
      'pothole', 'garbage', 'water_leakage', 'broken_street_light', 'drainage',
      'road_damage', 'encroachment', 'park_maintenance', 'noise_pollution',
      'air_pollution', 'other',
    ]).withMessage('Invalid category.'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity.'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority.'),
  body('location')
    .notEmpty().withMessage('Location is required.'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Location coordinates must be [longitude, latitude].'),
];

const updateStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['pending', 'verified', 'in_progress', 'resolved', 'rejected', 'closed'])
    .withMessage('Invalid status value.'),
  body('note')
    .optional()
    .isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters.'),
];

const verifyVoteRules = [
  body('vote')
    .notEmpty().withMessage('Vote is required.')
    .isIn(['confirm', 'deny']).withMessage('Vote must be "confirm" or "deny".'),
  body('comment')
    .optional()
    .isLength({ max: 300 }).withMessage('Comment cannot exceed 300 characters.'),
];

const nearbyRules = [
  query('lng').notEmpty().withMessage('Longitude (lng) is required.').isFloat({ min: -180, max: 180 }),
  query('lat').notEmpty().withMessage('Latitude (lat) is required.').isFloat({ min: -90,  max:  90 }),
  query('radius').optional().isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be 0.1–100 km.'),
];

// ── Geo Query ─────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/issues/nearby
 * @desc   Issues within a radius (must be declared before /:id)
 */
router.get('/nearby', nearbyRules, validate, issueController.getNearbyIssues);

// ── Collection Routes ─────────────────────────────────────────────────────────

router
  .route('/')
  /**
   * @route  GET /api/v1/issues
   * @desc   List all issues (filterable, sortable, paginated)
   * Supported query params:
   *   status, category, severity, priority
   *   sort=<field> (default: -createdAt)
   *   page=<n>, limit=<n> (default: 20)
   *   fields=<comma-separated fieldnames>
   */
  .get(issueController.getAllIssues)

  /**
   * @route  POST /api/v1/issues
   * @desc   Report a new civic issue
   * Supports multipart/form-data (up to 5 images) OR JSON body with imageUrl.
   */
  .post(
    upload.array('images', 5),
    createIssueRules,
    validate,
    issueController.createIssue
  );

// ── Single Resource Routes ────────────────────────────────────────────────────

router
  .route('/:id')
  /**
   * @route  GET /api/v1/issues/:id
   * @desc   Get full issue details
   */
  .get(issueController.getIssue)

  /**
   * @route  PATCH /api/v1/issues/:id
   * @desc   Edit issue fields (reporter or admin)
   */
  .patch(issueController.updateIssue)

  /**
   * @route  DELETE /api/v1/issues/:id
   * @desc   Delete an issue (reporter or admin)
   */
  .delete(issueController.deleteIssue);

/**
 * @route  PUT /api/v1/issues/:id/status
 * @desc   Update issue status (moderator / admin only)
 */
router.put(
  '/:id/status',
  restrictTo('admin', 'moderator'),
  updateStatusRules,
  validate,
  issueController.updateIssueStatus
);

/**
 * @route  POST /api/v1/issues/:id/verify
 * @desc   Submit a community verification vote
 */
router.post(
  '/:id/verify',
  verifyVoteRules,
  validate,
  issueController.verifyIssue
);

/**
 * @route  POST /api/v1/issues/:id/upvote
 * @desc   Toggle upvote on an issue
 */
router.post('/:id/upvote', issueController.upvoteIssue);

module.exports = router;
