'use strict';

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/overview', dashboardController.getOverview);
router.get('/leaderboard', dashboardController.getLeaderboard);
router.get('/heatmap', dashboardController.getHeatmapData);

module.exports = router;
