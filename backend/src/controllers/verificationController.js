'use strict';

/**
 * ============================================================
 *  Verification Controller
 *  Handles community vote logic for civic issues.
 *
 *  Confidence Score formula:
 *    Each vote is weighted by the voter's trustScore (0–100).
 *    confidence = (weightedVerifies / totalWeight) * 100
 *
 *  Auto-verification threshold:
 *    An issue is auto-marked "verified" when:
 *      - At least 3 verify votes exist
 *      - confidence >= 60%
 * ============================================================
 */

const Verification = require('../models/Verification');
const Issue        = require('../models/Issue');
const User         = require('../models/User');
const AppError     = require('../utils/AppError');
const catchAsync   = require('../utils/catchAsync');

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum verify votes before auto-verification is considered */
const MIN_VERIFY_VOTES = 3;

/** Confidence threshold (0–100) required for auto-verification */
const AUTO_VERIFY_THRESHOLD = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calculates a trust-weighted confidence score for an issue.
 *
 * Algorithm:
 *   - Each vote has a weight equal to the voter's trustScore (min 1).
 *   - verifyWeight = sum of weights for all 'verify' votes
 *   - totalWeight  = sum of all vote weights
 *   - confidence   = (verifyWeight / totalWeight) * 100, rounded
 *
 * @param {Array} votes - Array of Verification documents
 * @returns {{ confidence: number, verifyCount: number, rejectCount: number, totalWeight: number }}
 */
const calculateConfidence = (votes) => {
  if (!votes.length) {
    return { confidence: 0, verifyCount: 0, rejectCount: 0, totalWeight: 0 };
  }

  let verifyWeight = 0;
  let totalWeight  = 0;
  let verifyCount  = 0;
  let rejectCount  = 0;

  for (const v of votes) {
    // Use at least 1 so unscored users still contribute
    const weight = Math.max(v.voterTrustScore || 1, 1);
    totalWeight += weight;

    if (v.vote === 'verify') {
      verifyWeight += weight;
      verifyCount  += 1;
    } else {
      rejectCount += 1;
    }
  }

  const confidence = Math.round((verifyWeight / totalWeight) * 100);
  return { confidence, verifyCount, rejectCount, totalWeight };
};

/**
 * Rewards a verifier by incrementing their civic counters and
 * recalculating their trustScore.
 */
const rewardVerifier = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;
  user.issuesVerified += 1;
  user.civicScore     += 5;
  user.recalculateTrustScore();
  await user.save({ validateBeforeSave: false });
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v1/verifications/:issueId
 * @desc    Cast a verify or reject vote on an issue.
 *          Updates denormalised counters on the Issue document.
 *          Auto-verifies the issue if thresholds are met.
 * @access  Private — any authenticated citizen
 *
 * Body: { vote: 'verify' | 'reject', comment?: string }
 */
