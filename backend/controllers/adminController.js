/**
 * ──────────────────────────────────────────────────────────────
 *  Admin Controller
 *  Handles worker verification, job management, and stats.
 * ──────────────────────────────────────────────────────────────
 */

const { workers, users, jobs, applications } = require('../models/mockData');
const { sendResponse } = require('../utils/helpers');
const { logActivity } = require('./logsController');
const { createNotification } = require('./notificationController');

/**
 * GET /api/admin/workers
 * Get all workers (with optional status filter via query param).
 */
const getWorkers = (req, res) => {
  const { status } = req.query;
  let result = [...workers];

  // Filter by status if provided (e.g., ?status=pending)
  if (status) {
    result = result.filter((w) => w.status === status);
  }

  sendResponse(res, 200, true, 'Workers retrieved.', { workers: result });
};

/**
 * PUT /api/admin/approve/:id
 * Approve a pending worker so they can start applying for jobs.
 */
const approveWorker = (req, res) => {
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);
  if (workerIndex === -1) {
    return sendResponse(res, 404, false, 'Worker not found.');
  }

  workers[workerIndex].status = 'approved';
  workers[workerIndex].approvedAt = new Date().toISOString();

  // Log activity
  logActivity(req.user.id, 'approve_worker', 'worker', req.params.id, {
    name: workers[workerIndex].name || workers[workerIndex].fullName
  });

  // Notify the worker
  createNotification(
    workers[workerIndex].userId || req.params.id,
    'Congratulations! Your worker profile has been approved. You can now apply for jobs.',
    'success',
    { workerId: req.params.id }
  );

  sendResponse(res, 200, true, 'Worker approved successfully.', {
    worker: workers[workerIndex]
  });
};

/**
 * PUT /api/admin/reject/:id
 * Reject a pending worker.
 */
const rejectWorker = (req, res) => {
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);
  if (workerIndex === -1) {
    return sendResponse(res, 404, false, 'Worker not found.');
  }

  workers[workerIndex].status = 'rejected';
  workers[workerIndex].rejectedAt = new Date().toISOString();

  // Log activity
  logActivity(req.user.id, 'reject_worker', 'worker', req.params.id, {
    name: workers[workerIndex].name || workers[workerIndex].fullName
  });

  // Notify the worker
  createNotification(
    workers[workerIndex].userId || req.params.id,
    'Your worker profile was not approved. Please contact support for more information.',
    'error',
    { workerId: req.params.id }
  );

  sendResponse(res, 200, true, 'Worker rejected.', {
    worker: workers[workerIndex]
  });
};

/**
 * DELETE /api/admin/worker/:id
 * Delete a worker and their user account, removing all related applications.
 */
const deleteWorker = (req, res) => {
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);
  if (workerIndex === -1) {
    return sendResponse(res, 404, false, 'Worker not found.');
  }

  const deleted = workers.splice(workerIndex, 1)[0];

  // Log activity
  logActivity(req.user.id, 'delete_worker', 'worker', req.params.id, {
    name: deleted.name || deleted.fullName
  });

  // Remove all applications by this worker
  for (let i = applications.length - 1; i >= 0; i--) {
    if (applications[i].workerId === deleted.id) {
      applications.splice(i, 1);
    }
  }

  // Remove the user account
  const userIndex = users.findIndex((u) => u.id === deleted.userId);
  if (userIndex !== -1) users.splice(userIndex, 1);

  sendResponse(res, 200, true, 'Worker deleted successfully.', { worker: deleted });
};

/**
 * PUT /api/admin/worker/:id/restrict
 * Toggle restriction on a worker. Restricted workers cannot see jobs
 * and their profiles are hidden from users.
 */
const toggleRestriction = (req, res) => {
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);
  if (workerIndex === -1) {
    return sendResponse(res, 404, false, 'Worker not found.');
  }

  workers[workerIndex].restricted = !workers[workerIndex].restricted;
  workers[workerIndex].restrictedAt = workers[workerIndex].restricted
    ? new Date().toISOString()
    : null;

  const action = workers[workerIndex].restricted ? 'restricted' : 'unrestricted';

  // Log activity
  logActivity(req.user.id, `${action}_worker`, 'worker', req.params.id, {
    name: workers[workerIndex].name || workers[workerIndex].fullName
  });

  // Notify the worker
  const message = workers[workerIndex].restricted
    ? 'Your account has been restricted. Please contact support for more information.'
    : 'Your account restriction has been lifted. You can now access all features.';
  createNotification(
    workers[workerIndex].userId || req.params.id,
    message,
    workers[workerIndex].restricted ? 'warning' : 'success',
    { workerId: req.params.id }
  );

  sendResponse(res, 200, true, `Worker ${action} successfully.`, {
    worker: workers[workerIndex]
  });
};

/**
 * GET /api/admin/jobs
 * Get ALL jobs on the platform (not just the admin's).
 */
const getAllJobs = (req, res) => {
  sendResponse(res, 200, true, 'All jobs retrieved.', { jobs });
};

/**
 * DELETE /api/admin/job/:id
 * Remove a job from the platform (and its applications).
 */
const deleteJob = (req, res) => {
  const jobIndex = jobs.findIndex((j) => j.id === req.params.id);
  if (jobIndex === -1) {
    return sendResponse(res, 404, false, 'Job not found.');
  }

  const deleted = jobs.splice(jobIndex, 1)[0];

  // Log activity
  logActivity(req.user.id, 'delete_job', 'job', req.params.id, {
    name: deleted.title
  });

  // Notify the job poster
  createNotification(
    deleted.postedBy,
    `Your job "${deleted.title}" has been removed by an administrator.`,
    'warning',
    { jobId: req.params.id }
  );

  // Also remove all applications linked to this job
  for (let i = applications.length - 1; i >= 0; i--) {
    if (applications[i].jobId === deleted.id) {
      applications.splice(i, 1);
    }
  }

  sendResponse(res, 200, true, 'Job deleted successfully.', { job: deleted });
};

/**
 * GET /api/admin/stats
 * Get platform-wide statistics for the admin dashboard.
 */
const getStats = (req, res) => {
  const stats = {
    totalUsers: users.filter((u) => u.role === 'user').length,
    totalWorkers: workers.length,
    pendingWorkers: workers.filter((w) => w.status === 'pending').length,
    approvedWorkers: workers.filter((w) => w.status === 'approved').length,
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === 'open').length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    totalApplications: applications.length
  };

  sendResponse(res, 200, true, 'Stats retrieved.', { stats });
};

module.exports = {
  getWorkers,
  approveWorker,
  rejectWorker,
  deleteWorker,
  toggleRestriction,
  getAllJobs,
  deleteJob,
  getStats
};
