/**
 * ──────────────────────────────────────────────────────────────
 *  Notification Routes
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

// Get all notifications for the logged-in user
router.get('/', getUserNotifications);

// Get unread count only (for badge)
router.get('/unread-count', getUnreadCount);

// Mark a specific notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a specific notification
router.delete('/:id', deleteNotification);

// Clear all notifications
router.delete('/', clearAllNotifications);

module.exports = router;
