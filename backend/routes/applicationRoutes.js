/**
 * Application Routes — /api/applications
 * All routes require authentication.
 */
const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');

// All application routes require a valid token
router.use(authenticate);

// Worker routes
router.post('/', authorize('worker'), applyForJob);
router.get('/my', authorize('worker'), getMyApplications);

// User (Customer) routes — accept/reject applications
router.put('/:id/status', authorize('user'), updateApplicationStatus);

module.exports = router;
