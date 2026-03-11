/**
 * ──────────────────────────────────────────────────────────────
 *  Analytics Routes
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAdminStats,
  getWorkerStats,
  getUserStats,
  getOverviewStats
} = require('../controllers/analyticsController');

// All routes require authentication
router.use(authenticate);

// Get overview stats (auto-detects user role)
router.get('/overview', getOverviewStats);

// Admin statistics (admin only)
router.get('/admin', authorize('admin'), getAdminStats);

// Worker statistics
router.get('/worker', getWorkerStats);
router.get('/worker/:workerId', getWorkerStats);

// User (job poster) statistics
router.get('/user', getUserStats);
router.get('/user/:userId', getUserStats);

module.exports = router;
