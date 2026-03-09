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
