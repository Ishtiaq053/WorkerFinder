/**
 * ──────────────────────────────────────────────────────────────
 *  Application Controller
 *  Handles workers applying for jobs and status updates.
 * ──────────────────────────────────────────────────────────────
 */

const { applications, jobs, workers, generateId } = require('../models/mockData');
const { sendResponse, validateFields } = require('../utils/helpers');
const { createNotification } = require('./notificationController');
const { matchWorkerToJob } = require('./skillsController');

/**
 * POST /api/applications
 * Worker applies for a job.
 */
const applyForJob = (req, res) => {
  const { jobId, coverNote } = req.body;

  // 1. Validate required fields
  const { valid, missing } = validateFields(req.body, ['jobId']);
  if (!valid) {
    return sendResponse(res, 400, false, `Missing required fields: ${missing.join(', ')}`);
  }

  // 2. Check if the job exists and is open
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }
  if (job.status !== 'open') {
    return sendResponse(res, 400, false, 'This job is no longer accepting applications.');
  }

  // 3. Find the worker's profile
  const worker = workers.find((w) => w.userId === req.user.id);
  if (!worker) {
    return sendResponse(res, 400, false, 'Worker profile not found.');
  }

  // 4. Check if worker is approved
  if (worker.status !== 'approved') {
    return sendResponse(res, 403, false, 'Your profile must be approved by admin before applying.');
  }

  // 4b. Check if worker is restricted
  if (worker.restricted) {
    return sendResponse(res, 403, false, 'Your account has been restricted. You cannot apply for jobs.');
  }

  // 4c. Skill matching validation
  if (job.category && worker.skill) {
    const hasMatchingSkill = matchWorkerToJob(worker.skill, job.category);
    if (!hasMatchingSkill) {
      return sendResponse(res, 400, false, 
        `Your skills (${worker.skill}) do not match the job requirement (${job.category}). You cannot apply for this job.`
      );
    }
  }

  // 5. Prevent duplicate applications
  const existing = applications.find(
    (a) => a.jobId === jobId && a.workerId === worker.id
  );
  if (existing) {
    return sendResponse(res, 409, false, 'You have already applied for this job.');
  }

  // 6. Create the application
  const newApplication = {
    id: generateId('application'),
    jobId,
    jobTitle: job.title,
    workerId: worker.id,
    workerName: worker.name,
    workerSkill: worker.skill,
    workerExperience: worker.experience,
    workerVerified: worker.verified === true,
    workerMobileNumber: worker.verified === true ? worker.mobileNumber : null,
    workerRating: worker.averageRating || null,
    workerReviewCount: worker.reviewCount || 0,
    userId: req.user.id,
    coverNote: coverNote ? coverNote.trim() : '',
    status: 'pending', // pending → accepted / rejected
    createdAt: new Date().toISOString()
  };

  applications.push(newApplication);

  // Notify the job poster about the new application
  createNotification(
    job.postedBy || job.userId,
    `New application received for "${job.title}" from ${worker.name}`,
    'info',
    { jobId, applicationId: newApplication.id }
  );

  sendResponse(res, 201, true, 'Application submitted successfully.', {
    application: newApplication
  });
};

/**
 * GET /api/applications/my
 * Get the logged-in worker's own applications.
 */
const getMyApplications = (req, res) => {
  const worker = workers.find((w) => w.userId === req.user.id);
  if (!worker) {
    return sendResponse(res, 404, false, 'Worker profile not found.');
  }

  const myApps = applications.filter((a) => a.workerId === worker.id);
  sendResponse(res, 200, true, 'Your applications retrieved.', {
    applications: myApps
  });
};

/**
 * PUT /api/applications/:id/status
 * Accept or reject a worker's application (Job owner only).
 */
const updateApplicationStatus = (req, res) => {
  const { status } = req.body;

  // 1. Validate status value
  if (!['accepted', 'rejected'].includes(status)) {
    return sendResponse(res, 400, false, 'Status must be "accepted" or "rejected".');
  }

  // 2. Find the application
  const appIndex = applications.findIndex((a) => a.id === req.params.id);
  if (appIndex === -1) {
    return sendResponse(res, 404, false, 'Application not found.');
  }

  // 3. Verify the current user owns the job
  const job = jobs.find((j) => j.id === applications[appIndex].jobId);
  if (!job || job.userId !== req.user.id) {
    return sendResponse(res, 403, false, 'You can only manage applications for your own jobs.');
  }

  // 4. Update application status
  applications[appIndex].status = status;
  applications[appIndex].updatedAt = new Date().toISOString();

  // 5. If accepted, mark the job as in-progress
  if (status === 'accepted') {
    const jobIndex = jobs.findIndex((j) => j.id === applications[appIndex].jobId);
    if (jobIndex !== -1) {
      jobs[jobIndex].status = 'in-progress';
      jobs[jobIndex].assignedWorker = applications[appIndex].workerName;
      jobs[jobIndex].updatedAt = new Date().toISOString();
    }
  }

  // 6. Notify the worker about the application status
  const notificationMessage = status === 'accepted'
    ? `Great news! Your application for "${job.title}" has been accepted!`
    : `Your application for "${job.title}" was not selected.`;
  
  createNotification(
    applications[appIndex].userId,
    notificationMessage,
    status === 'accepted' ? 'success' : 'info',
    { jobId: job.id, applicationId: applications[appIndex].id }
  );

  sendResponse(res, 200, true, `Application ${status}.`, {
    application: applications[appIndex]
  });
};

module.exports = { applyForJob, getMyApplications, updateApplicationStatus };
