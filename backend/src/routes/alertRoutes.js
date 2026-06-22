'use strict';

const express = require('express');
const alertController = require('../controllers/alertController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/nearby', alertController.getNearbyAlerts);

router
  .route('/')
  .get(alertController.getAllAlerts)
  .post(restrictTo('admin', 'moderator'), alertController.createAlert);

router
  .route('/:id')
  .get(alertController.getAlert)
  .patch(restrictTo('admin', 'moderator'), alertController.updateAlert)
  .delete(restrictTo('admin'), alertController.deleteAlert);

module.exports = router;
