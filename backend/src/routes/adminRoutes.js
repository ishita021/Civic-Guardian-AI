'use strict';

/**
 * Admin Routes
 * Base: /api/v1/admin
 * All routes are protected by adminOnly middleware.
 */

const express     = require('express');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  getDashboardOverview,
  getUsers,
  updateUser,
  deleteUser,
  getComplaints,
  assignComplaint,
  updateComplaintStatus,
  deleteComplaint,
} = require('../controllers/adminController');

const router = express.Router();

// Apply adminOnly to all routes in this router
router.use(adminOnly);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardOverview);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users',         getUsers);
router.patch('/users/:id',   updateUser);
router.delete('/users/:id',  deleteUser);

// ── Complaint Management ──────────────────────────────────────────────────────
router.get('/complaints',                        getComplaints);
router.patch('/complaints/:id/assign',           assignComplaint);
router.patch('/complaints/:id/status',           updateComplaintStatus);
router.delete('/complaints/:id',                 deleteComplaint);

module.exports = router;
