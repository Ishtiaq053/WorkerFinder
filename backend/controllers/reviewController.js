/**
 * ──────────────────────────────────────────────────────────────
 *  Review Controller
 *  Handles worker ratings and reviews.
 * ──────────────────────────────────────────────────────────────
 */

const { reviews, workers, users, jobs, applications, generateId } = require('../models/mockData');
const { sendResponse, validateFields } = require('../utils/helpers');
const { createNotification } = require('./notificationController');

/**
 * POST /api/reviews
 * Create a new review for a worker after job completion.
 */
const createReview = (req, res) => {
  const validation = validateFields(req.body, ['workerId', 'jobId', 'rating']);
  if (!validation.valid) {
    return sendResponse(res, 400, false, validation.message);
  }
  
  const { workerId, jobId, rating, comment } = req.body;
  const reviewerId = req.user.id;
  
  // Validate rating range
  if (rating < 1 || rating > 5) {
    return sendResponse(res, 400, false, 'Rating must be between 1 and 5.');
  }
  
  // Check if job exists and is completed
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }
  
  if (job.status !== 'completed') {
    return sendResponse(res, 400, false, 'Can only review after job completion.');
  }
  
  // Check if user is the job poster
  if (job.postedBy !== reviewerId) {
    return sendResponse(res, 403, false, 'Only the job poster can review.');
  }
  
  // Check if worker was assigned to this job
  const application = applications.find(
    (a) => a.jobId === jobId && a.workerId === workerId && a.status === 'accepted'
  );
  
  if (!application) {
    return sendResponse(res, 400, false, 'Worker was not assigned to this job.');
  }
  
  // Check if already reviewed
  const existingReview = reviews.find(
    (r) => r.workerId === workerId && r.jobId === jobId && r.reviewerId === reviewerId
  );
  
  if (existingReview) {
    return sendResponse(res, 400, false, 'You have already reviewed this worker for this job.');
  }
  
  // Create the review
  const review = {
    id: generateId('review'),
    workerId,
    jobId,
    reviewerId,
    rating: parseFloat(rating),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };
  
  reviews.push(review);
  
  // Update worker's average rating
  updateWorkerRating(workerId);
  
  // Notify the worker
  const reviewer = users.find((u) => u.id === reviewerId);
  createNotification(
    workerId,
    `${reviewer?.name || 'A client'} gave you a ${rating}-star review!`,
    rating >= 4 ? 'success' : 'info',
    { reviewId: review.id, jobId }
  );
  
  sendResponse(res, 201, true, 'Review submitted successfully.', { review });
};

/**
 * Update a worker's average rating based on all reviews.
 */
const updateWorkerRating = (workerId) => {
  const workerReviews = reviews.filter((r) => r.workerId === workerId);
  
  if (workerReviews.length === 0) return;
  
  const totalRating = workerReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / workerReviews.length;
  
  // Update worker profile
  const workerIndex = workers.findIndex((w) => w.id === workerId);
  if (workerIndex !== -1) {
    workers[workerIndex].rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    workers[workerIndex].reviewCount = workerReviews.length;
  }
  
  // Also update in users array
  const userIndex = users.findIndex((u) => u.id === workerId);
  if (userIndex !== -1) {
    users[userIndex].rating = Math.round(averageRating * 10) / 10;
    users[userIndex].reviewCount = workerReviews.length;
  }
};

/**
 * GET /api/reviews/worker/:workerId
 * Get all reviews for a specific worker.
 */
const getWorkerReviews = (req, res) => {
  const { workerId } = req.params;
  
  const workerReviews = reviews
    .filter((r) => r.workerId === workerId)
    .map((r) => {
      const reviewer = users.find((u) => u.id === r.reviewerId);
      const job = jobs.find((j) => j.id === r.jobId);
      return {
        ...r,
        reviewerName: reviewer?.name || 'Anonymous',
        jobTitle: job?.title || 'Unknown Job'
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const stats = calculateReviewStats(workerReviews);
  
  sendResponse(res, 200, true, 'Reviews retrieved.', {
    reviews: workerReviews,
    stats
  });
};

/**
 * Calculate review statistics.
 */
const calculateReviewStats = (reviewList) => {
  if (reviewList.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
  
  const totalRating = reviewList.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((totalRating / reviewList.length) * 10) / 10;
  
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviewList.forEach((r) => {
    const roundedRating = Math.round(r.rating);
    if (ratingDistribution[roundedRating] !== undefined) {
      ratingDistribution[roundedRating]++;
    }
  });
  
  return {
    averageRating,
    totalReviews: reviewList.length,
    ratingDistribution
  };
};

/**
 * GET /api/reviews/job/:jobId
 * Get review for a specific job (if exists).
 */
const getJobReview = (req, res) => {
  const { jobId } = req.params;
  
  const jobReviews = reviews.filter((r) => r.jobId === jobId).map((r) => {
    const reviewer = users.find((u) => u.id === r.reviewerId);
    const worker = users.find((u) => u.id === r.workerId);
    return {
      ...r,
      reviewerName: reviewer?.name || 'Anonymous',
      workerName: worker?.name || 'Unknown'
    };
  });
  
  sendResponse(res, 200, true, 'Job review retrieved.', { reviews: jobReviews });
};

/**
 * PUT /api/reviews/:id
 * Update an existing review (within time limit).
 */
const updateReview = (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  
  const reviewIndex = reviews.findIndex(
    (r) => r.id === id && r.reviewerId === req.user.id
  );
  
  if (reviewIndex === -1) {
    return sendResponse(res, 404, false, 'Review not found or not authorized.');
  }
  
  const review = reviews[reviewIndex];
  
  // Check if review is editable (within 7 days)
  const daysSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation > 7) {
    return sendResponse(res, 400, false, 'Reviews can only be edited within 7 days.');
  }
  
  // Update fields
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return sendResponse(res, 400, false, 'Rating must be between 1 and 5.');
    }
    reviews[reviewIndex].rating = parseFloat(rating);
  }
  
  if (comment !== undefined) {
    reviews[reviewIndex].comment = comment;
  }
  
  reviews[reviewIndex].updatedAt = new Date().toISOString();
  
  // Recalculate worker rating
  updateWorkerRating(review.workerId);
  
  sendResponse(res, 200, true, 'Review updated.', { review: reviews[reviewIndex] });
};

/**
 * DELETE /api/reviews/:id
 * Delete a review (admin only or own review within time limit).
 */
const deleteReview = (req, res) => {
  const { id } = req.params;
  
  const reviewIndex = reviews.findIndex((r) => r.id === id);
  
  if (reviewIndex === -1) {
    return sendResponse(res, 404, false, 'Review not found.');
  }
  
  const review = reviews[reviewIndex];
  
  // Check authorization
  if (req.user.role !== 'admin' && review.reviewerId !== req.user.id) {
    return sendResponse(res, 403, false, 'Not authorized to delete this review.');
  }
  
  const workerId = review.workerId;
  reviews.splice(reviewIndex, 1);
  
  // Recalculate worker rating
  updateWorkerRating(workerId);
  
  sendResponse(res, 200, true, 'Review deleted.', { review });
};

module.exports = {
  createReview,
  getWorkerReviews,
  getJobReview,
  updateReview,
  deleteReview,
  updateWorkerRating
};
