/**
 * ──────────────────────────────────────────────────────────────
 *  Feedback Controller
 *  Handles customer feedback and ratings for workers after
 *  job completion.
 * ──────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { jobs, workers, generateId } = require('../models/mockData');
const { sendResponse, validateFields } = require('../utils/helpers');
const { createNotification } = require('./notificationController');

// Path to feedbacks data file
const feedbacksFilePath = path.join(__dirname, '../data/feedbacks.json');

/**
 * Helper: Read feedbacks from JSON file
 */
const readFeedbacks = () => {
  try {
    if (!fs.existsSync(feedbacksFilePath)) {
      fs.writeFileSync(feedbacksFilePath, '[]');
      return [];
    }
    const data = fs.readFileSync(feedbacksFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading feedbacks file:', error);
    return [];
  }
};

/**
 * Helper: Write feedbacks to JSON file
 */
const writeFeedbacks = (feedbacks) => {
  try {
    fs.writeFileSync(feedbacksFilePath, JSON.stringify(feedbacks, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing feedbacks file:', error);
    return false;
  }
};

/**
 * Calculate worker rating from all feedbacks.
 * Formula: averageRating - (totalDemerits * 0.1)
 */
const calculateWorkerRating = (workerId) => {
  const feedbacks = readFeedbacks();
  const workerFeedbacks = feedbacks.filter(f => f.workerId === workerId);

  if (workerFeedbacks.length === 0) {
    return {
      averageRating: 0,
      totalDemerits: 0,
      finalScore: 0,
      reviewCount: 0
    };
  }

  const totalRating = workerFeedbacks.reduce((sum, f) => sum + f.rating, 0);
  const totalDemerits = workerFeedbacks.reduce((sum, f) => sum + (f.demeritPoints || 0), 0);
  const averageRating = totalRating / workerFeedbacks.length;
  const finalScore = Math.max(0, averageRating - (totalDemerits * 0.1));

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalDemerits,
    finalScore: Math.round(finalScore * 10) / 10,
    reviewCount: workerFeedbacks.length
  };
};

/**
 * POST /api/feedbacks
 * Customer submits feedback for a completed job.
 */
const submitFeedback = (req, res) => {
  const { jobId, rating, demeritPoints, feedbackText } = req.body;

  // Validate required fields
  const { valid, missing } = validateFields(req.body, ['jobId', 'rating']);
  if (!valid) {
    return sendResponse(res, 400, false, `Missing required fields: ${missing.join(', ')}`);
  }

  // Validate rating value (1-5)
  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return sendResponse(res, 400, false, 'Rating must be between 1 and 5.');
  }

  // Validate demerit points (0-5)
  const demerits = parseInt(demeritPoints) || 0;
  if (demerits < 0 || demerits > 5) {
    return sendResponse(res, 400, false, 'Demerit points must be between 0 and 5.');
  }

  // Find the job
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }

  // Verify the current user is the job owner
  if (job.userId !== req.user.id) {
    return sendResponse(res, 403, false, 'You can only provide feedback for your own jobs.');
  }

  // Verify job is completed
  if (job.status !== 'completed') {
    return sendResponse(res, 400, false, 'Feedback can only be given for completed jobs.');
  }

  // Find the worker who was assigned to this job
  const worker = workers.find(w => w.name === job.assignedWorker);
  if (!worker) {
    return sendResponse(res, 400, false, 'No worker was assigned to this job.');
  }

  const feedbacks = readFeedbacks();

  // Check if feedback already exists for this job
  const existingFeedback = feedbacks.find(f => f.jobId === jobId);
  if (existingFeedback) {
    return sendResponse(res, 400, false, 'Feedback has already been submitted for this job.');
  }

  // Create feedback
  const feedback = {
    id: generateId('feedback'),
    jobId,
    jobTitle: job.title,
    workerId: worker.id,
    workerName: worker.name,
    customerId: req.user.id,
    customerName: req.user.name,
    rating: ratingNum,
    demeritPoints: demerits,
    feedbackText: feedbackText ? feedbackText.trim() : '',
    createdAt: new Date().toISOString()
  };

  feedbacks.push(feedback);

  if (writeFeedbacks(feedbacks)) {
    // Update worker rating in memory
    const workerIndex = workers.findIndex(w => w.id === worker.id);
    if (workerIndex !== -1) {
      const ratingData = calculateWorkerRating(worker.id);
      workers[workerIndex].averageRating = ratingData.averageRating;
      workers[workerIndex].totalDemerits = ratingData.totalDemerits;
      workers[workerIndex].finalScore = ratingData.finalScore;
      workers[workerIndex].reviewCount = ratingData.reviewCount;
    }

    // Mark job as feedback given
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    if (jobIndex !== -1) {
      jobs[jobIndex].feedbackGiven = true;
    }

    // Notify worker
    const notificationMsg = demeritPoints > 0
      ? `You received a ${ratingNum}-star rating with ${demeritPoints} demerit point(s) for "${job.title}".`
      : `You received a ${ratingNum}-star rating for "${job.title}". Great job!`;

    createNotification(
      worker.userId,
      notificationMsg,
      ratingNum >= 4 ? 'success' : 'info',
      { feedbackId: feedback.id, jobId }
    );

    sendResponse(res, 201, true, 'Feedback submitted successfully.', {
      feedback,
      workerRating: calculateWorkerRating(worker.id)
    });
  } else {
    sendResponse(res, 500, false, 'Failed to submit feedback.');
  }
};

/**
 * GET /api/feedbacks/worker/:workerId
 * Get all feedbacks for a specific worker.
 */
