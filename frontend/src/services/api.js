/**
 * ──────────────────────────────────────────────────────────────
 *  API Service
 *  Centralized module for all backend API calls.
 *  Uses the Fetch API (no Axios) with automatic auth headers.
 * ──────────────────────────────────────────────────────────────
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper.
 * Automatically attaches auth token and parses JSON responses.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('wf_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Server returned non-JSON (likely HTML error page)
      throw {
        success: false,
        message: 'Server connection error. Please ensure the backend server is running.'
      };
    }
    
    const data = await response.json();

    // If the response is not OK, throw the error data
    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data;
  } catch (error) {
    // Re-throw API errors as-is
    if (error.success === false) throw error;
    // Wrap network errors in a standard format
    throw {
      success: false,
      message: error.message || 'Network error. Please try again.'
    };
  }
}

/**
 * Upload file request wrapper (for multipart/form-data).
 * Does NOT set Content-Type (let browser set it with boundary).
 */
async function uploadRequest(endpoint, formData) {
  const token = localStorage.getItem('wf_token');

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
        // Don't set Content-Type — browser will set it with boundary
      },
      body: formData
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw {
        success: false,
        message: 'Server connection error. Please ensure the backend server is running.'
      };
    }

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data;
  } catch (error) {
    if (error.success === false) throw error;
    throw {
      success: false,
      message: error.message || 'Upload failed. Please try again.'
    };
  }
}

// ─── Auth APIs ───────────────────────────────────────────────
export const authAPI = {
  signup: (data) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  getProfile: () =>
    request('/auth/me')
};

