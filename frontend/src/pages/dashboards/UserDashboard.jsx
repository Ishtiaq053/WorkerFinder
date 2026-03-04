/**
 * ──────────────────────────────────────────────────────────────
 *  User (Customer) Dashboard
 *  
 *  Features:
 *    - Overview with stats
 *    - Post new jobs
 *    - View posted jobs (manage status)
 *    - View & manage worker applications
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { StatCard } from '../../components/Card';
import DataTable from '../../components/DataTable';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import Profile from '../../components/Profile';
import Footer from '../../components/Footer';
import ContactPanel from '../../components/ContactPanel';
import AppDialog from '../../components/AppDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import { jobAPI, applicationAPI } from '../../services/api';

// ── Sidebar menu items ───────────────────────────────────────
const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'post-job', label: 'Post a Job', icon: 'plus-circle' },
  { key: 'my-jobs', label: 'My Jobs', icon: 'briefcase' },
  { key: 'applications', label: 'Applications', icon: 'people' },
  { key: 'profile', label: 'Profile', icon: 'person-circle' },
  { key: 'contact', label: 'Contact Us', icon: 'envelope' }
];

// ── Job categories for the form ──────────────────────────────
const categories = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'construction', label: 'Construction' },
  { value: 'driving', label: 'Driving' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'moving', label: 'Moving / Shifting' },
  { value: 'repair', label: 'General Repair' },
  { value: 'other', label: 'Other' }
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [appDialog, setAppDialog] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // Form state for creating a new job
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: ''
  });
  const [jobErrors, setJobErrors] = useState({});

  // Job form change handler — clears field error on edit
  const handleJobFormChange = (field, value) => {
    setJobForm({ ...jobForm, [field]: value });
    if (jobErrors[field]) setJobErrors({ ...jobErrors, [field]: '' });
  };

  // Job form validation
  const validateJobForm = () => {
    const errs = {};
    if (!jobForm.title.trim()) errs.title = 'Job title is required.';
    if (!jobForm.description.trim()) {
      errs.description = 'Description is required.';
    } else if (jobForm.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }
    if (!jobForm.category) errs.category = 'Please select a category.';
    if (!jobForm.budget) {
      errs.budget = 'Budget is required.';
    } else if (isNaN(jobForm.budget) || Number(jobForm.budget) <= 0) {
      errs.budget = 'Budget must be a positive number.';
    }
    if (!jobForm.location.trim()) errs.location = 'Location is required.';
    setJobErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Data Fetching ────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobAPI.getUserJobs();
      setJobs(res.data.jobs);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async (jobId) => {
    try {
      setLoading(true);
      const res = await jobAPI.getApplications(jobId);
      setApplications(res.data.applications);
      setSelectedJobId(jobId);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ── Action Handlers ──────────────────────────────────────

  // Post a new job
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!validateJobForm()) return;
    try {
      setLoading(true);
      await jobAPI.create(jobForm);
      setAppDialog({
        type: 'success',
        title: 'Job Posted!',
        message: 'Your job has been posted successfully. Workers can now apply for it.',
        icon: 'bi-briefcase-fill'
      });
      setJobForm({ title: '', description: '', category: '', budget: '', location: '' });
      setJobErrors({});
      fetchJobs();
      setActiveTab('my-jobs');
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Update job status (complete / cancel) — via confirmation dialog
  const handleJobStatus = async (jobId, status) => {
    const messages = {
      completed: {
        confirmTitle: 'Mark as Completed?',
        confirmMsg: 'Are you sure you want to mark this job as completed?',
        confirmType: 'info',
        successTitle: 'Job Completed!',
        successMsg: 'This job has been marked as completed.',
        icon: 'bi-check-circle-fill'
      },
      cancelled: {
        confirmTitle: 'Cancel Job?',
        confirmMsg: 'Are you sure you want to cancel this job? This cannot be undone.',
        confirmType: 'danger',
        successTitle: 'Job Cancelled',
        successMsg: 'The job has been cancelled.',
        icon: 'bi-x-circle-fill'
      }
    };
    const m = messages[status];
    setConfirmAction({
      title: m.confirmTitle,
      message: m.confirmMsg,
      type: m.confirmType,
      onConfirm: async () => {
        try {
          await jobAPI.updateStatus(jobId, status);
          setConfirmAction(null);
          setAppDialog({ type: status === 'completed' ? 'success' : 'warning', title: m.successTitle, message: m.successMsg, icon: m.icon });
          fetchJobs();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  // Accept or reject a worker's application — via confirmation dialog
  const handleApplicationStatus = async (appId, status) => {
    const isAccept = status === 'accepted';
    setConfirmAction({
      title: isAccept ? 'Hire Worker?' : 'Reject Application?',
      message: isAccept
        ? 'Are you sure you want to hire this worker for the job?'
        : 'Are you sure you want to reject this application?',
      type: isAccept ? 'info' : 'danger',
      onConfirm: async () => {
        try {
          await applicationAPI.updateStatus(appId, status);
          setConfirmAction(null);
          setAppDialog({
            type: isAccept ? 'success' : 'warning',
            title: isAccept ? 'Worker Hired!' : 'Application Rejected',
            message: isAccept
              ? 'The worker has been hired successfully. The job is now in progress.'
              : 'The application has been rejected.',
            icon: isAccept ? 'bi-person-check-fill' : 'bi-person-x-fill'
          });
          if (selectedJobId) fetchApplications(selectedJobId);
          fetchJobs();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  // ── Computed Stats ───────────────────────────────────────
  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === 'open').length,
    inProgress: jobs.filter((j) => j.status === 'in-progress').length,
    completed: jobs.filter((j) => j.status === 'completed').length
  };

  // ── Table Column Definitions ─────────────────────────────

  const jobColumns = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    {
      key: 'budget',
      label: 'Budget',
      render: (row) => `$${row.budget}`
    },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`wf-badge badge-${row.status}`}>{row.status}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-1 flex-wrap">
          <button
            className="btn btn-sm btn-secondary-wf"
            onClick={() => {
              fetchApplications(row.id);
              setActiveTab('applications');
            }}
          >
            <i className="bi bi-people me-1"></i>Apps
          </button>
          {row.status === 'in-progress' && (
            <button
              className="btn btn-success-wf"
              onClick={() => handleJobStatus(row.id, 'completed')}
            >
              <i className="bi bi-check-lg me-1"></i>Complete
            </button>
          )}
          {row.status === 'open' && (
            <button
              className="btn btn-danger-wf"
              onClick={() => handleJobStatus(row.id, 'cancelled')}
            >
              <i className="bi bi-x-lg me-1"></i>Cancel
            </button>
          )}
        </div>
      )
    }
  ];

  const applicationColumns = [
    { key: 'workerName', label: 'Worker' },
    { key: 'workerSkill', label: 'Skill' },
    { key: 'workerExperience', label: 'Experience' },
    {
      key: 'coverNote',
      label: 'Note',
      render: (row) => row.coverNote || '—'
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`wf-badge badge-${row.status}`}>{row.status}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        row.status === 'pending' ? (
          <div className="d-flex gap-1">
            <button
              className="btn btn-success-wf"
              onClick={() => handleApplicationStatus(row.id, 'accepted')}
            >
              <i className="bi bi-check-lg me-1"></i>Accept
            </button>
            <button
              className="btn btn-danger-wf"
              onClick={() => handleApplicationStatus(row.id, 'rejected')}
            >
              <i className="bi bi-x-lg me-1"></i>Reject
            </button>
          </div>
        ) : (
          <span className="text-muted">—</span>
        )
    }
  ];

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <Sidebar
        items={sidebarItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
      />

      <main className="dashboard-content">
        {/* Global Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* ─── Overview Tab ───────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-grid me-2"></i>Dashboard Overview
            </h4>

            {/* Stats Row */}
            <div className="row g-3 mb-4">
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="briefcase" value={stats.total} label="Total Jobs" colorClass="stat-icon-brown" />
              </div>
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="clock" value={stats.open} label="Open Jobs" colorClass="stat-icon-blue" />
              </div>
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="arrow-repeat" value={stats.inProgress} label="In Progress" colorClass="stat-icon-peach" />
              </div>
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="check-circle" value={stats.completed} label="Completed" colorClass="stat-icon-green" />
              </div>
            </div>

            {/* Recent Jobs Preview */}
            <div className="wf-card">
              <div className="card-body">
                <h6 className="fw-bold text-primary-wf mb-3">
                  <i className="bi bi-clock-history me-2"></i>Recent Jobs
                </h6>
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <DataTable
                    columns={jobColumns}
                    data={jobs.slice(0, 5)}
                    emptyMessage="No jobs posted yet. Start by creating one!"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Post Job Tab ───────────────────────────── */}
        {activeTab === 'post-job' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-plus-circle me-2"></i>Post a New Job
            </h4>

            <div className="wf-card" style={{ maxWidth: '700px' }}>
              <div className="card-body p-4">
                <form onSubmit={handlePostJob} noValidate>
                  {/* Title */}
                  <div className="mb-3">
                    <label className="wf-form-label">
                      Job Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control wf-form-control ${jobErrors.title ? 'is-invalid' : ''}`}
                      value={jobForm.title}
                      onChange={(e) => handleJobFormChange('title', e.target.value)}
                      placeholder="e.g., Need a plumber for kitchen repair"
                    />
                    {jobErrors.title && (
                      <div className="wf-validation-error">
                        <i className="bi bi-exclamation-circle-fill"></i>{jobErrors.title}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="wf-form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control wf-form-control ${jobErrors.description ? 'is-invalid' : ''}`}
                      value={jobForm.description}
                      onChange={(e) => handleJobFormChange('description', e.target.value)}
                      placeholder="Describe the work in detail (min. 10 characters)..."
                      rows="4"
                    />
                    {jobErrors.description && (
                      <div className="wf-validation-error">
                        <i className="bi bi-exclamation-circle-fill"></i>{jobErrors.description}
                      </div>
                    )}
                  </div>

                  {/* Category, Budget, Location in a row */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="wf-form-label">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select wf-form-control ${jobErrors.category ? 'is-invalid' : ''}`}
                        value={jobForm.category}
                        onChange={(e) => handleJobFormChange('category', e.target.value)}
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {jobErrors.category && (
                        <div className="wf-validation-error">
                          <i className="bi bi-exclamation-circle-fill"></i>{jobErrors.category}
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="wf-form-label">
                        Budget ($) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control wf-form-control ${jobErrors.budget ? 'is-invalid' : ''}`}
                        value={jobForm.budget}
                        onChange={(e) => handleJobFormChange('budget', e.target.value)}
                        placeholder="e.g., 150"
                        min="1"
                      />
                      {jobErrors.budget && (
                        <div className="wf-validation-error">
                          <i className="bi bi-exclamation-circle-fill"></i>{jobErrors.budget}
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="wf-form-label">
                        Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control wf-form-control ${jobErrors.location ? 'is-invalid' : ''}`}
                        value={jobForm.location}
                        onChange={(e) => handleJobFormChange('location', e.target.value)}
                        placeholder="e.g., Lahore"
                      />
                      {jobErrors.location && (
                        <div className="wf-validation-error">
                          <i className="bi bi-exclamation-circle-fill"></i>{jobErrors.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="btn btn-primary-wf px-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Posting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>Post Job
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ─── My Jobs Tab ────────────────────────────── */}
        {activeTab === 'my-jobs' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-briefcase me-2"></i>My Posted Jobs
            </h4>
            <div className="wf-card">
              <div className="card-body">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <DataTable
                    columns={jobColumns}
                    data={jobs}
                    emptyMessage="You haven't posted any jobs yet."
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Applications Tab ───────────────────────── */}
        {activeTab === 'applications' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-people me-2"></i>Worker Applications
            </h4>

            {/* Job Selector */}
            <div className="wf-card mb-3">
              <div className="card-body">
                <label className="wf-form-label">
                  Select a Job to View Applications
                </label>
                <select
                  className="form-select wf-form-control"
                  value={selectedJobId || ''}
                  onChange={(e) =>
                    e.target.value && fetchApplications(e.target.value)
                  }
                >
                  <option value="">— Choose a job —</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Applications Table */}
            {selectedJobId && (
              <div className="wf-card">
                <div className="card-body">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <DataTable
                      columns={applicationColumns}
                      data={applications}
                      emptyMessage="No applications for this job yet."
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Profile Tab ────────────────────────────── */}
        {activeTab === 'profile' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-person-circle me-2"></i>My Profile
            </h4>
            <Profile user={user} />
          </div>
        )}

        {/* ─── Contact Tab ────────────────────────────── */}
        {activeTab === 'contact' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-envelope me-2"></i>Contact Us
            </h4>
            <ContactPanel />
          </div>
        )}

        {/* Dashboard Footer */}
        <Footer variant="dashboard" />
      </main>

      {/* Action Success Dialog */}
      <AppDialog
        show={!!appDialog}
        type={appDialog?.type || 'success'}
        title={appDialog?.title || ''}
        message={appDialog?.message || ''}
        icon={appDialog?.icon}
        autoClose={true}
        duration={2500}
        onClose={() => setAppDialog(null)}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        show={!!confirmAction}
        title={confirmAction?.title || 'Confirm'}
        message={confirmAction?.message || 'Are you sure?'}
        type={confirmAction?.type || 'danger'}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmAction?.onConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
