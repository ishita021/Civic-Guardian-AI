'use strict';

const { protect, restrictTo } = require('./auth');

/**
 * adminOnly
 * Convenience middleware chain: protect → restrictTo('admin')
 * Apply to any route that must be admin-only.
 *
 * Usage:
 *   router.get('/admin/dashboard', adminOnly, controller.handler);
 */
const adminOnly = [protect, restrictTo('admin')];

module.exports = { adminOnly };