// ─── Job APIs ────────────────────────────────────────────────
export const jobAPI = {
  create: (data) =>
    request('/jobs', { method: 'POST', body: JSON.stringify(data) }),

  getUserJobs: () =>
    request('/jobs'),

  getAvailable: () =>
    request('/jobs/available'),

  getById: (id) =>
    request(`/jobs/${id}`),

  updateStatus: (id, status) =>
    request(`/jobs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  getApplications: (id) =>
    request(`/jobs/${id}/applications`)
};

// ─── Application APIs ────────────────────────────────────────
export const applicationAPI = {
  apply: (data) =>
    request('/applications', { method: 'POST', body: JSON.stringify(data) }),

  getMyApplications: () =>
    request('/applications/my'),

  updateStatus: (id, status) =>
    request(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
};

// ─── Admin APIs ──────────────────────────────────────────────
export const adminAPI = {
  getStats: () =>
    request('/admin/stats'),

  getWorkers: (status) =>
    request(`/admin/workers${status ? `?status=${status}` : ''}`),

  approveWorker: (id) =>
    request(`/admin/approve/${id}`, { method: 'PUT' }),

  rejectWorker: (id) =>
    request(`/admin/reject/${id}`, { method: 'PUT' }),

  getAllJobs: () =>
    request('/admin/jobs'),

  deleteJob: (id) =>
    request(`/admin/job/${id}`, { method: 'DELETE' }),

  deleteWorker: (id) =>
    request(`/admin/worker/${id}`, { method: 'DELETE' }),

  toggleRestriction: (id) =>
    request(`/admin/worker/${id}/restrict`, { method: 'PUT' })
};

// ─── Profile APIs ────────────────────────────────────────────
export const profileAPI = {
  /**
   * Upload a profile picture.
   * @param {File} file - The image file to upload
   */
  uploadPicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return uploadRequest('/profile/upload-picture', formData);
  },

  /**
   * Get the current user's profile picture URL.
   */
  getMyPicture: () =>
    request('/profile/my-picture'),

  /**
   * Delete the current user's profile picture.
   */
  deletePicture: () =>
    request('/profile/picture', { method: 'DELETE' }),

  /**
   * Update profile details (name, phone, location).
   */
  update: (data) =>
    request('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};

// ─── Notification APIs ───────────────────────────────────────
export const notificationAPI = {
  /**
   * Get all notifications for the current user.
   */
  getAll: () =>
    request('/notifications'),

  /**
   * Get unread notification count.
   */
  getUnreadCount: () =>
    request('/notifications/unread-count'),

  /**
   * Mark a specific notification as read.
   */
  markAsRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),

  /**
   * Mark all notifications as read.
   */
  markAllAsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

  /**
   * Delete a specific notification.
   */
  delete: (id) =>
    request(`/notifications/${id}`, { method: 'DELETE' }),

  /**
   * Clear all notifications.
   */
  clearAll: () =>
    request('/notifications', { method: 'DELETE' })
};

// ─── Review APIs ─────────────────────────────────────────────
export const reviewAPI = {
  /**
   * Create a review for a worker after job completion.
   */
  create: (data) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  /**
   * Get all reviews for a specific worker.
   */
  getWorkerReviews: (workerId) =>
    request(`/reviews/worker/${workerId}`),

  /**
   * Get review for a specific job.
   */
  getJobReview: (jobId) =>
    request(`/reviews/job/${jobId}`),

  /**
   * Update an existing review.
   */
  update: (id, data) =>
    request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /**
   * Delete a review.
   */
  delete: (id) =>
    request(`/reviews/${id}`, { method: 'DELETE' })
};

// ─── Saved Jobs APIs ─────────────────────────────────────────
export const savedJobsAPI = {
  /**
   * Get all saved jobs for the current user.
   */
  getAll: () =>
    request('/saved-jobs'),

  /**
   * Get saved jobs count.
   */
  getCount: () =>
    request('/saved-jobs/count'),

  /**
   * Check if a specific job is saved.
   */
  checkIfSaved: (jobId) =>
    request(`/saved-jobs/check/${jobId}`),

  /**
   * Toggle save status for a job.
   */
  toggle: (jobId) =>
    request(`/saved-jobs/toggle/${jobId}`, { method: 'POST' }),

  /**
   * Save a job.
   */
  save: (jobId) =>
    request(`/saved-jobs/${jobId}`, { method: 'POST' }),

  /**
   * Unsave a job.
   */
  unsave: (jobId) =>
    request(`/saved-jobs/${jobId}`, { method: 'DELETE' })
};

// ─── Analytics APIs ──────────────────────────────────────────
export const analyticsAPI = {
  /**
   * Get overview stats (auto-detects user role).
   */
  getOverview: () =>
    request('/analytics/overview'),

  /**
   * Get admin dashboard statistics.
   */
  getAdminStats: () =>
    request('/analytics/admin'),

  /**
   * Get worker statistics.
   */
  getWorkerStats: (workerId) =>
    request(workerId ? `/analytics/worker/${workerId}` : '/analytics/worker'),

  /**
   * Get user (job poster) statistics.
   */
  getUserStats: (userId) =>
    request(userId ? `/analytics/user/${userId}` : '/analytics/user')
};

// ─── Activity Logs APIs ──────────────────────────────────────
export const logsAPI = {
  /**
   * Get activity logs with optional filters.
   */
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/logs${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get logs summary/statistics.
   */
  getSummary: (days = 7) =>
    request(`/admin/logs/summary?days=${days}`),

  /**
   * Get list of action types.
   */
  getActionTypes: () =>
    request('/admin/logs/actions'),

  /**
   * Clear old logs.
   */
  clearOld: (daysOld = 30) =>
    request('/admin/logs/clear', {
      method: 'DELETE',
      body: JSON.stringify({ daysOld })
    })
};

// ─── Skills APIs ─────────────────────────────────────────────
export const skillsAPI = {
  /**
   * Get all available skills.
   */
  getAll: () =>
    request('/skills'),

  /**
   * Validate skill(s).
   */
  validate: (skills) =>
    request('/skills/validate', {
      method: 'POST',
      body: JSON.stringify({ skills })
    }),

  /**
   * Add a new skill (admin only).
   */
  add: (skillName) =>
    request('/skills', {
      method: 'POST',
      body: JSON.stringify({ skillName })
    }),

  /**
   * Remove a skill (admin only).
   */
  remove: (skillName) =>
    request(`/skills/${encodeURIComponent(skillName)}`, { method: 'DELETE' })
};

// ─── Verification APIs ───────────────────────────────────────
export const verificationAPI = {
  /**
   * Submit verification request (worker).
   */
  submit: (formData) =>
    uploadRequest('/verification/submit', formData),

  /**
   * Get own verification status (worker).
   */
  getStatus: () =>
    request('/verification/status'),

  /**
   * Get all verification requests (admin).
   */
  getAllRequests: (status) =>
    request(`/verification/requests${status ? `?status=${status}` : ''}`),

  /**
   * Get specific verification request (admin).
   */
  getRequest: (id) =>
    request(`/verification/request/${id}`),

  /**
   * Approve verification (admin).
   */
  approve: (id) =>
    request(`/verification/approve/${id}`, { method: 'PUT' }),

  /**
   * Reject verification (admin).
   */
  reject: (id, reason) =>
    request(`/verification/reject/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    }),

  /**
   * Delete verification request (admin).
   */
  deleteRequest: (id) =>
    request(`/verification/request/${id}`, { method: 'DELETE' })
};

// ─── Feedback APIs ───────────────────────────────────────────
export const feedbackAPI = {
  /**
   * Submit feedback for a completed job.
   */
  submit: (data) =>
    request('/feedbacks', { method: 'POST', body: JSON.stringify(data) }),

  /**
   * Get feedbacks for a worker.
   */
  getWorkerFeedbacks: (workerId) =>
    request(`/feedbacks/worker/${workerId}`),

  /**
   * Get feedback for a specific job.
   */
  getJobFeedback: (jobId) =>
    request(`/feedbacks/job/${jobId}`),

  /**
   * Get own feedbacks (worker).
   */
  getMyFeedbacks: () =>
    request('/feedbacks/my'),

  /**
   * Get worker rating.
   */
  getWorkerRating: (workerId) =>
    request(`/feedbacks/rating/${workerId}`),

  /**
   * Update feedback (within 24 hours).
   */
  update: (id, data) =>
    request(`/feedbacks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  /**
   * Delete feedback (admin only).
   */
  delete: (id) =>
    request(`/feedbacks/${id}`, { method: 'DELETE' })
};
