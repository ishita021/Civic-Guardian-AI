'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

let genAI = null;

/**
 * Returns a singleton instance of the Gemini Generative AI client.
 */
const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('GEMINI_API_KEY is not defined in environment variables.');
      throw new Error('Gemini API key is missing.');
    }

    genAI = new GoogleGenerativeAI(apiKey);
    logger.info('Gemini AI client initialized.');
  }

  return genAI;
};

/**
 * Returns a configured Gemini model instance.
 * @param {string} modelName - Gemini model name (default: gemini-1.5-flash)
 */
const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
};

module.exports = { getGeminiClient, getGeminiModel };
