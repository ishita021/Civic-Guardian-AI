'use strict';

/**
 * ============================================================
 *  Civic Guardian AI — Gemini AI Service
 *  File: src/services/geminiService.js
 *
 *  Responsibility:
 *    Single-responsibility service that wraps all Gemini API
 *    calls. Controllers must NEVER import @google/generative-ai
 *    directly — they call this service instead.
 *
 *  Key design decisions:
 *    • Graceful degradation — if Gemini is unavailable (bad key,
 *      network error, quota exceeded) the function returns a safe
 *      fallback object so issue creation still succeeds.
 *    • Strict JSON parsing with a regex fence extractor to handle
 *      markdown code blocks Gemini sometimes wraps around JSON.
 *    • All prompts are isolated here for easy iteration.
 *    • API key is read exclusively from process.env — never
 *      hardcoded.
 * ============================================================
 */

const { getGeminiModel } = require('../config/gemini');
const logger = require('../config/logger');

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Model to use for issue analysis.
 * gemini-1.5-flash is fast, cheap, and well-suited for structured output.
 */
const ANALYSIS_MODEL = 'gemini-1.5-flash';

/**
 * Fallback object returned when Gemini is unavailable or returns
 * an unparseable response. Keeps issue creation non-blocking.
 */
const AI_FALLBACK = {
  aiCategory:   'Unclassified',
  aiPriority:   'medium',
  aiConfidence: 0,
  aiDepartment: 'General Administration',
  aiSuggestion: 'Manual review required.',
  aiAnalyzedAt: null,
  aiError:      null,   // populated with the error message on failure
};

// ── Prompt Builder ────────────────────────────────────────────────────────────

/**
 * Builds the structured prompt sent to Gemini.
 * The model is instructed to return ONLY valid JSON — no prose,
 * no markdown, no explanation — so parsing is deterministic.
 *
 * @param {string} title       - Issue title
 * @param {string} description - Issue description from the citizen
 * @param {string} [category]  - Optional user-provided category hint
 * @returns {string} The full prompt string
 */
const buildAnalysisPrompt = (title, description, category = '') => `
You are an expert civic issue analyst for "Civic Guardian AI", a smart city platform.

Analyze the following civic issue report and respond with ONLY a valid JSON object.
Do NOT include any markdown, code fences, prose, or explanation — just the raw JSON.

Issue Title: "${title}"
Issue Description: "${description}"
${category ? `User-provided Category Hint: "${category}"` : ''}

Return exactly this JSON structure:
{
  "category": "<one specific civic category, e.g. Road Damage, Garbage Collection, Water Leakage, Street Light, Drainage, Encroachment, Park Maintenance, Noise Pollution, Air Pollution, Other>",
  "priority": "<one of: low | medium | high | urgent>",
  "confidence": <integer 0–100 representing how confident you are in this analysis>,
  "department": "<name of the government department responsible, e.g. Road Maintenance Department, Sanitation Department, Water Supply Board, Electricity Department, Urban Planning Department>",
  "suggestedResolution": "<one concrete, actionable resolution step in plain English>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}

Rules:
- "priority" must be exactly one of: low, medium, high, urgent
- "confidence" must be an integer between 0 and 100
- "tags" must be an array of 2–4 short relevant keywords
- Base priority on urgency and public safety impact
- If the issue is a safety hazard, default to high or urgent priority
`.trim();

// ── JSON Extraction ───────────────────────────────────────────────────────────

/**
 * Extracts and parses a JSON object from Gemini's raw text response.
 * Handles cases where the model wraps output in markdown code fences.
 *
 * @param {string} rawText - Raw string from Gemini
 * @returns {Object} Parsed JSON object
 * @throws {SyntaxError} If no valid JSON can be extracted
 */
const extractJSON = (rawText) => {
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cleaned    = fenceMatch ? fenceMatch[1].trim() : rawText.trim();

  // Extract the first {...} block
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new SyntaxError('No JSON object found in Gemini response.');
  }

  return JSON.parse(jsonMatch[0]);
};

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

