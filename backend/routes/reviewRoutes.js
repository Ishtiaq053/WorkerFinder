/**
 * ──────────────────────────────────────────────────────────────
 *  Review Routes
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createReview,
  getWorkerReviews,
  getJobReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

// Public route - get worker reviews
router.get('/worker/:workerId', getWorkerReviews);

// Public route - get job review
router.get('/job/:jobId', getJobReview);

// Protected routes
router.use(authenticate);

// Create a new review
router.post('/', createReview);

// Update a review
router.put('/:id', updateReview);

// Delete a review
router.delete('/:id', deleteReview);

module.exports = router;
