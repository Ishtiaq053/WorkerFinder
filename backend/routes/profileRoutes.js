/**
 * Profile Routes — /api/profile
 * Handles profile management and picture uploads.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const {
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
  getMyPictureUrl,
  updateProfile
} = require('../controllers/profileController');

// Public route — serve profile pictures (anyone can view)
router.get('/picture/:filename', getProfilePicture);

// Protected routes — require authentication
router.post('/upload-picture', authenticate, handleUpload, uploadProfilePicture);
router.delete('/picture', authenticate, deleteProfilePicture);
router.get('/my-picture', authenticate, getMyPictureUrl);
router.put('/update', authenticate, updateProfile);

module.exports = router;