const getWorkerFeedbacks = (req, res) => {
  const { workerId } = req.params;
  const feedbacks = readFeedbacks();
  const workerFeedbacks = feedbacks.filter(f => f.workerId === workerId);

  // Sort by date (newest first)
  workerFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sendResponse(res, 200, true, 'Worker feedbacks retrieved.', {
    feedbacks: workerFeedbacks,
    rating: calculateWorkerRating(workerId)
  });
};

/**
 * GET /api/feedbacks/job/:jobId
 * Get feedback for a specific job.
 */
const getJobFeedback = (req, res) => {
  const { jobId } = req.params;
  const feedbacks = readFeedbacks();
  const feedback = feedbacks.find(f => f.jobId === jobId);

  if (!feedback) {
    return sendResponse(res, 404, false, 'No feedback found for this job.', { feedback: null });
  }

  sendResponse(res, 200, true, 'Job feedback retrieved.', { feedback });
};

/**
 * GET /api/feedbacks/my
 * Get feedbacks for the logged-in worker.
 */
const getMyFeedbacks = (req, res) => {
  const worker = workers.find(w => w.userId === req.user.id);
  if (!worker) {
    return sendResponse(res, 404, false, 'Worker profile not found.');
  }

  const feedbacks = readFeedbacks();
  const myFeedbacks = feedbacks.filter(f => f.workerId === worker.id);

  myFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sendResponse(res, 200, true, 'Your feedbacks retrieved.', {
    feedbacks: myFeedbacks,
    rating: calculateWorkerRating(worker.id)
  });
};

/**
 * GET /api/feedbacks/rating/:workerId
 * Get calculated rating for a worker.
 */
const getWorkerRating = (req, res) => {
  const { workerId } = req.params;
  const worker = workers.find(w => w.id === workerId);

  if (!worker) {
    return sendResponse(res, 404, false, 'Worker not found.');
  }

  sendResponse(res, 200, true, 'Worker rating retrieved.', {
    worker: {
      id: worker.id,
      name: worker.name,
      verified: worker.verified === true
    },
    rating: calculateWorkerRating(workerId)
  });
};

/**
 * PUT /api/feedbacks/:id
 * Update an existing feedback (only within 24 hours).
 */
const updateFeedback = (req, res) => {
  const { id } = req.params;
  const { rating, demeritPoints, feedbackText } = req.body;

  const feedbacks = readFeedbacks();
  const index = feedbacks.findIndex(f => f.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, 'Feedback not found.');
  }

  // Verify ownership
  if (feedbacks[index].customerId !== req.user.id) {
    return sendResponse(res, 403, false, 'You can only edit your own feedback.');
  }

  // Check if within 24 hours
  const submittedAt = new Date(feedbacks[index].createdAt);
  const now = new Date();
  const hoursDiff = (now - submittedAt) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return sendResponse(res, 400, false, 'Feedback can only be edited within 24 hours of submission.');
  }

  // Update fields
  if (rating !== undefined) {
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return sendResponse(res, 400, false, 'Rating must be between 1 and 5.');
    }
    feedbacks[index].rating = ratingNum;
  }

  if (demeritPoints !== undefined) {
    const demerits = parseInt(demeritPoints);
    if (isNaN(demerits) || demerits < 0 || demerits > 5) {
      return sendResponse(res, 400, false, 'Demerit points must be between 0 and 5.');
    }
    feedbacks[index].demeritPoints = demerits;
  }

  if (feedbackText !== undefined) {
    feedbacks[index].feedbackText = feedbackText.trim();
  }

  feedbacks[index].updatedAt = new Date().toISOString();

  if (writeFeedbacks(feedbacks)) {
    // Recalculate worker rating
    const workerIndex = workers.findIndex(w => w.id === feedbacks[index].workerId);
    if (workerIndex !== -1) {
      const ratingData = calculateWorkerRating(feedbacks[index].workerId);
      workers[workerIndex].averageRating = ratingData.averageRating;
      workers[workerIndex].totalDemerits = ratingData.totalDemerits;
      workers[workerIndex].finalScore = ratingData.finalScore;
      workers[workerIndex].reviewCount = ratingData.reviewCount;
    }

    sendResponse(res, 200, true, 'Feedback updated successfully.', {
      feedback: feedbacks[index]
    });
  } else {
    sendResponse(res, 500, false, 'Failed to update feedback.');
  }
};

/**
 * DELETE /api/feedbacks/:id (Admin only)
 * Delete a feedback.
 */
const deleteFeedback = (req, res) => {
  const { id } = req.params;
  const feedbacks = readFeedbacks();
  const index = feedbacks.findIndex(f => f.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, 'Feedback not found.');
  }

  const workerId = feedbacks[index].workerId;
  feedbacks.splice(index, 1);

  if (writeFeedbacks(feedbacks)) {
    // Recalculate worker rating
    const workerIndex = workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
      const ratingData = calculateWorkerRating(workerId);
      workers[workerIndex].averageRating = ratingData.averageRating;
      workers[workerIndex].totalDemerits = ratingData.totalDemerits;
      workers[workerIndex].finalScore = ratingData.finalScore;
      workers[workerIndex].reviewCount = ratingData.reviewCount;
    }

    sendResponse(res, 200, true, 'Feedback deleted successfully.');
  } else {
    sendResponse(res, 500, false, 'Failed to delete feedback.');
  }
};

module.exports = {
  submitFeedback,
  getWorkerFeedbacks,
  getJobFeedback,
  getMyFeedbacks,
  getWorkerRating,
  updateFeedback,
  deleteFeedback,
  calculateWorkerRating,
  readFeedbacks
};
