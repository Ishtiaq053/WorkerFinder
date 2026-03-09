/**
 * Admin Routes — /api/admin
 * All routes require admin authentication.
 */
const express = require('express');
const router = express.Router();
const {
  getWorkers,
  approveWorker,
  rejectWorker,
  deleteWorker,
  toggleRestriction,
  getAllJobs,
  deleteJob,
  getStats
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/workers', getWorkers);
router.put('/approve/:id', approveWorker);
router.put('/reject/:id', rejectWorker);
router.delete('/worker/:id', deleteWorker);
router.put('/worker/:id/restrict', toggleRestriction);
router.get('/jobs', getAllJobs);
router.delete('/job/:id', deleteJob);

module.exports = router;
