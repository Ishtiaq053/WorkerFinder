/**
 * ──────────────────────────────────────────────────────────────
 *  Saved Jobs Routes
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkIfSaved,
  toggleSaveJob,
  getSavedCount
} = require('../controllers/savedJobsController');

// All routes require authentication
router.use(authenticate);

// Get all saved jobs
router.get('/', getSavedJobs);

// Get saved jobs count
router.get('/count', getSavedCount);

// Check if a specific job is saved
router.get('/check/:jobId', checkIfSaved);

// Toggle save status for a job
router.post('/toggle/:jobId', toggleSaveJob);

// Save a job
router.post('/:jobId', saveJob);

// Unsave a job
router.delete('/:jobId', unsaveJob);

module.exports = router;
