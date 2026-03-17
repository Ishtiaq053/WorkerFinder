/**
 * ──────────────────────────────────────────────────────────────
 *  Job Controller
 *  Handles creating, reading, and updating jobs.
 * ──────────────────────────────────────────────────────────────
 */

const { jobs, applications, workers, generateId } = require('../models/mockData');
const { sendResponse, validateFields } = require('../utils/helpers');
const { createNotification } = require('./notificationController');
const { canonicalizeSkillName, matchWorkerToJob } = require('./skillsController');

/**
 * POST /api/jobs
 * Create a new job posting (Users/Customers only).
 */
const createJob = (req, res) => {
  const { title, description, category, budget, location } = req.body;

  // Validate all required fields
  const { valid, missing } = validateFields(req.body, [
    'title', 'description', 'category', 'budget', 'location'
  ]);
  if (!valid) {
    return sendResponse(res, 400, false, `Missing required fields: ${missing.join(', ')}`);
  }

  const newJob = {
    id: generateId('job'),
    userId: req.user.id,
    postedBy: req.user.name,
    title: title.trim(),
    description: description.trim(),
    category: canonicalizeSkillName(category),
    budget: parseFloat(budget),
    location: location.trim(),
    status: 'open', // Possible: open, in-progress, completed, cancelled
    createdAt: new Date().toISOString()
  };

  jobs.push(newJob);
  sendResponse(res, 201, true, 'Job posted successfully.', { job: newJob });
};

/**
 * GET /api/jobs
 * Get all jobs posted by the logged-in user.
 */
const getUserJobs = (req, res) => {
  const userJobs = jobs.filter((j) => j.userId === req.user.id);
  sendResponse(res, 200, true, 'Jobs retrieved.', { jobs: userJobs });
};

/**
 * GET /api/jobs/available
 * Get open jobs matching the worker's skills.
 * Restricted workers see no jobs. Workers must be verified to see jobs.
 */
const getAvailableJobs = (req, res) => {
  // Find the worker profile for the logged-in user
  const worker = workers.find((w) => w.userId === req.user.id);

  // If no worker profile found, return empty
  if (!worker) {
    return sendResponse(res, 200, true, 'No worker profile found.', { jobs: [] });
  }

  // Check if worker is approved
  if (worker.status !== 'approved') {
    return sendResponse(res, 200, true, 'Worker profile not approved.', { jobs: [] });
  }

  // Check if worker is verified (NEW REQUIREMENT)
  if (!worker.verified) {
    return sendResponse(res, 200, true, 'Worker identity verification required.', { jobs: [] });
  }

  // If worker is restricted, return empty list
  if (worker.restricted) {
    return sendResponse(res, 200, true, 'You are restricted from viewing jobs.', { jobs: [] });
  }

  let openJobs = jobs.filter((j) => j.status === 'open');

  // Filter jobs by matching skills
  if (worker.skill && openJobs.length > 0) {
    openJobs = openJobs.filter((job) => job.category && matchWorkerToJob(worker.skill, job.category));
  }

  sendResponse(res, 200, true, 'Available jobs retrieved.', { jobs: openJobs });
};

/**
 * GET /api/jobs/:id
 * Get a single job by its ID, including its applications.
 */
const getJobById = (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }

  // Include applications for this job
  const jobApplications = applications.filter((a) => a.jobId === job.id);

  sendResponse(res, 200, true, 'Job retrieved.', {
    job,
    applications: jobApplications
  });
};

/**
 * PUT /api/jobs/:id/status
 * Update a job's status (only the job owner can do this).
 */
const updateJobStatus = (req, res) => {
  const { status } = req.body;
  const jobIndex = jobs.findIndex((j) => j.id === req.params.id);

  if (jobIndex === -1) {
    return sendResponse(res, 404, false, 'Job not found.');
  }

  // Only the job owner can update its status
  if (jobs[jobIndex].userId !== req.user.id) {
    return sendResponse(res, 403, false, 'You can only update your own jobs.');
  }

  // Validate the new status
  const validStatuses = ['open', 'in-progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return sendResponse(res, 400, false, `Status must be one of: ${validStatuses.join(', ')}`);
  }

  const previousStatus = jobs[jobIndex].status;
  jobs[jobIndex].status = status;
  jobs[jobIndex].updatedAt = new Date().toISOString();

  // If job completed or cancelled, notify assigned worker
  if (status === 'completed' || status === 'cancelled') {
    const acceptedApp = applications.find(
      (a) => a.jobId === req.params.id && a.status === 'accepted'
    );
    if (acceptedApp) {
      const message = status === 'completed'
        ? `Job "${jobs[jobIndex].title}" has been marked as completed. Thank you for your work!`
        : `Job "${jobs[jobIndex].title}" has been cancelled.`;
      createNotification(
        acceptedApp.userId,
        message,
        status === 'completed' ? 'success' : 'warning',
        { jobId: req.params.id }
      );
    }
  }

  sendResponse(res, 200, true, 'Job status updated.', { job: jobs[jobIndex] });
};

/**
 * GET /api/jobs/:id/applications
 * Get all applications for a specific job (job owner only).
 */
const getJobApplications = (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }

  // Only the job owner can view applications
  if (job.userId !== req.user.id) {
    return sendResponse(res, 403, false, 'You can only view applications for your own jobs.');
  }

  const jobApps = applications.filter((a) => a.jobId === req.params.id);
  sendResponse(res, 200, true, 'Applications retrieved.', { applications: jobApps });
};

module.exports = {
  createJob,
  getUserJobs,
  getAvailableJobs,
  getJobById,
  updateJobStatus,
  getJobApplications
};
