'use strict';

const mongoose = require('mongoose');

// ── Enum Constants ────────────────────────────────────────────────────────────

const CATEGORIES = [
  'pothole',
  'garbage',
  'water_leakage',
  'broken_street_light',
  'drainage',
  'road_damage',
  'encroachment',
  'park_maintenance',
  'noise_pollution',
  'air_pollution',
  'other',
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUSES = ['pending', 'verified', 'in_progress', 'resolved', 'rejected', 'closed'];

// ── Sub-schemas ───────────────────────────────────────────────────────────────

/**
 * Each status change is recorded as an immutable audit entry.
 */
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters.'],
      default: '',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Community verification votes.
 */
const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vote: {
      type: String,
      enum: ['confirm', 'deny'],
      required: true,
    },
    comment: {
      type: String,
      maxlength: [300, 'Comment cannot exceed 300 characters.'],
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ── Main Issue Schema ─────────────────────────────────────────────────────────

const issueSchema = new mongoose.Schema(
  {
    // ── Core Fields ───────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters.'],
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      minlength: [10, 'Description must be at least 10 characters.'],
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    // Additional images array (supports multi-photo upload)
    images: [
      {
        url: { type: String, required: true },
        filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Location ──────────────────────────────────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required.'],
        validate: {
          validator: (v) =>
            Array.isArray(v) &&
            v.length === 2 &&
            v[0] >= -180 && v[0] <= 180 &&
            v[1] >= -90  && v[1] <= 90,
          message: 'Coordinates must be [longitude, latitude] with valid ranges.',
        },
      },
      address: { type: String, trim: true, default: null },
      city:    { type: String, trim: true, default: null },
      ward:    { type: String, trim: true, default: null },
      landmark:{ type: String, trim: true, default: null },
    },

    // ── Classification ────────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: { values: CATEGORIES, message: '{VALUE} is not a valid category.' },
    },
    severity: {
      type: String,
      required: [true, 'Severity is required.'],
      enum: { values: SEVERITIES, message: '{VALUE} is not a valid severity level.' },
      default: 'medium',
    },
    priority: {
      type: String,
      required: [true, 'Priority is required.'],
      enum: { values: PRIORITIES, message: '{VALUE} is not a valid priority.' },
      default: 'medium',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: '{VALUE} is not a valid status.' },
      default: 'pending',
    },

    // ── Ownership ─────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter (createdBy) is required.'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── AI Analysis (Gemini) ──────────────────────────────────────────────────
    aiAnalysis: {
      detectedCategory: { type: String, default: null },
      confidence:       { type: Number, min: 0, max: 1, default: null },
      summary:          { type: String, default: null },
      suggestedSeverity:{ type: String, default: null },
      tags:             [{ type: String }],
      analyzedAt:       { type: Date, default: null },
    },

    // ── Community Engagement ──────────────────────────────────────────────────
    verifications: [verificationSchema],
    confirmCount:  { type: Number, default: 0, min: 0 },
    denyCount:     { type: Number, default: 0, min: 0 },

    upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0, min: 0 },

    // ── Audit Trail ───────────────────────────────────────────────────────────
    statusHistory: [statusHistorySchema],

    // ── Resolution ────────────────────────────────────────────────────────────
    resolvedAt:     { type: Date, default: null },
    resolutionNote: { type: String, maxlength: 1000, default: '' },

    // ── Prediction Metadata ───────────────────────────────────────────────────
    isPredicted:     { type: Boolean, default: false },
    predictionScore: { type: Number, min: 0, max: 1, default: null },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1, category: 1 });
issueSchema.index({ createdBy: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ 'location.city': 1, status: 1 });
issueSchema.index({ priority: 1, status: 1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────

/**
 * isResolved: convenience boolean
 */
issueSchema.virtual('isResolved').get(function () {
  return this.status === 'resolved';
});

/**
 * ageInDays: how long ago this issue was reported
 */
issueSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.createdAt) / 86400000);
});

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Append an audit entry whenever status changes on an existing document.
 * Also sets resolvedAt when the issue is marked resolved.
 */
issueSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });

    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
  }
  next();
});

// ── Model ─────────────────────────────────────────────────────────────────────

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;
