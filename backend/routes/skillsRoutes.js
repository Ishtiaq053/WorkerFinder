/**
 * ──────────────────────────────────────────────────────────────
 *  Skills Routes
 *  Endpoints for centralized skill management.
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  getAllSkills,
  validateSkillEndpoint,
  addSkill,
  removeSkill
} = require('../controllers/skillsController');

// Public routes
router.get('/', getAllSkills);
router.post('/validate', validateSkillEndpoint);

// Admin-only routes
router.post('/', authenticate, isAdmin, addSkill);
router.delete('/:skillName', authenticate, isAdmin, removeSkill);

module.exports = router;