exports.castVote = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { vote, comment } = req.body;

  // ── 1. Load issue ──────────────────────────────────────────────────────────
  const issue = await Issue.findById(issueId);
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${issueId}`, 404));
  }

  // ── 2. Business rules ──────────────────────────────────────────────────────
  if (issue.createdBy.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot vote on your own issue.', 403));
  }

  if (['resolved', 'closed', 'rejected'].includes(issue.status)) {
    return next(new AppError(`Cannot vote on an issue with status "${issue.status}".`, 400));
  }

  // ── 3. Create verification (unique index prevents duplicates) ──────────────
  let verification;
  try {
    verification = await Verification.create({
      issueId,
      userId:          req.user._id,
      vote,
      comment:         comment || '',
      voterTrustScore: req.user.trustScore || 0,
    });
  } catch (err) {
    // MongoDB unique constraint violation (code 11000)
    if (err.code === 11000) {
      return next(new AppError('You have already voted on this issue.', 409));
    }
    throw err;
  }

  // ── 4. Recalculate confidence from all votes ───────────────────────────────
  const allVotes = await Verification.find({ issueId });
  const { confidence, verifyCount, rejectCount } = calculateConfidence(allVotes);

  // ── 5. Update denormalised counters on the Issue ───────────────────────────
  issue.confirmCount = verifyCount;
  issue.denyCount    = rejectCount;

  // ── 6. Auto-verification check ────────────────────────────────────────────
  let autoVerified = false;
  if (
    issue.status === 'pending' &&
    verifyCount >= MIN_VERIFY_VOTES &&
    confidence  >= AUTO_VERIFY_THRESHOLD
  ) {
    issue.status = 'verified';
    issue.statusHistory.push({
      status:    'verified',
      changedBy: req.user._id,
      note:      `Auto-verified — ${verifyCount} votes, ${confidence}% confidence.`,
      changedAt: new Date(),
    });
    autoVerified = true;
  }

  await issue.save({ validateBeforeSave: false });

  // ── 7. Reward the voter ────────────────────────────────────────────────────
  await rewardVerifier(req.user._id);

  // ── 8. Respond ────────────────────────────────────────────────────────────
  res.status(201).json({
    success: true,
    message: autoVerified
      ? `Vote recorded. Issue auto-verified with ${confidence}% community confidence.`
      : 'Vote recorded successfully.',
    data: {
      verification,
      stats: {
        verifyCount,
        rejectCount,
        totalVotes:  allVotes.length,
        confidence,
        issueStatus: issue.status,
        autoVerified,
      },
    },
  });
});

/**
 * @route   GET /api/v1/verifications/:issueId
 * @desc    Get all votes for an issue with live confidence score.
 * @access  Private
 */
exports.getIssueVerifications = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;

  const issue = await Issue.findById(issueId).select('title status confirmCount denyCount');
  if (!issue) {
    return next(new AppError(`No issue found with ID: ${issueId}`, 404));
  }

  const votes = await Verification.find({ issueId })
    .populate('userId', 'name avatar trustScore trustLevel')
    .sort('-createdAt');

  const { confidence, verifyCount, rejectCount } = calculateConfidence(votes);

  res.status(200).json({
    success: true,
    data: {
      issue: {
        id:     issue._id,
        title:  issue.title,
        status: issue.status,
      },
      stats: {
        verifyCount,
        rejectCount,
        totalVotes: votes.length,
        confidence,
      },
      votes,
    },
  });
});

/**
 * @route   GET /api/v1/verifications/:issueId/my-vote
 * @desc    Check whether the current user has already voted on this issue.
 * @access  Private
 */
exports.getMyVote = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;

  const vote = await Verification.findOne({
    issueId,
    userId: req.user._id,
  });

  res.status(200).json({
    success: true,
    data: {
      hasVoted: !!vote,
      vote:     vote || null,
    },
  });
});

/**
 * @route   DELETE /api/v1/verifications/:issueId
 * @desc    Retract a vote (only within 10 minutes of casting).
 * @access  Private
 */
exports.retractVote = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;

  const vote = await Verification.findOne({ issueId, userId: req.user._id });
  if (!vote) {
    return next(new AppError('You have not voted on this issue.', 404));
  }

  // Only allow retraction within 10 minutes
  const minutesSinceVote = (Date.now() - vote.createdAt) / 60000;
  if (minutesSinceVote > 10) {
    return next(new AppError('Votes can only be retracted within 10 minutes of casting.', 403));
  }

  await vote.deleteOne();

  // Recalculate and sync counters
  const allVotes = await Verification.find({ issueId });
  const { confidence, verifyCount, rejectCount } = calculateConfidence(allVotes);

  await Issue.findByIdAndUpdate(issueId, {
    confirmCount: verifyCount,
    denyCount:    rejectCount,
  });

  res.status(200).json({
    success: true,
    message: 'Vote retracted.',
    data: {
      stats: { verifyCount, rejectCount, totalVotes: allVotes.length, confidence },
    },
  });
});

/**
 * @route   GET /api/v1/verifications/user/:userId
 * @desc    Get all votes cast by a specific user (admin view).
 * @access  Private — admin only
 */
exports.getUserVotes = catchAsync(async (req, res) => {
  const votes = await Verification.find({ userId: req.params.userId })
    .populate('issueId', 'title status category aiPriority')
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({
    success: true,
    results: votes.length,
    data: { votes },
  });
});
