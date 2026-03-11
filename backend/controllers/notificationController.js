/**
 * ──────────────────────────────────────────────────────────────
 *  Notification Controller
 *  Handles creating, reading, and managing notifications.
 * ──────────────────────────────────────────────────────────────
 */

const { notifications, generateId } = require('../models/mockData');
const { sendResponse } = require('../utils/helpers');

/**
 * Create a new notification for a user.
 * This is typically called internally by other controllers.
 * @param {string} userId - The user to notify
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {object} metadata - Additional data (jobId, applicationId, etc.)
 */
const createNotification = (userId, message, type = 'info', metadata = {}) => {
  const notification = {
    id: generateId('notification'),
    userId,
    message,
    type, // info, success, warning, error
    isRead: false,
    metadata,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  return notification;
};

/**
 * GET /api/notifications
 * Get all notifications for the logged-in user.
 */
const getUserNotifications = (req, res) => {
  const userNotifications = notifications
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;
  
  sendResponse(res, 200, true, 'Notifications retrieved.', {
    notifications: userNotifications,
    unreadCount
  });
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markAsRead = (req, res) => {
  const notificationIndex = notifications.findIndex(
    (n) => n.id === req.params.id && n.userId === req.user.id
  );
  
  if (notificationIndex === -1) {
    return sendResponse(res, 404, false, 'Notification not found.');
  }
  
  notifications[notificationIndex].isRead = true;
  notifications[notificationIndex].readAt = new Date().toISOString();
  
  sendResponse(res, 200, true, 'Notification marked as read.', {
    notification: notifications[notificationIndex]
  });
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the logged-in user.
 */
const markAllAsRead = (req, res) => {
  let count = 0;
  
  notifications.forEach((n) => {
    if (n.userId === req.user.id && !n.isRead) {
      n.isRead = true;
      n.readAt = new Date().toISOString();
      count++;
    }
  });
  
  sendResponse(res, 200, true, `${count} notifications marked as read.`, { count });
};

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification.
 */
const deleteNotification = (req, res) => {
  const notificationIndex = notifications.findIndex(
    (n) => n.id === req.params.id && n.userId === req.user.id
  );
  
  if (notificationIndex === -1) {
    return sendResponse(res, 404, false, 'Notification not found.');
  }
  
  const deleted = notifications.splice(notificationIndex, 1)[0];
  
  sendResponse(res, 200, true, 'Notification deleted.', { notification: deleted });
};

/**
 * DELETE /api/notifications
 * Clear all notifications for the logged-in user.
 */
const clearAllNotifications = (req, res) => {
  let count = 0;
  
  for (let i = notifications.length - 1; i >= 0; i--) {
    if (notifications[i].userId === req.user.id) {
      notifications.splice(i, 1);
      count++;
    }
  }
  
  sendResponse(res, 200, true, `${count} notifications cleared.`, { count });
};

/**
 * GET /api/notifications/unread-count
 * Get only the count of unread notifications (for badge).
 */
const getUnreadCount = (req, res) => {
  const count = notifications.filter(
    (n) => n.userId === req.user.id && !n.isRead
  ).length;
  
  sendResponse(res, 200, true, 'Unread count retrieved.', { count });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
};
