/**
 * ──────────────────────────────────────────────────────────────
 *  Activity Logs Routes (Admin Only)
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getActivityLogs,
  getLogsSummary,
  getActionTypes,
  clearOldLogs
} = require('../controllers/logsController');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all activity logs with pagination and filters
router.get('/', getActivityLogs);

// Get logs summary/statistics
router.get('/summary', getLogsSummary);

// Get list of action types
router.get('/actions', getActionTypes);

// Clear old logs
router.delete('/clear', clearOldLogs);

module.exports = router;
