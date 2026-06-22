'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'moderator', 'admin'],
      default: 'citizen',
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: { type: String, default: null },
      city: { type: String, default: null },
      ward: { type: String, default: null },
    },
    civicScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    // trustScore: community trust rating (0–100) earned via verified reports & verifications
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    issuesReported: {
      type: Number,
      default: 0,
    },
    issuesVerified: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ location: '2dsphere' });

// ── Pre-save: Hash Password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Pre-save: Set passwordChangedAt ──────────────────────────────────────────
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // Ensure token is issued after this
  next();
});

// ── Virtuals ──────────────────────────────────────────────────────────────────

/**
 * trustLevel: human-readable label derived from trustScore
 */
userSchema.virtual('trustLevel').get(function () {
  if (this.trustScore >= 80) return 'guardian';
  if (this.trustScore >= 60) return 'trusted';
  if (this.trustScore >= 40) return 'active';
  if (this.trustScore >= 20) return 'newcomer';
  return 'unverified';
});

// ── Instance Methods ──────────────────────────────────────────────────────────

userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Recalculates trustScore based on civic activity.
 * trustScore is capped at 100.
 *   - Each verified report   → +5 pts
 *   - Each verification cast → +3 pts
 *   - civicScore bonus       → log10(civicScore+1) * 10 (max ~20 pts)
 */
userSchema.methods.recalculateTrustScore = function () {
  const reportPts  = Math.min(this.issuesReported  * 5,  40);
  const verifyPts  = Math.min(this.issuesVerified  * 3,  30);
  const civicBonus = Math.min(Math.log10(this.civicScore + 1) * 10, 20);
  this.trustScore  = Math.min(Math.round(reportPts + verifyPts + civicBonus), 100);
  return this.trustScore;
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