/**
 * Validates and normalises the parsed AI result.
 * Ensures required fields exist and are of the correct type so
 * the Issue model never receives bad data from AI.
 *
 * @param {Object} raw - Parsed JSON from Gemini
 * @returns {Object}   - Sanitised and normalised result
 */
const normaliseResult = (raw) => ({
  aiCategory:   typeof raw.category   === 'string' ? raw.category.trim()           : 'Other',
  aiPriority:   VALID_PRIORITIES.has(raw.priority) ? raw.priority                  : 'medium',
  aiConfidence: Number.isInteger(raw.confidence)   ? Math.min(100, Math.max(0, raw.confidence)) : 0,
  aiDepartment: typeof raw.department === 'string' ? raw.department.trim()         : 'General Administration',
  aiSuggestion: typeof raw.suggestedResolution === 'string' ? raw.suggestedResolution.trim() : '',
  aiTags:       Array.isArray(raw.tags)            ? raw.tags.slice(0, 4)          : [],
  aiAnalyzedAt: new Date(),
  aiError:      null,
});

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * analyzeIssue
 * ─────────────────────────────────────────────────────────────
 * Sends a civic issue to Gemini for intelligent classification
 * and returns structured AI metadata.
 *
 * This function NEVER throws. On any failure it logs the error
 * and returns AI_FALLBACK so the caller (issue creation) is
 * never blocked by AI unavailability.
 *
 * @param {Object} params
 * @param {string} params.title       - Issue title
 * @param {string} params.description - Issue description
 * @param {string} [params.category]  - Optional user-selected category
 *
 * @returns {Promise<Object>} AI analysis result or safe fallback
 *
 * @example
 * const ai = await analyzeIssue({
 *   title: 'Deep pothole on main road',
 *   description: 'Large pothole near market road causing accidents',
 * });
 * // => { aiCategory: 'Road Damage', aiPriority: 'urgent', aiConfidence: 95, ... }
 */
const analyzeIssue = async ({ title, description, category = '' }) => {
  try {
    // ── 1. Validate inputs ─────────────────────────────────────────────────
    if (!title || !description) {
      throw new Error('Title and description are required for AI analysis.');
    }

    logger.info(`[Gemini] Analyzing issue: "${title}"`);

    // ── 2. Get model & generate ────────────────────────────────────────────
    const model  = getGeminiModel(ANALYSIS_MODEL);
    const prompt = buildAnalysisPrompt(title, description, category);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    logger.debug(`[Gemini] Raw response: ${rawText.substring(0, 200)}...`);

    // ── 3. Parse & normalise ───────────────────────────────────────────────
    const parsed     = extractJSON(rawText);
    const normalised = normaliseResult(parsed);

    logger.info(
      `[Gemini] Analysis complete — category: "${normalised.aiCategory}", ` +
      `priority: "${normalised.aiPriority}", confidence: ${normalised.aiConfidence}%`
    );

    return normalised;

  } catch (err) {
    // ── 4. Graceful degradation ────────────────────────────────────────────
    // Log the error but DO NOT propagate — issue creation must not fail
    // because AI is temporarily unavailable.
    logger.error(`[Gemini] analyzeIssue failed: ${err.message}`);

    return {
      ...AI_FALLBACK,
      aiError: err.message,
    };
  }
};

// ── Re-analysis helper (used by the dedicated AI re-analyze route) ────────────

/**
 * reAnalyzeIssue
 * Convenience wrapper that accepts a full Issue document and
 * re-runs AI analysis, returning the updated AI fields.
 *
 * @param {import('mongoose').Document} issue - Mongoose Issue document
 * @returns {Promise<Object>} Updated AI fields
 */
const reAnalyzeIssue = (issue) =>
  analyzeIssue({
    title:       issue.title,
    description: issue.description,
    category:    issue.category,
  });

module.exports = { analyzeIssue, reAnalyzeIssue };
