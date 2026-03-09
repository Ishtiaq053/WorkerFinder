/**
 * ──────────────────────────────────────────────────────────────
 *  Worker Dashboard
 *  
 *  Features:
 *    - Profile overview with approval status
 *    - Browse available jobs (only if approved)
 *    - Apply for jobs with cover note
 *    - View own applications and their status
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
import ChatFAB from '../../components/ChatFAB';
import { jobAPI, applicationAPI, authAPI } from '../../services/api';

// ── Sidebar menu items ───────────────────────────────────────
const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'browse-jobs', label: 'Browse Jobs', icon: 'search' },
  { key: 'my-applications', label: 'My Applications', icon: 'file-earmark-text' },
  { key: 'profile', label: 'Profile', icon: 'person-circle' },
  { key: 'contact', label: 'Contact Us', icon: 'envelope' }
];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [workerProfile, setWorkerProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [appDialog, setAppDialog] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null); // jobId being applied to
  const [coverNote, setCoverNote] = useState('');

  // ── Data Fetching ────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authAPI.getProfile();
      setWorkerProfile(res.data.worker);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await jobAPI.getAvailable();
      setAvailableJobs(res.data.jobs);
    } catch (err) {
      // Worker might not be approved yet — that's okay
      console.log('Cannot fetch jobs:', err.message);
    }
  }, []);

  const fetchMyApplications = useCallback(async () => {
    try {
      const res = await applicationAPI.getMyApplications();
      setMyApplications(res.data.applications);
    } catch (err) {
      console.log('Cannot fetch applications:', err.message);
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProfile();
      await fetchJobs();
      await fetchMyApplications();
      setLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchJobs, fetchMyApplications]);

  // ── Action Handlers ──────────────────────────────────────

  const handleApply = async (jobId) => {
    try {
      await applicationAPI.apply({ jobId, coverNote });
      setAppDialog({
        type: 'success',
        title: 'Application Submitted!',
        message: 'Your application has been submitted successfully. The employer will review it shortly.',
        icon: 'bi-send-check-fill'
      });
      setApplyingTo(null);
      setCoverNote('');
      fetchMyApplications();
      fetchJobs();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // ── Computed Values ──────────────────────────────────────

  const isApproved = workerProfile?.status === 'approved';
  const isPending = workerProfile?.status === 'pending';
  const isRejected = workerProfile?.status === 'rejected';
  const isRestricted = workerProfile?.restricted === true;

  const stats = {
    available: availableJobs.length,
    totalApps: myApplications.length,
    accepted: myApplications.filter((a) => a.status === 'accepted').length,
    pending: myApplications.filter((a) => a.status === 'pending').length
  };

  // IDs of jobs already applied to (to prevent duplicate apply buttons)
  const appliedJobIds = myApplications.map((a) => a.jobId);

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
    { key: 'postedBy', label: 'Posted By' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        appliedJobIds.includes(row.id) ? (
          <span className="wf-badge badge-pending">Applied</span>
        ) : applyingTo === row.id ? (
          <div style={{ minWidth: '200px' }}>
            <textarea
              className="form-control wf-form-control mb-2"
              placeholder="Add a cover note (optional)"
              rows="2"
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
            />
            <div className="d-flex gap-1">
              <button
                className="btn btn-success-wf"
                onClick={() => handleApply(row.id)}
              >
                <i className="bi bi-send me-1"></i>Submit
              </button>
              <button
                className="btn btn-danger-wf"
                onClick={() => {
                  setApplyingTo(null);
                  setCoverNote('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-sm btn-primary-wf"
            onClick={() => setApplyingTo(row.id)}
          >
            <i className="bi bi-send me-1"></i>Apply
          </button>
        )
    }
  ];

  const appColumns = [
    { key: 'jobTitle', label: 'Job' },
    {
      key: 'coverNote',
      label: 'Cover Note',
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
      key: 'createdAt',
      label: 'Applied On',
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  // ── Render ───────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

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

        {/* ── Status Banners ────────────────────────────── */}
        {isPending && (
          <div className="wf-alert wf-alert-warning mb-4">
            <i className="bi bi-hourglass-split" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>Profile Under Review</strong>
              <p className="mb-0 mt-1">
                Your worker profile is pending admin approval. You&apos;ll be able
                to browse and apply for jobs once approved.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="wf-alert wf-alert-error mb-4">
            <i className="bi bi-x-circle" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>Profile Rejected</strong>
              <p className="mb-0 mt-1">
                Unfortunately, your worker profile was not approved. Please contact
                support for more information.
              </p>
            </div>
          </div>
        )}

        {isRestricted && (
          <div className="wf-alert wf-alert-error mb-4">
            <i className="bi bi-slash-circle" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>Account Restricted</strong>
              <p className="mb-0 mt-1">
                Your account has been restricted by the admin. You cannot browse or
                apply for jobs at this time. Please contact support for assistance.
              </p>
            </div>
          </div>
        )}

        {/* ─── Overview Tab ───────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-grid me-2"></i>Worker Dashboard
            </h4>

            {/* Worker Profile Card */}
            <div className="wf-card mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div
                    className="rounded-circle bg-primary-wf text-white d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px', fontSize: '1.5rem', flexShrink: 0 }}
                  >
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">{workerProfile?.name}</h5>
                    <p className="mb-1 text-light-wf">
                      <i className="bi bi-tools me-1"></i>
                      {workerProfile?.skill
                        ? workerProfile.skill.split(',').map((s) => s.trim()).filter(Boolean).join(', ')
                        : 'N/A'} •{' '}
                      <i className="bi bi-clock me-1"></i>
                      {workerProfile?.experience} experience •{' '}
                      <i className="bi bi-geo-alt me-1"></i>
                      {workerProfile?.location}
                    </p>
                    <span className={`wf-badge badge-${isRestricted ? 'rejected' : workerProfile?.status}`}>
                      {isRestricted ? 'restricted' : workerProfile?.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats (only if approved) */}
            {isApproved && (
              <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                  <StatCard icon="briefcase" value={stats.available} label="Available Jobs" colorClass="stat-icon-blue" />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <StatCard icon="file-earmark" value={stats.totalApps} label="My Applications" colorClass="stat-icon-brown" />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <StatCard icon="check-circle" value={stats.accepted} label="Accepted" colorClass="stat-icon-green" />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <StatCard icon="clock" value={stats.pending} label="Pending" colorClass="stat-icon-peach" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Browse Jobs Tab ────────────────────────── */}
        {activeTab === 'browse-jobs' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-search me-2"></i>Available Jobs
            </h4>
            {!isApproved ? (
              <div className="empty-state">
                <i className="bi bi-lock"></i>
                <h5>Access Restricted</h5>
                <p>Your profile must be approved before you can browse jobs.</p>
              </div>
            ) : (
              <div className="wf-card">
                <div className="card-body">
                  <DataTable
                    columns={jobColumns}
                    data={availableJobs}
                    emptyMessage="No jobs available at the moment. Check back later!"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── My Applications Tab ────────────────────── */}
        {activeTab === 'my-applications' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-file-earmark-text me-2"></i>My Applications
            </h4>
            {!isApproved ? (
              <div className="empty-state">
                <i className="bi bi-lock"></i>
                <h5>Access Restricted</h5>
                <p>Your profile must be approved before you can view applications.</p>
              </div>
            ) : (
              <div className="wf-card">
                <div className="card-body">
                  <DataTable
                    columns={appColumns}
                    data={myApplications}
                    emptyMessage="You haven't applied to any jobs yet."
                  />
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
            <Profile user={user} workerData={workerProfile} />
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

      {/* Floating Chat Button */}
      <ChatFAB />
    </div>
  );
}
