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
    request(`/admin/job/${id}`, { method: 'DELETE' })
};
