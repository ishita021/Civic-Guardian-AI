'use strict';

const mongoose = require('mongoose');

const ISSUE_CATEGORIES = [
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

const ISSUE_STATUSES = ['pending', 'verified', 'in_progress', 'resolved', 'rejected', 'closed'];
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

const verificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['confirm', 'deny'], required: true },
    comment: { type: String, maxlength: 300, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ISSUE_STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 500, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Issue title is required.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: { values: ISSUE_CATEGORIES, message: 'Invalid category.' },
    },
    status: {
      type: String,
      enum: ISSUE_STATUSES,
      default: 'pending',
    },
    severity: {
      type: String,
      enum: { values: SEVERITY_LEVELS, message: 'Invalid severity level.' },
      default: 'medium',
    },
    // AI analysis from Gemini
    aiAnalysis: {
      detectedCategory: { type: String, default: null },
      confidence: { type: Number, min: 0, max: 1, default: null },
      summary: { type: String, default: null },
      suggestedSeverity: { type: String, default: null },
      tags: [{ type: String }],
      analyzedAt: { type: Date, default: null },
    },
    // Geospatial
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required.'],
      },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      ward: { type: String, trim: true },
      landmark: { type: String, trim: true },
    },
    // Media attachments
    images: [
      {
        url: { type: String, required: true },
        filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Reporter
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required.'],
    },
    // Assigned authority
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Community verification
    verifications: [verificationSchema],
    confirmCount: { type: Number, default: 0 },
    denyCount: { type: Number, default: 0 },
    // Status history for audit trail
    statusHistory: [statusHistorySchema],
    // Resolution
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, maxlength: 1000, default: '' },
    // Upvotes
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },
    // Prediction flag
    isPredicted: { type: Boolean, default: false },
    predictionScore: { type: Number, min: 0, max: 1, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1, category: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ 'location.city': 1, status: 1 });

// ── Pre-save: Track status history ───────────────────────────────────────────
issueSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({ status: this.status });
    if (this.status === 'resolved') {
      this.resolvedAt = new Date();
    }
  }
  next();
});

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;
