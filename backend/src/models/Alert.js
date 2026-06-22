'use strict';

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    message: {
      type: String,
      required: [true, 'Alert message is required.'],
      maxlength: [1000, 'Message cannot exceed 1000 characters.'],
    },
    type: {
      type: String,
      enum: ['sos', 'info', 'warning', 'critical', 'resolved'],
      default: 'info',
    },
    category: {
      type: String,
      enum: ['infrastructure', 'safety', 'environment', 'community', 'general'],
      default: 'general',
    },
    // Geo-targeting
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], default: [0, 0] },
      city: { type: String, default: null },
      ward: { type: String, default: null },
    },
    radiusKm: {
      type: Number,
      default: 5, // Alert radius in kilometers
    },
    // Linked issue (optional)
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ isActive: 1, expiresAt: 1 });
alertSchema.index({ createdAt: -1 });

// Auto-expire: Mark inactive when expiresAt is reached
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
