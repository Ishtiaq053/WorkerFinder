/**
 * ──────────────────────────────────────────────────────────────
 *  Profile Controller
 *  Handles profile updates and profile picture uploads.
 * ──────────────────────────────────────────────────────────────
 */

const { users, workers } = require('../models/mockData');
const { sendResponse } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../middleware/upload');

// In-memory store for profile pictures (simulates database field)
const profilePictures = {};

/**
 * POST /api/profile/upload-picture
 * Upload a profile picture for the authenticated user.
 */
const uploadProfilePicture = (req, res) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'No file uploaded. Please select an image.');
    }

    const userId = req.user.id;
    
    // Delete old profile picture if exists
    if (profilePictures[userId]) {
      const oldPath = path.join(uploadDir, profilePictures[userId]);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store new profile picture filename
    profilePictures[userId] = req.file.filename;

    // Generate URL for the profile picture
    const pictureUrl = `/api/profile/picture/${req.file.filename}`;

    sendResponse(res, 200, true, 'Profile picture uploaded successfully.', {
      pictureUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    sendResponse(res, 500, false, 'Failed to upload profile picture.');
  }
};

/**
 * GET /api/profile/picture/:filename
 * Serve a profile picture by filename.
 */
const getProfilePicture = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Profile picture not found.'
      });
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile picture.'
    });
  }
};

/**
 * DELETE /api/profile/picture
 * Remove the authenticated user's profile picture.
 */
const deleteProfilePicture = (req, res) => {
  try {
    const userId = req.user.id;

    if (!profilePictures[userId]) {
      return sendResponse(res, 404, false, 'No profile picture to delete.');
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, profilePictures[userId]);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from store
    delete profilePictures[userId];

    sendResponse(res, 200, true, 'Profile picture deleted successfully.');
  } catch (error) {
    console.error('Delete picture error:', error);
    sendResponse(res, 500, false, 'Failed to delete profile picture.');
  }
};

/**
 * GET /api/profile/my-picture
 * Get the current user's profile picture URL.
 */
const getMyPictureUrl = (req, res) => {
  const userId = req.user.id;
  
  if (profilePictures[userId]) {
    sendResponse(res, 200, true, 'Profile picture found.', {
      pictureUrl: `/api/profile/picture/${profilePictures[userId]}`,
      filename: profilePictures[userId]
    });
  } else {
    sendResponse(res, 200, true, 'No profile picture set.', {
      pictureUrl: null,
      filename: null
    });
  }
};

/**
 * PUT /api/profile/update
 * Update the authenticated user's profile details.
 */
const updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, location } = req.body;

    // Find user
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return sendResponse(res, 404, false, 'User not found.');
    }

    // Update user fields
    if (name) users[userIndex].name = name.trim();
    if (phone !== undefined) users[userIndex].phone = phone.trim();
    if (location) users[userIndex].location = location.trim();

    // If worker, also update worker profile
    const user = users[userIndex];
    if (user.role === 'worker') {
      const workerIndex = workers.findIndex((w) => w.userId === userId);
      if (workerIndex !== -1) {
        if (name) workers[workerIndex].name = name.trim();
        if (location) workers[workerIndex].location = location.trim();
      }
    }

    const { password: _, ...userData } = users[userIndex];

    sendResponse(res, 200, true, 'Profile updated successfully.', {
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    sendResponse(res, 500, false, 'Failed to update profile.');
  }
};

// Export profile pictures store for other modules
module.exports = {
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
  getMyPictureUrl,
  updateProfile,
  profilePictures
};
