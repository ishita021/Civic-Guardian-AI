'use strict';

const { getGeminiModel } = require('../config/gemini');
const Issue = require('../models/Issue');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/v1/ai/analyze-issue
 * Sends issue text/image to Gemini for AI categorization and severity detection.
 */
exports.analyzeIssue = catchAsync(async (req, res, next) => {
  const { description, issueId } = req.body;

  if (!description) {
    return next(new AppError('Please provide an issue description to analyze.', 400));
  }

  const model = getGeminiModel('gemini-1.5-flash');

  const prompt = `
You are an AI assistant for a civic issue reporting platform called "Civic Guardian AI".

Analyze the following civic issue description and respond in valid JSON only.

Issue Description:
"${description}"

Respond with:
{
  "detectedCategory": "<one of: pothole, garbage, water_leakage, broken_street_light, drainage, road_damage, encroachment, park_maintenance, noise_pollution, air_pollution, other>",
  "confidence": <float 0 to 1>,
  "suggestedSeverity": "<one of: low, medium, high, critical>",
  "summary": "<1-2 sentence plain English summary>",
  "tags": ["<tag1>", "<tag2>"],
  "urgencyReason": "<brief reason for the severity rating>"
}
`.trim();

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();

  // Parse JSON from Gemini response
  let analysis;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return next(new AppError('Failed to parse AI analysis response. Please try again.', 502));
  }

  // If an issueId is provided, persist the analysis
  if (issueId) {
    await Issue.findByIdAndUpdate(issueId, {
      aiAnalysis: {
        ...analysis,
        analyzedAt: new Date(),
      },
    });
  }

  res.status(200).json({ success: true, data: { analysis } });
});

/**
 * POST /api/v1/ai/generate-insight
 * Generates civic insights from aggregated issue data.
 */
exports.generateCivicInsight = catchAsync(async (req, res, next) => {
  const { city, ward } = req.query;

  if (!city) {
    return next(new AppError('City is required for generating civic insights.', 400));
  }

  const matchQuery = { 'location.city': city };
  if (ward) matchQuery['location.ward'] = ward;

  const stats = await Issue.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgSeverity: {
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$severity', 'low'] }, then: 1 },
                { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                { case: { $eq: ['$severity', 'high'] }, then: 3 },
                { case: { $eq: ['$severity', 'critical'] }, then: 4 },
              ],
              default: 1,
            },
          },
        },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  if (!stats.length) {
    return next(new AppError('Not enough data to generate insights for this location.', 404));
  }

  const model = getGeminiModel('gemini-1.5-flash');

  const prompt = `
You are a civic data analyst. Based on the following issue statistics for ${city}${ward ? `, ward ${ward}` : ''}:

${JSON.stringify(stats, null, 2)}

Generate a concise civic health report (3-4 sentences) covering:
1. The most critical issues.
2. Resolution efficiency.
3. One actionable recommendation.

Respond in plain English only (no markdown, no lists).
`.trim();

  const result = await model.generateContent(prompt);
  const insight = result.response.text().trim();

  res.status(200).json({
    success: true,
    data: { city, ward: ward || null, stats, insight },
  });
});

/**
 * POST /api/v1/ai/predict-risk
 * Uses Gemini to predict infrastructure failure risk based on historical issues.
 */
exports.predictRisk = catchAsync(async (req, res, next) => {
  const { category, city, ward } = req.body;

  if (!category || !city) {
    return next(new AppError('Category and city are required for risk prediction.', 400));
  }

  const recentIssues = await Issue.find({
    category,
    'location.city': city,
    ...(ward && { 'location.ward': ward }),
    createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
  })
    .select('title description severity status createdAt resolvedAt')
    .sort('-createdAt')
    .limit(20);

  const model = getGeminiModel('gemini-1.5-flash');

  const prompt = `
You are a predictive infrastructure analyst for "Civic Guardian AI".

Based on the following ${recentIssues.length} recent civic issues in ${city}${ward ? `, ${ward}` : ''} for category "${category}":

${JSON.stringify(recentIssues.map((i) => ({
    title: i.title,
    severity: i.severity,
    status: i.status,
    daysAgo: Math.floor((Date.now() - i.createdAt) / 86400000),
  })), null, 2)}

Predict the infrastructure failure risk and respond in valid JSON only:
{
  "riskScore": <float 0 to 1>,
  "riskLevel": "<low|medium|high|critical>",
  "predictedFailureDays": <integer, days until likely failure, null if not applicable>,
  "insight": "<2-3 sentence explanation>",
  "recommendation": "<one concrete action>"
}
`.trim();

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();

  let prediction;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    prediction = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return next(new AppError('Failed to parse AI prediction response.', 502));
  }

  res.status(200).json({
    success: true,
    data: { category, city, ward: ward || null, issuesSampled: recentIssues.length, prediction },
  });
});
