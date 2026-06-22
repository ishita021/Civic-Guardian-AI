'use strict';

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Prediction title is required.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Prediction description is required.'],
    },
    category: {
      type: String,
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
      city: { type: String },
      ward: { type: String },
    },
    basedOnIssues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
      },
    ],
    aiInsight: {
      type: String,
      default: null,
    },
    predictedFailureDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'expired'],
      default: 'active',
    },
    generatedBy: {
      type: String,
      enum: ['gemini', 'rule-engine', 'manual'],
      default: 'gemini',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

predictionSchema.index({ location: '2dsphere' });
predictionSchema.index({ riskLevel: 1, status: 1 });
predictionSchema.index({ createdAt: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;
