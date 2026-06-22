'use strict';

const express = require('express');
const { body } = require('express-validator');
const issueController = require('../controllers/issueController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

// All issue routes require authentication
router.use(protect);

// ── Geo Query ─────────────────────────────────────────────────────────────────
router.get('/nearby', issueController.getNearbyIssues);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router
  .route('/')
  .get(issueController.getAllIssues)
  .post(
    upload.array('images', 5),
    [
      body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 150 }),
      body('description').notEmpty().withMessage('Description is required.').isLength({ max: 2000 }),
      body('category').notEmpty().withMessage('Category is required.'),
      body('location').notEmpty().withMessage('Location is required.'),
    ],
    validate,
    issueController.createIssue
  );

router
  .route('/:id')
  .get(issueController.getIssue)
  .patch(issueController.updateIssue)
  .delete(issueController.deleteIssue);

// ── Status Update (admin/moderator) ──────────────────────────────────────────
router.patch(
  '/:id/status',
  restrictTo('admin', 'moderator'),
  issueController.updateIssueStatus
);

// ── Community Verification ────────────────────────────────────────────────────
router.post(
  '/:id/verify',
  [
    body('vote').isIn(['confirm', 'deny']).withMessage('Vote must be confirm or deny.'),
  ],
  validate,
  issueController.verifyIssue
);

// ── Upvote ────────────────────────────────────────────────────────────────────
router.post('/:id/upvote', issueController.upvoteIssue);

module.exports = router;
