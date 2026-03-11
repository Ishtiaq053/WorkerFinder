/**
 * ──────────────────────────────────────────────────────────────
 *  Analytics Controller
 *  Handles dashboard statistics and analytics.
 * ──────────────────────────────────────────────────────────────
 */

const { users, workers, jobs, applications, reviews, activityLogs } = require('../models/mockData');
const { sendResponse } = require('../utils/helpers');

/**
 * GET /api/analytics/admin
 * Get comprehensive admin dashboard statistics.
 */
const getAdminStats = (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // User statistics
  const totalUsers = users.length;
  const totalWorkers = workers.length;
  const approvedWorkers = workers.filter((w) => w.isApproved).length;
  const pendingWorkers = workers.filter((w) => !w.isApproved && !w.isRejected).length;
  const restrictedUsers = users.filter((u) => u.isRestricted).length;
  
  // Job statistics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'open').length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const inProgressJobs = jobs.filter((j) => j.status === 'in-progress').length;
  
  // Application statistics
  const totalApplications = applications.length;
  const pendingApplications = applications.filter((a) => a.status === 'pending').length;
  const acceptedApplications = applications.filter((a) => a.status === 'accepted').length;
  
  // Recent activity (last 7 days)
  const recentJobs = jobs.filter((j) => new Date(j.createdAt) >= sevenDaysAgo).length;
  const recentApplications = applications.filter((a) => new Date(a.appliedAt) >= sevenDaysAgo).length;
  const recentUsers = users.filter((u) => new Date(u.createdAt) >= sevenDaysAgo).length;
  
  // Jobs by category
  const jobsByCategory = {};
  jobs.forEach((job) => {
    const category = job.category || 'Uncategorized';
    jobsByCategory[category] = (jobsByCategory[category] || 0) + 1;
  });
  
  // Jobs by status
  const jobsByStatus = {
    open: activeJobs,
    'in-progress': inProgressJobs,
    completed: completedJobs,
    cancelled: jobs.filter((j) => j.status === 'cancelled').length
  };
  
  // Application trends (last 30 days)
  const applicationTrends = getDateTrends(applications, 'appliedAt', 30);
  
  // Job posting trends (last 30 days)
  const jobTrends = getDateTrends(jobs, 'createdAt', 30);
  
  // User registration trends (last 30 days)
  const userTrends = getDateTrends(users, 'createdAt', 30);
  
  // Top categories
  const topCategories = Object.entries(jobsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
  
  sendResponse(res, 200, true, 'Admin statistics retrieved.', {
    overview: {
      totalUsers,
      totalWorkers,
      approvedWorkers,
      pendingWorkers,
      restrictedUsers,
      totalJobs,
      activeJobs,
      completedJobs,
      inProgressJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications
    },
    recentActivity: {
      recentJobs,
      recentApplications,
      recentUsers
    },
    charts: {
      jobsByCategory,
      jobsByStatus,
      applicationTrends,
      jobTrends,
      userTrends,
      topCategories
    }
  });
};

/**
 * GET /api/analytics/worker/:workerId
 * Get worker-specific statistics.
 */
const getWorkerStats = (req, res) => {
  const workerId = req.params.workerId || req.user.id;
  
  // Worker's applications
  const workerApplications = applications.filter((a) => a.workerId === workerId);
  const totalApplications = workerApplications.length;
  const acceptedApplications = workerApplications.filter((a) => a.status === 'accepted').length;
  const pendingApplications = workerApplications.filter((a) => a.status === 'pending').length;
  const rejectedApplications = workerApplications.filter((a) => a.status === 'rejected').length;
  
  // Success rate
  const successRate = totalApplications > 0 
    ? Math.round((acceptedApplications / totalApplications) * 100) 
    : 0;
  
  // Jobs completed
  const completedJobIds = workerApplications
    .filter((a) => a.status === 'accepted')
    .map((a) => a.jobId);
  
  const completedJobs = jobs.filter(
    (j) => completedJobIds.includes(j.id) && j.status === 'completed'
  ).length;
  
  // Worker reviews
  const workerReviews = reviews.filter((r) => r.workerId === workerId);
  const averageRating = workerReviews.length > 0
    ? Math.round((workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length) * 10) / 10
    : 0;
  
  // Earnings estimate (mock)
  const estimatedEarnings = workerApplications
    .filter((a) => a.status === 'accepted')
    .reduce((sum, a) => {
      const job = jobs.find((j) => j.id === a.jobId);
      return sum + (job?.budget || 0);
    }, 0);
  
  // Application trends (last 30 days)
  const applicationTrends = getDateTrends(workerApplications, 'appliedAt', 30);
  
  // Rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  workerReviews.forEach((r) => {
    const rounded = Math.round(r.rating);
    if (ratingDistribution[rounded] !== undefined) {
      ratingDistribution[rounded]++;
    }
  });
  
  sendResponse(res, 200, true, 'Worker statistics retrieved.', {
    overview: {
      totalApplications,
      acceptedApplications,
      pendingApplications,
      rejectedApplications,
      successRate,
      completedJobs,
      totalReviews: workerReviews.length,
      averageRating,
      estimatedEarnings
    },
    charts: {
      applicationTrends,
      ratingDistribution,
      applicationsByStatus: {
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications
      }
    }
  });
};

