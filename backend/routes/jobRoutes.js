/**
 * Job Routes — /api/jobs
 * All routes require authentication.
 */
const express = require('express');
const router = express.Router();
const {
  createJob,
  getUserJobs,
  getAvailableJobs,
  getJobById,
  updateJobStatus,
  getJobApplications
} = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

// All job routes require a valid token
router.use(authenticate);

// User (Customer) routes
router.post('/', authorize('user'), createJob);
router.get('/', authorize('user'), getUserJobs);
router.put('/:id/status', authorize('user'), updateJobStatus);
router.get('/:id/applications', authorize('user'), getJobApplications);

// Worker routes
router.get('/available', authorize('worker'), getAvailableJobs);

// Shared route (any authenticated user)
router.get('/:id', getJobById);

module.exports = router;
