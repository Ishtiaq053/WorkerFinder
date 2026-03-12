/**
 * ──────────────────────────────────────────────────────────────
 *  Admin Dashboard
 *  
 *  Features:
 *    - Platform stats overview
 *    - Manage workers (approve / reject pending workers)
 *    - Manage jobs (view all / delete)
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
import AppDialog from '../../components/AppDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import AdminVerificationPanel from '../../components/AdminVerificationPanel';
import { adminAPI } from '../../services/api';

// ── Sidebar menu items ───────────────────────────────────────
const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'workers', label: 'Manage Workers', icon: 'people' },
  { key: 'verification', label: 'Verification Requests', icon: 'shield-check' },
  { key: 'jobs', label: 'Manage Jobs', icon: 'briefcase' },
  { key: 'messages', label: 'Messages', icon: 'chat-dots' },
  { key: 'profile', label: 'Profile', icon: 'person-circle' }
];

// ── Mock messages data ───────────────────────────────────────
const mockMessages = {
  users: [
    { id: 1, name: 'Ahmed Khan', email: 'ahmed@email.com', subject: 'Payment Issue', message: 'I am facing issues with payment processing for my recent job posting.', type: 'support', date: '2026-03-02', status: 'unread' },
    { id: 2, name: 'Sara Ali', email: 'sara@email.com', subject: 'Job Posting Help', message: 'How can I edit my job posting after submission?', type: 'general', date: '2026-03-01', status: 'read' },
  ],
  workers: [
    { id: 3, name: 'Usman Raza', email: 'usman@email.com', subject: 'Profile Approval', message: 'My profile has been pending for 3 days. Please review.', type: 'support', date: '2026-03-02', status: 'unread' },
    { id: 4, name: 'Fatima Noor', email: 'fatima@email.com', subject: 'Bug Report', message: 'The application form is not saving my skills properly.', type: 'bug', date: '2026-02-28', status: 'replied' },
  ]
};

// ── Messages Panel Component ─────────────────────────────────
function MessagesPanel() {
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'users', 'workers'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  const allMessages = [
    ...mockMessages.users.map(m => ({ ...m, source: 'user' })),
    ...mockMessages.workers.map(m => ({ ...m, source: 'worker' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredMessages = messageFilter === 'all' 
    ? allMessages 
    : messageFilter === 'users' 
      ? allMessages.filter(m => m.source === 'user')
      : allMessages.filter(m => m.source === 'worker');

  const getStatusBadge = (status) => {
    const badges = {
      unread: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Unread' },
      read: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Read' },
      replied: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Replied' }
    };
    const badge = badges[status] || badges.read;
    return (
      <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const badges = {
      general: { icon: 'bi-question-circle', label: 'General' },
      support: { icon: 'bi-headset', label: 'Support' },
      bug: { icon: 'bi-bug', label: 'Bug' },
      feedback: { icon: 'bi-chat-heart', label: 'Feedback' }
    };
    const badge = badges[type] || badges.general;
    return (
      <span className="type-badge">
        <i className={`bi ${badge.icon} me-1`}></i>{badge.label}
      </span>
    );
  };

  const handleReply = (messageId) => {
    if (!replyText.trim()) return;
    // In real app, send reply via API
    console.log('Replying to message:', messageId, 'with:', replyText);
    setReplyText('');
    setSelectedMessage(null);
  };

  return (
    <div>
      <h4 className="section-title">
        <i className="bi bi-chat-dots me-2"></i>Messages
      </h4>

      {/* Filter Tabs */}
      <div className="messages-filter-tabs mb-4">
        <button 
          className={`filter-tab ${messageFilter === 'all' ? 'active' : ''}`}
          onClick={() => setMessageFilter('all')}
        >
          <i className="bi bi-inbox me-2"></i>All Messages
          <span className="count">{allMessages.length}</span>
        </button>
        <button 
          className={`filter-tab ${messageFilter === 'users' ? 'active' : ''}`}
          onClick={() => setMessageFilter('users')}
        >
          <i className="bi bi-people me-2"></i>From Customers
          <span className="count">{mockMessages.users.length}</span>
        </button>
        <button 
          className={`filter-tab ${messageFilter === 'workers' ? 'active' : ''}`}
          onClick={() => setMessageFilter('workers')}
        >
          <i className="bi bi-person-badge me-2"></i>From Workers
          <span className="count">{mockMessages.workers.length}</span>
        </button>
      </div>

      <div className="row g-4">
        {/* Messages List */}
        <div className={selectedMessage ? 'col-lg-5' : 'col-12'}>
          <div className="wf-card">
            <div className="card-body p-0">
              {filteredMessages.length === 0 ? (
                <div className="empty-state py-5">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <h5 className="mt-3">No messages</h5>
                  <p className="text-muted">No messages in this category yet.</p>
                </div>
              ) : (
                <div className="messages-list">
                  {filteredMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`message-item ${selectedMessage?.id === msg.id ? 'selected' : ''} ${msg.status === 'unread' ? 'unread' : ''}`}
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <div className="message-header">
                        <div className="sender-info">
                          <div className="sender-avatar">
                            {msg.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h6>{msg.name}</h6>
                            <small className={`source-badge ${msg.source}`}>
                              <i className={`bi ${msg.source === 'user' ? 'bi-person' : 'bi-person-badge'} me-1`}></i>
                              {msg.source === 'user' ? 'Customer' : 'Worker'}
                            </small>
                          </div>
                        </div>
                        <div className="message-meta">
                          {getStatusBadge(msg.status)}
                          <small className="date">{msg.date}</small>
                        </div>
                      </div>
                      <div className="message-preview">
                        <strong>{msg.subject}</strong>
                        <p>{msg.message.substring(0, 80)}...</p>
                      </div>
                      <div className="message-footer">
                        {getTypeBadge(msg.type)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Detail */}
        {selectedMessage && (
          <div className="col-lg-7">
            <div className="wf-card message-detail-card">
              <div className="card-body">
                <div className="detail-header">
                  <div className="d-flex align-items-center gap-3">
                    <div className="sender-avatar large">
                      {selectedMessage.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h5 className="mb-1">{selectedMessage.name}</h5>
                      <small className="text-muted">{selectedMessage.email}</small>
                    </div>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <hr />

                <div className="detail-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{selectedMessage.subject}</h5>
                    <div className="d-flex gap-2">
                      {getTypeBadge(selectedMessage.type)}
                      {getStatusBadge(selectedMessage.status)}
                    </div>
                  </div>
                  <p className="message-body">{selectedMessage.message}</p>
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    Received on {selectedMessage.date}
                  </small>
                </div>

                <hr />

                {/* Reply Section */}
                <div className="reply-section">
                  <h6><i className="bi bi-reply me-2"></i>Reply</h6>
                  <textarea
                    className="form-control wf-form-control mb-3"
                    rows="4"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary-wf"
                      onClick={() => handleReply(selectedMessage.id)}
                      disabled={!replyText.trim()}
                    >
                      <i className="bi bi-send me-2"></i>Send Reply
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => setSelectedMessage(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [workerFilter, setWorkerFilter] = useState(''); // '' = all
  const [appDialog, setAppDialog] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // ── Data Fetching ────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all admin data in parallel
      const [statsRes, workersRes, jobsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getWorkers(),
        adminAPI.getAllJobs()
      ]);
      setStats(statsRes.data.stats);
      setWorkers(workersRes.data.workers);
      setJobs(jobsRes.data.jobs);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Action Handlers ──────────────────────────────────────

  const handleApprove = async (workerId) => {
    setConfirmAction({
      title: 'Approve Worker?',
      message: 'This worker will be able to browse and apply for jobs on the platform.',
      type: 'info',
      icon: 'bi-person-check-fill',
      onConfirm: async () => {
        try {
          await adminAPI.approveWorker(workerId);
          setConfirmAction(null);
          setAppDialog({
            type: 'success',
            title: 'Worker Approved!',
            message: 'The worker has been approved successfully and can now accept jobs.',
            icon: 'bi-person-check-fill'
          });
          fetchData();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  const handleReject = async (workerId) => {
    setConfirmAction({
      title: 'Reject Worker?',
      message: 'Are you sure you want to reject this worker? They will not be able to apply for jobs.',
      type: 'danger',
      icon: 'bi-person-x-fill',
      onConfirm: async () => {
        try {
          await adminAPI.rejectWorker(workerId);
          setConfirmAction(null);
          setAppDialog({
            type: 'warning',
            title: 'Worker Rejected',
            message: 'The worker has been rejected.',
            icon: 'bi-person-x-fill'
          });
          fetchData();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  const handleDeleteJob = async (jobId) => {
    setConfirmAction({
      title: 'Delete Job?',
      message: 'Are you sure you want to delete this job? This action cannot be undone.',
      type: 'danger',
      icon: 'bi-trash-fill',
      onConfirm: async () => {
        try {
          await adminAPI.deleteJob(jobId);
          setConfirmAction(null);
          setAppDialog({
            type: 'success',
            title: 'Job Deleted',
            message: 'The job has been removed from the platform.',
            icon: 'bi-trash-fill'
          });
          fetchData();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  const handleDeleteWorker = async (workerId) => {
    setConfirmAction({
      title: 'Delete Worker?',
      message: 'Are you sure you want to permanently delete this worker? Their account and all applications will be removed. This cannot be undone.',
      type: 'danger',
      icon: 'bi-person-x-fill',
      onConfirm: async () => {
        try {
          await adminAPI.deleteWorker(workerId);
          setConfirmAction(null);
          setAppDialog({
            type: 'success',
            title: 'Worker Deleted',
            message: 'The worker account has been permanently removed from the platform.',
            icon: 'bi-person-x-fill'
          });
          fetchData();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  const handleToggleRestriction = async (worker) => {
    const isRestricting = !worker.restricted;
    setConfirmAction({
      title: isRestricting ? 'Restrict Worker?' : 'Unrestrict Worker?',
      message: isRestricting
        ? 'This worker will be blocked from seeing jobs and their profile will be hidden from users.'
        : 'This worker will be able to see jobs and their profile will be visible to users again.',
      type: isRestricting ? 'warning' : 'info',
      icon: isRestricting ? 'bi-slash-circle' : 'bi-unlock',
      onConfirm: async () => {
        try {
          await adminAPI.toggleRestriction(worker.id);
          setConfirmAction(null);
          setAppDialog({
            type: isRestricting ? 'warning' : 'success',
            title: isRestricting ? 'Worker Restricted' : 'Worker Unrestricted',
            message: isRestricting
              ? 'The worker has been restricted. They can no longer see jobs or appear in search results.'
              : 'The worker has been unrestricted and can now browse jobs again.',
            icon: isRestricting ? 'bi-slash-circle' : 'bi-unlock'
          });
          fetchData();
        } catch (err) {
          setConfirmAction(null);
          setAlert({ type: 'error', message: err.message });
        }
      }
    });
  };

  // ── Filtered Data ────────────────────────────────────────

  const filteredWorkers = workerFilter
    ? workers.filter((w) => w.status === workerFilter)
    : workers;

  // ── Table Column Definitions ─────────────────────────────

  const workerColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'skill',
      label: 'Skill(s)',
      render: (row) => {
        const skills = row.skill || '';
        return skills.split(',').map(s => s.trim()).filter(Boolean).join(', ') || '—';
      }
    },
    { key: 'experience', label: 'Experience' },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="d-flex flex-column gap-1">
          <span className={`wf-badge badge-${row.status}`}>{row.status}</span>
          {row.restricted && (
            <span className="wf-badge badge-cancelled">Restricted</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-1 flex-wrap">
          {row.status === 'pending' && (
            <>
              <button
                className="btn btn-success-wf"
                onClick={() => handleApprove(row.id)}
              >
                <i className="bi bi-check-lg me-1"></i>Approve
              </button>
              <button
                className="btn btn-danger-wf"
                onClick={() => handleReject(row.id)}
              >
                <i className="bi bi-x-lg me-1"></i>Reject
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button
              className={`btn btn-sm ${row.restricted ? 'btn-secondary-wf' : 'btn-outline-wf'}`}
              onClick={() => handleToggleRestriction(row)}
              title={row.restricted ? 'Unrestrict this worker' : 'Restrict this worker'}
            >
              <i className={`bi ${row.restricted ? 'bi-unlock' : 'bi-slash-circle'} me-1`}></i>
              {row.restricted ? 'Unrestrict' : 'Restrict'}
            </button>
          )}
          <button
            className="btn btn-danger-wf"
            onClick={() => handleDeleteWorker(row.id)}
            title="Permanently delete this worker"
          >
            <i className="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      )
    }
  ];

  const jobColumns = [
    { key: 'title', label: 'Title' },
    { key: 'postedBy', label: 'Posted By' },
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
        <button
          className="btn btn-danger-wf"
          onClick={() => handleDeleteJob(row.id)}
        >
          <i className="bi bi-trash me-1"></i>Delete
        </button>
      )
    }
  ];

  // ── Render ───────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Loading admin panel..." />;

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
              <i className="bi bi-shield-check me-2"></i>Admin Dashboard
            </h4>

            {/* Stats */}
            <div className="row g-3 mb-4">
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="people" value={stats.totalUsers || 0} label="Customers" colorClass="stat-icon-brown" />
              </div>
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="person-badge" value={stats.totalWorkers || 0} label="Workers" colorClass="stat-icon-blue" />
              </div>
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="hourglass-split" value={stats.pendingWorkers || 0} label="Pending Approvals" colorClass="stat-icon-peach" />
              </div>
              <div className="col-sm-6 col-lg-3">
                <StatCard icon="briefcase" value={stats.totalJobs || 0} label="Total Jobs" colorClass="stat-icon-green" />
              </div>
            </div>

            {/* Quick-view panels side by side */}
            <div className="row g-3">
              {/* Pending Workers Quick Panel */}
              <div className="col-lg-6">
                <div className="wf-card">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary-wf mb-3">
                      <i className="bi bi-clock me-2"></i>
                      Pending Workers ({workers.filter((w) => w.status === 'pending').length})
                    </h6>
                    <DataTable
                      columns={[
                        { key: 'name', label: 'Name' },
                        { key: 'skill', label: 'Skill' },
                        {
                          key: 'actions',
                          label: 'Action',
                          render: (row) => (
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-success-wf btn-sm"
                                onClick={() => handleApprove(row.id)}
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button
                                className="btn btn-danger-wf btn-sm"
                                onClick={() => handleReject(row.id)}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          )
                        }
                      ]}
                      data={workers.filter((w) => w.status === 'pending').slice(0, 5)}
                      emptyMessage="No pending workers"
                    />
                  </div>
                </div>
              </div>

              {/* Recent Jobs Quick Panel */}
              <div className="col-lg-6">
                <div className="wf-card">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary-wf mb-3">
                      <i className="bi bi-briefcase me-2"></i>
                      Recent Jobs ({jobs.length})
                    </h6>
                    <DataTable
                      columns={[
                        { key: 'title', label: 'Title' },
                        { key: 'postedBy', label: 'By' },
                        {
                          key: 'status',
                          label: 'Status',
                          render: (row) => (
                            <span className={`wf-badge badge-${row.status}`}>
                              {row.status}
                            </span>
                          )
                        }
                      ]}
                      data={jobs.slice(0, 5)}
                      emptyMessage="No jobs posted yet"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Workers Management Tab ─────────────────── */}
        {activeTab === 'workers' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-people me-2"></i>Manage Workers
            </h4>

            {/* Filter Buttons */}
            <div className="mb-3 d-flex gap-2 flex-wrap">
              {['', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  className={`btn btn-sm ${
                    workerFilter === status ? 'btn-primary-wf' : 'btn-outline-wf'
                  }`}
                  onClick={() => setWorkerFilter(status)}
                >
                  {status || 'All'}
                  {status === 'pending' &&
                    ` (${workers.filter((w) => w.status === 'pending').length})`}
                </button>
              ))}
            </div>

            {/* Workers Table */}
            <div className="wf-card">
              <div className="card-body">
                <DataTable
                  columns={workerColumns}
                  data={filteredWorkers}
                  emptyMessage="No workers found."
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Verification Requests Tab ──────────────── */}
        {activeTab === 'verification' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-shield-check me-2"></i>Worker Verification Requests
            </h4>
            <AdminVerificationPanel 
              onAction={(action, data) => {
                setAppDialog({
                  type: action === 'approve' ? 'success' : action === 'reject' ? 'warning' : 'info',
                  title: action === 'approve' ? 'Verification Approved' : action === 'reject' ? 'Verification Rejected' : 'Request Deleted',
                  message: `Worker verification has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'deleted'} successfully.`,
                  icon: action === 'approve' ? 'check-circle' : action === 'reject' ? 'x-circle' : 'trash'
                });
              }}
            />
          </div>
        )}

        {/* ─── Jobs Management Tab ────────────────────── */}
        {activeTab === 'jobs' && (
          <div>
            <h4 className="section-title">
              <i className="bi bi-briefcase me-2"></i>All Platform Jobs
            </h4>
            <div className="wf-card">
              <div className="card-body">
                <DataTable
                  columns={jobColumns}
                  data={jobs}
                  emptyMessage="No jobs on the platform yet."
                />
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
            <Profile user={user} />
          </div>
        )}

        {/* ─── Messages Tab ────────────────────────────── */}
        {activeTab === 'messages' && (
          <MessagesPanel />
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
        icon={confirmAction?.icon}
        confirmText="Yes, Confirm"
        cancelText="Cancel"
        onConfirm={confirmAction?.onConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
