'use strict';

const express  = require('express');
const { body } = require('express-validator');
const verificationController = require('../controllers/verificationController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

// All verification routes require authentication
router.use(protect);

// ── Validation ────────────────────────────────────────────────────────────────

const voteRules = [
  body('vote')
    .notEmpty().withMessage('Vote is required.')
    .isIn(['verify', 'reject']).withMessage('Vote must be "verify" or "reject".'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Comment cannot exceed 300 characters.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @route  POST   /api/v1/verifications/:issueId
 * @desc   Cast a verify or reject vote
 * @access Private
 */
router.post('/:issueId', voteRules, validate, verificationController.castVote);

/**
 * @route  GET    /api/v1/verifications/:issueId
 * @desc   Get all votes + confidence score for an issue
 * @access Private
 */
router.get('/:issueId', verificationController.getIssueVerifications);

/**
 * @route  GET    /api/v1/verifications/:issueId/my-vote
 * @desc   Check if the current user has already voted
 * @access Private
 */
router.get('/:issueId/my-vote', verificationController.getMyVote);

/**
 * @route  DELETE /api/v1/verifications/:issueId
 * @desc   Retract a vote (within 10 minutes)
 * @access Private
 */
router.delete('/:issueId', verificationController.retractVote);

/**
 * @route  GET    /api/v1/verifications/user/:userId
 * @desc   All votes cast by a user (admin only)
 * @access Private — admin
 */
router.get('/user/:userId', restrictTo('admin'), verificationController.getUserVotes);

module.exports = router;
