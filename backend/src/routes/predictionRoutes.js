'use strict';

const express = require('express');
const predictionController = require('../controllers/predictionController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', predictionController.getAllPredictions);
router.get('/:id', predictionController.getPrediction);

router.post('/', restrictTo('admin', 'moderator'), predictionController.createPrediction);
router.patch('/:id/status', restrictTo('admin', 'moderator'), predictionController.updatePredictionStatus);

module.exports = router;
