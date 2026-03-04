/**
 * Auth Routes — /api/auth
 */
const express = require('express');
const router = express.Router();
const { signup, login, logout, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signup);        // Public
router.post('/login', login);          // Public
router.post('/logout', authenticate, logout);   // Protected
router.get('/me', authenticate, getProfile);    // Protected

module.exports = router;
