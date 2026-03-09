/**
 * ──────────────────────────────────────────────────────────────
 *  Job Controller
 *  Handles creating, reading, and updating jobs.
 * ──────────────────────────────────────────────────────────────
 */

const { jobs, applications, workers, generateId } = require('../models/mockData');
const { sendResponse, validateFields } = require('../utils/helpers');

/**
 * Mapping from worker skill names to job categories.
 * A worker with a given skill should see jobs in the mapped categories.
 */
const skillToCategoryMap = {
  plumber: ['plumbing'],
  electrician: ['electrical'],
  carpenter: ['carpentry'],
  painter: ['painting'],
  mason: ['construction'],
  welder: ['construction', 'repair'],
  driver: ['driving', 'moving'],
  cleaner: ['cleaning'],
  gardener: ['gardening'],
  mechanic: ['repair'],
  labourer: ['construction', 'moving', 'cleaning', 'gardening'],
  other: ['other']
};

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
    category: category.trim(),
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
 * Restricted workers see no jobs.
 */
const getAvailableJobs = (req, res) => {
  // Find the worker profile for the logged-in user
  const worker = workers.find((w) => w.userId === req.user.id);

  // If worker is restricted, return empty list
  if (worker && worker.restricted) {
    return sendResponse(res, 200, true, 'You are restricted from viewing jobs.', { jobs: [] });
  }

  let openJobs = jobs.filter((j) => j.status === 'open');

  // If worker has skills, filter jobs by matching categories
  if (worker && worker.skill) {
    const workerSkills = worker.skill.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    // Build a set of all matching categories from the worker's skills
    const matchingCategories = new Set();
    workerSkills.forEach((skill) => {
      const categories = skillToCategoryMap[skill] || ['other'];
      categories.forEach((cat) => matchingCategories.add(cat));
    });

    openJobs = openJobs.filter((j) => matchingCategories.has(j.category));
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

  jobs[jobIndex].status = status;
  jobs[jobIndex].updatedAt = new Date().toISOString();

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
