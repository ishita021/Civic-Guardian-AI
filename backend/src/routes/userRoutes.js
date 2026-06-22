'use strict';

const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

router.get('/:id/issues', userController.getUserIssues);
router.get('/:id', userController.getUser);

// Admin only
router.use(restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.patch('/:id/role', userController.updateUserRole);

module.exports = router;
