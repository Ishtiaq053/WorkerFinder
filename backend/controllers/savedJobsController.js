/**
 * ──────────────────────────────────────────────────────────────
 *  Saved Jobs Controller
 *  Handles bookmarking/saving jobs for later.
 * ──────────────────────────────────────────────────────────────
 */

const { savedJobs, jobs, users, generateId } = require('../models/mockData');
const { sendResponse } = require('../utils/helpers');

/**
 * POST /api/saved-jobs/:jobId
 * Save/bookmark a job.
 */
const saveJob = (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  
  // Check if job exists
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }
  
  // Check if already saved
  const existingSave = savedJobs.find(
    (s) => s.jobId === jobId && s.userId === userId
  );
  
  if (existingSave) {
    return sendResponse(res, 400, false, 'Job already saved.');
  }
  
  // Create saved job entry
  const savedJob = {
    id: generateId('saved'),
    userId,
    jobId,
    savedAt: new Date().toISOString()
  };
  
  savedJobs.push(savedJob);
  
  sendResponse(res, 201, true, 'Job saved successfully.', { savedJob });
};

/**
 * DELETE /api/saved-jobs/:jobId
 * Remove a saved job.
 */
const unsaveJob = (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  
  const savedIndex = savedJobs.findIndex(
    (s) => s.jobId === jobId && s.userId === userId
  );
  
  if (savedIndex === -1) {
    return sendResponse(res, 404, false, 'Saved job not found.');
  }
  
  const removed = savedJobs.splice(savedIndex, 1)[0];
  
  sendResponse(res, 200, true, 'Job removed from saved.', { savedJob: removed });
};

/**
 * GET /api/saved-jobs
 * Get all saved jobs for the logged-in user.
 */
const getSavedJobs = (req, res) => {
  const userId = req.user.id;
  
  const userSavedJobs = savedJobs
    .filter((s) => s.userId === userId)
    .map((s) => {
      const job = jobs.find((j) => j.id === s.jobId);
      const poster = job ? users.find((u) => u.id === job.postedBy) : null;
      
      if (!job) {
        return null; // Job was deleted
      }
      
      return {
        ...s,
        job: {
          ...job,
          posterName: poster?.name || 'Unknown',
          posterEmail: poster?.email || ''
        }
      };
    })
    .filter(Boolean) // Remove null entries
    .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  
  sendResponse(res, 200, true, 'Saved jobs retrieved.', { savedJobs: userSavedJobs });
};

/**
 * GET /api/saved-jobs/check/:jobId
 * Check if a specific job is saved.
 */
const checkIfSaved = (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  
  const isSaved = savedJobs.some(
    (s) => s.jobId === jobId && s.userId === userId
  );
  
  sendResponse(res, 200, true, 'Check complete.', { isSaved });
};

/**
 * POST /api/saved-jobs/toggle/:jobId
 * Toggle save status for a job (save if not saved, unsave if saved).
 */
const toggleSaveJob = (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  
  // Check if job exists
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return sendResponse(res, 404, false, 'Job not found.');
  }
  
  const savedIndex = savedJobs.findIndex(
    (s) => s.jobId === jobId && s.userId === userId
  );
  
  if (savedIndex !== -1) {
    // Remove save
    savedJobs.splice(savedIndex, 1);
    sendResponse(res, 200, true, 'Job unsaved.', { isSaved: false });
  } else {
    // Add save
    const savedJob = {
      id: generateId('saved'),
      userId,
      jobId,
      savedAt: new Date().toISOString()
    };
    savedJobs.push(savedJob);
    sendResponse(res, 200, true, 'Job saved.', { isSaved: true, savedJob });
  }
};

/**
 * GET /api/saved-jobs/count
 * Get count of saved jobs.
 */
const getSavedCount = (req, res) => {
  const userId = req.user.id;
  const count = savedJobs.filter((s) => s.userId === userId).length;
  
  sendResponse(res, 200, true, 'Count retrieved.', { count });
};

module.exports = {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkIfSaved,
  toggleSaveJob,
  getSavedCount
};
