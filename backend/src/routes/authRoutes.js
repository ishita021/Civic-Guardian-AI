'use strict';

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ── Validation Rules ──────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 80 }),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.use(protect);
router.get('/me', authController.getMe);
router.patch(
  '/update-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  authController.updatePassword
);

module.exports = router;
