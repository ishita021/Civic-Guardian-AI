'use strict';

/**
 * ============================================================
 *  Verification Model
 *  Stores each community vote as a standalone document so we
 *  can query votes independently (leaderboards, audits, etc.)
 *  while the Issue document keeps denormalised counters for
 *  fast reads.
 * ============================================================
 */

const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    // ── References ────────────────────────────────────────────────────────────
    issueId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Issue',
      required: [true, 'issueId is required.'],
      index:    true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required.'],
      index:    true,
    },

    // ── Vote ──────────────────────────────────────────────────────────────────
    /**
     * vote: 'verify'  — citizen confirms the issue is real
     *       'reject'  — citizen disputes the issue
     */
    vote: {
      type:     String,
      enum:     { values: ['verify', 'reject'], message: 'Vote must be "verify" or "reject".' },
      required: [true, 'Vote is required.'],
    },

    // ── Optional context ──────────────────────────────────────────────────────
    comment: {
      type:      String,
      trim:      true,
      maxlength: [300, 'Comment cannot exceed 300 characters.'],
      default:   '',
    },

    // ── Voter trust at time of vote (snapshot) ────────────────────────────────
    // Storing a snapshot avoids re-calculating historical confidence scores
    voterTrustScore: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },
  },
  {
    timestamps: true,   // createdAt, updatedAt
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound Indexes ──────────────────────────────────────────────────────────

// One vote per user per issue — enforced at DB level
verificationSchema.index({ issueId: 1, userId: 1 }, { unique: true });

// For listing all votes on an issue ordered by time
verificationSchema.index({ issueId: 1, createdAt: -1 });

// For listing all votes cast by a user
verificationSchema.index({ userId: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;
