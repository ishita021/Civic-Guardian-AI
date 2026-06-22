'use strict';

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ── Validation Rule Sets ──────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters.'),
  body('email')
    .isEmail().withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),
];

const loginRules = [
  body('email')
    .isEmail().withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

const updatePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/\d/).withMessage('New password must contain at least one number.'),
];

// ── Public Routes ─────────────────────────────────────────────────────────────

/**
 * @route  POST /api/v1/auth/register
 * @desc   Register a new citizen account
 * @access Public
 */
router.post('/register', registerRules, validate, authController.register);

/**
 * @route  POST /api/v1/auth/login
 * @desc   Login and receive a JWT
 * @access Public
 */
router.post('/login', loginRules, validate, authController.login);

// ── Protected Routes (require valid JWT) ─────────────────────────────────────
router.use(protect);

/**
 * @route  GET /api/v1/auth/me
 * @desc   Get the authenticated user's profile
 * @access Private
 */
router.get('/me', authController.getMe);

/**
 * @route  PATCH /api/v1/auth/update-password
 * @desc   Change the authenticated user's password
 * @access Private
 */
router.patch('/update-password', updatePasswordRules, validate, authController.updatePassword);

module.exports = router;