/**
 * GET /api/analytics/user/:userId
 * Get user (job poster) specific statistics.
 */
const getUserStats = (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  // User's jobs
  const userJobs = jobs.filter((j) => j.postedBy === userId);
  const totalJobs = userJobs.length;
  const activeJobs = userJobs.filter((j) => j.status === 'open').length;
  const completedJobs = userJobs.filter((j) => j.status === 'completed').length;
  const inProgressJobs = userJobs.filter((j) => j.status === 'in-progress').length;
  
  // Applications received
  const userJobIds = userJobs.map((j) => j.id);
  const receivedApplications = applications.filter((a) => userJobIds.includes(a.jobId));
  const totalApplicationsReceived = receivedApplications.length;
  const pendingToReview = receivedApplications.filter((a) => a.status === 'pending').length;
  
  // Total spent (completed jobs)
  const totalSpent = userJobs
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + (j.budget || 0), 0);
  
  // Average job budget
  const avgBudget = totalJobs > 0
    ? Math.round(userJobs.reduce((sum, j) => sum + (j.budget || 0), 0) / totalJobs)
    : 0;
  
  // Reviews given
  const reviewsGiven = reviews.filter((r) => r.reviewerId === userId).length;
  
  // Jobs by status
  const jobsByStatus = {
    open: activeJobs,
    'in-progress': inProgressJobs,
    completed: completedJobs,
    cancelled: userJobs.filter((j) => j.status === 'cancelled').length
  };
  
  // Job posting trends
  const jobTrends = getDateTrends(userJobs, 'createdAt', 30);
  
  // Applications received trends
  const applicationTrends = getDateTrends(receivedApplications, 'appliedAt', 30);
  
  sendResponse(res, 200, true, 'User statistics retrieved.', {
    overview: {
      totalJobs,
      activeJobs,
      completedJobs,
      inProgressJobs,
      totalApplicationsReceived,
      pendingToReview,
      totalSpent,
      avgBudget,
      reviewsGiven
    },
    charts: {
      jobsByStatus,
      jobTrends,
      applicationTrends
    }
  });
};

/**
 * Helper: Generate date-based trends for the last N days.
 */
const getDateTrends = (items, dateField, days) => {
  const trends = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const count = items.filter((item) => {
      const itemDate = item[dateField];
      if (!itemDate) return false;
      return itemDate.split('T')[0] === dateStr;
    }).length;
    
    trends.push({
      date: dateStr,
      count
    });
  }
  
  return trends;
};

/**
 * GET /api/analytics/overview
 * Get quick overview stats for any dashboard.
 */
const getOverviewStats = (req, res) => {
  const { role } = req.user;
  
  if (role === 'admin') {
    return getAdminStats(req, res);
  } else if (role === 'worker') {
    return getWorkerStats(req, res);
  } else {
    return getUserStats(req, res);
  }
};

module.exports = {
  getAdminStats,
  getWorkerStats,
  getUserStats,
  getOverviewStats
};
