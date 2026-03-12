/**
 * ──────────────────────────────────────────────────────────────
 *  Worker Dashboard
 *  
 *  Features:
 *    - Profile overview with approval status
 *    - Browse available jobs (only if approved)
 *    - Apply for jobs with cover note
 *    - View own applications and their status
 *    - Verification submission
 *    - View feedbacks received
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
import VerificationForm from '../../components/VerificationForm';
import StarRating from '../../components/StarRating';
import { jobAPI, applicationAPI, authAPI, feedbackAPI } from '../../services/api';

// ── Sidebar menu items ───────────────────────────────────────
const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'browse-jobs', label: 'Browse Jobs', icon: 'search' },
  { key: 'my-applications', label: 'My Applications', icon: 'file-earmark-text' },
  { key: 'verification', label: 'Verification', icon: 'shield-check' },
  { key: 'feedbacks', label: 'My Reviews', icon: 'star' },
  { key: 'profile', label: 'Profile', icon: 'person-circle' },
  { key: 'contact', label: 'Contact Us', icon: 'envelope' }
];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [workerProfile, setWorkerProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [myRating, setMyRating] = useState(null);
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

  const fetchMyFeedbacks = useCallback(async () => {
    try {
      const res = await feedbackAPI.getMyFeedbacks();
      setMyFeedbacks(res.data.feedbacks || []);
      setMyRating(res.data.rating || null);
    } catch (err) {
      console.log('Cannot fetch feedbacks:', err.message);
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProfile();
      await fetchJobs();
      await fetchMyApplications();
      await fetchMyFeedbacks();
      setLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchJobs, fetchMyApplications, fetchMyFeedbacks]);

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
                    <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                      <span className={`wf-badge badge-${isRestricted ? 'rejected' : workerProfile?.status}`}>
                        {isRestricted ? 'restricted' : workerProfile?.status}
                      </span>
                      {workerProfile?.verified ? (
                        <span className="wf-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                          <i className="bi bi-patch-check-fill me-1"></i>Verified
                        </span>
                      ) : isApproved ? (
                        <span className="wf-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                          <i className="bi bi-shield-exclamation me-1"></i>Not Verified
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification nudge for approved but not verified workers */}
            {isApproved && !workerProfile?.verified && (
              <div
                className="wf-alert wf-alert-warning mb-4"
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveTab('verification')}
              >
                <i className="bi bi-shield-exclamation" style={{ fontSize: '1.5rem' }}></i>
                <div className="flex-grow-1">
                  <strong>Verify Your Identity to Access Jobs</strong>
                  <p className="mb-0 mt-1">
                    Your profile is approved! Complete identity verification to unlock job browsing and applications.
                  </p>
                </div>
                <button className="btn btn-sm btn-primary-wf ms-3" style={{ whiteSpace: 'nowrap' }}>
                  Verify Now →
                </button>
              </div>
            )}

            {/* Stats (only if approved and verified) */}
            {isApproved && workerProfile?.verified && (
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
                <p>Your profile must be approved by admin before you can browse jobs.</p>
              </div>
            ) : !workerProfile?.verified ? (
              <div className="wf-card text-center py-5 px-4">
                <div style={{ fontSize: '4rem' }} className="mb-3">
                  <i className="bi bi-shield-exclamation text-warning"></i>
                </div>
                <h4 className="fw-bold">Identity Verification Required</h4>
                <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                  Your profile has been <strong>approved</strong>! To access available jobs and
                  start applying, you must first verify your identity by submitting your CNIC.
                  This helps build trust with customers.
                </p>
                <button
                  className="btn btn-primary-wf px-5 py-2"
                  onClick={() => setActiveTab('verification')}
                >
                  <i className="bi bi-shield-check me-2"></i>Verify My Identity
                </button>
                <p className="text-muted mt-3 small">
                  <i className="bi bi-info-circle me-1"></i>
                  Already submitted? Check the status in the{' '}
                  <span
                    className="text-primary-wf fw-semibold"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setActiveTab('verification')}
                  >
                    Verification
                  </span>{' '}tab.
                </p>
              </div>
            ) : (
              <div className="wf-card">
                <div className="card-body">
                  <DataTable
                    columns={jobColumns}
                    data={availableJobs}
                    emptyMessage="No matching jobs available at the moment. Check back later!"
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
            ) : !workerProfile?.verified ? (
              <div className="wf-card text-center py-5 px-4">
                <div style={{ fontSize: '4rem' }} className="mb-3">
                  <i className="bi bi-shield-exclamation text-warning"></i>
                </div>
                <h4 className="fw-bold">Verify Your Identity First</h4>
                <p className="text-muted mb-4" style={{ maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                  You need to complete identity verification before you can apply for jobs.
                </p>
                <button
                  className="btn btn-primary-wf px-5 py-2"
                  onClick={() => setActiveTab('verification')}
                >
                  <i className="bi bi-shield-check me-2"></i>Verify My Identity
                </button>
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

        {/* ─── Verification Tab ────────────────────────── */}
        {activeTab === 'verification' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-shield-check me-2"></i>Identity Verification
            </h4>
            <VerificationForm 
              onSuccess={() => {
                setAppDialog({
                  type: 'success',
                  title: 'Verification Submitted',
                  message: 'Your verification request has been submitted. Admin will review it soon.',
                  icon: 'check-circle'
                });
                fetchProfile(); // Refresh profile to get updated verification status
              }}
            />
          </div>
        )}

        {/* ─── Feedbacks Tab ────────────────────────────── */}
        {activeTab === 'feedbacks' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-star me-2"></i>My Reviews & Rating
            </h4>
            
            {/* Rating Summary Card */}
            <div className="wf-card mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-4 text-center border-end">
                    <h2 className="display-4 fw-bold text-warning mb-0">
                      {myRating?.finalScore?.toFixed(1) || '0.0'}
                    </h2>
                    <StarRating rating={myRating?.finalScore || 0} />
                    <p className="text-muted mb-0 mt-2">
                      Based on {myRating?.reviewCount || 0} reviews
                    </p>
                  </div>
                  <div className="col-md-8">
                    <div className="row text-center">
                      <div className="col-4">
                        <h4 className="fw-bold text-primary mb-0">
                          {myRating?.averageRating?.toFixed(1) || '0.0'}
                        </h4>
                        <small className="text-muted">Avg Rating</small>
                      </div>
                      <div className="col-4">
                        <h4 className="fw-bold text-danger mb-0">
                          {myRating?.totalDemerits || 0}
                        </h4>
                        <small className="text-muted">Total Demerits</small>
                      </div>
                      <div className="col-4">
                        <h4 className={`fw-bold mb-0 ${workerProfile?.verified ? 'text-success' : 'text-secondary'}`}>
                          <i className={`bi bi-${workerProfile?.verified ? 'check-circle-fill' : 'x-circle'}`}></i>
                        </h4>
                        <small className="text-muted">
                          {workerProfile?.verified ? 'Verified' : 'Not Verified'}
                        </small>
                      </div>
                    </div>
                    <hr />
                    <p className="text-muted mb-0 small">
                      <i className="bi bi-info-circle me-1"></i>
                      Your final score is calculated as: Average Rating - (Demerits × 0.1). 
                      Maintain quality work to keep your rating high!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="wf-card">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-chat-quote me-2"></i>Customer Reviews
                </h5>
              </div>
              <div className="card-body">
                {myFeedbacks.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-star display-4 text-muted"></i>
                    <h5 className="mt-3">No Reviews Yet</h5>
                    <p className="text-muted">
                      Complete jobs successfully to receive reviews from customers.
                    </p>
                  </div>
                ) : (
                  <div className="reviews-list">
                    {myFeedbacks.map((fb, index) => (
                      <div key={fb.id || index} className={`review-item ${index > 0 ? 'border-top pt-3 mt-3' : ''}`}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <StarRating rating={fb.rating} />
                              {fb.demeritPoints > 0 && (
                                <span className="badge bg-danger">
                                  -{fb.demeritPoints} demerit{fb.demeritPoints > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="mb-1">{fb.feedback}</p>
                            <small className="text-muted">
                              <i className="bi bi-briefcase me-1"></i>
                              {fb.jobTitle || 'Job'} • 
                              <i className="bi bi-calendar ms-2 me-1"></i>
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
