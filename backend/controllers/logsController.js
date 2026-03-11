/**
 * ──────────────────────────────────────────────────────────────
 *  Activity Logs Controller
 *  Handles admin activity logging and retrieval.
 * ──────────────────────────────────────────────────────────────
 */

const { activityLogs, users, generateId } = require('../models/mockData');
const { sendResponse } = require('../utils/helpers');

/**
 * Log an admin activity.
 * This is called internally by other controllers.
 * @param {string} adminId - Admin who performed the action
 * @param {string} action - Action type (e.g., 'approve_worker', 'delete_job')
 * @param {string} targetType - Type of target (user, job, application)
 * @param {string} targetId - ID of the target
 * @param {object} details - Additional details about the action
 */
const logActivity = (adminId, action, targetType, targetId, details = {}) => {
  const log = {
    id: generateId('log'),
    adminId,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown'
  };
  
  activityLogs.push(log);
  return log;
};

/**
 * GET /api/admin/logs
 * Get all activity logs (admin only).
 */
const getActivityLogs = (req, res) => {
  const { page = 1, limit = 20, action, adminId, targetType, startDate, endDate } = req.query;
  
  let filteredLogs = [...activityLogs];
  
  // Apply filters
  if (action) {
    filteredLogs = filteredLogs.filter((log) => log.action === action);
  }
  
  if (adminId) {
    filteredLogs = filteredLogs.filter((log) => log.adminId === adminId);
  }
  
  if (targetType) {
    filteredLogs = filteredLogs.filter((log) => log.targetType === targetType);
  }
  
  if (startDate) {
    const start = new Date(startDate);
    filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) <= end);
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Add admin name to each log
  const enrichedLogs = filteredLogs.map((log) => {
    const admin = users.find((u) => u.id === log.adminId);
    return {
      ...log,
      adminName: admin?.name || 'Unknown Admin'
    };
  });
  
  // Paginate
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedLogs = enrichedLogs.slice(startIndex, endIndex);
  
  sendResponse(res, 200, true, 'Activity logs retrieved.', {
    logs: paginatedLogs,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(enrichedLogs.length / limitNum),
      totalLogs: enrichedLogs.length,
      hasMore: endIndex < enrichedLogs.length
    }
  });
};

/**
 * GET /api/admin/logs/summary
 * Get activity log summary/stats.
 */
const getLogsSummary = (req, res) => {
  const { days = 7 } = req.query;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
  
  const recentLogs = activityLogs.filter(
    (log) => new Date(log.timestamp) >= cutoffDate
  );
  
  // Count by action type
  const actionCounts = {};
  recentLogs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });
  
  // Count by admin
  const adminCounts = {};
  recentLogs.forEach((log) => {
    const admin = users.find((u) => u.id === log.adminId);
    const adminName = admin?.name || 'Unknown';
    adminCounts[adminName] = (adminCounts[adminName] || 0) + 1;
  });
  
  // Activity by day
  const activityByDay = {};
  for (let i = 0; i < parseInt(days); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    activityByDay[dateStr] = 0;
  }
  
  recentLogs.forEach((log) => {
    const dateStr = log.timestamp.split('T')[0];
    if (activityByDay[dateStr] !== undefined) {
      activityByDay[dateStr]++;
    }
  });
  
  sendResponse(res, 200, true, 'Log summary retrieved.', {
    totalLogs: recentLogs.length,
    actionCounts,
    adminCounts,
    activityByDay,
    period: `Last ${days} days`
  });
};

/**
 * GET /api/admin/logs/actions
 * Get list of unique action types.
 */
const getActionTypes = (req, res) => {
  const actionTypes = [...new Set(activityLogs.map((log) => log.action))];
  
  sendResponse(res, 200, true, 'Action types retrieved.', { actionTypes });
};

/**
 * DELETE /api/admin/logs/clear
 * Clear logs older than specified days (super admin only).
 */
const clearOldLogs = (req, res) => {
  const { daysOld = 30 } = req.body;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));
  
  let deletedCount = 0;
  for (let i = activityLogs.length - 1; i >= 0; i--) {
    if (new Date(activityLogs[i].timestamp) < cutoffDate) {
      activityLogs.splice(i, 1);
      deletedCount++;
    }
  }
  
  sendResponse(res, 200, true, `${deletedCount} old logs cleared.`, { deletedCount });
};

module.exports = {
  logActivity,
  getActivityLogs,
  getLogsSummary,
  getActionTypes,
  clearOldLogs
};
