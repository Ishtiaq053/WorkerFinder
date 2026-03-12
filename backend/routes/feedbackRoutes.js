/**
 * ──────────────────────────────────────────────────────────────
 *  Feedback Routes
 *  Endpoints for feedback and rating system.
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isWorker, isCustomer } = require('../middleware/auth');
const {
  submitFeedback,
  getWorkerFeedbacks,
  getJobFeedback,
  getMyFeedbacks,
  getWorkerRating,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

// Customer routes
router.post('/', authenticate, isCustomer, submitFeedback);
router.get('/job/:jobId', authenticate, getJobFeedback);

// Worker routes
router.get('/my', authenticate, isWorker, getMyFeedbacks);

// Public routes (with auth for privacy)
router.get('/worker/:workerId', authenticate, getWorkerFeedbacks);
router.get('/rating/:workerId', authenticate, getWorkerRating);

// Update/Delete routes
router.put('/:id', authenticate, updateFeedback);
router.delete('/:id', authenticate, isAdmin, deleteFeedback);

module.exports = router;
