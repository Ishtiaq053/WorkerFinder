/**
 * ──────────────────────────────────────────────────────────────
 *  AdminVerificationPanel Component
 *  Admin panel for managing worker verification requests.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import DataTable from './DataTable';
import Alert from './Alert';
import LoadingSpinner from './LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';
import { verificationAPI } from '../services/api';
import './AdminVerificationPanel.css';

export default function AdminVerificationPanel() {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageToView, setImageToView] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch verification requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await verificationAPI.getAllRequests(filter !== 'all' ? filter : undefined);
      setRequests(res.data.requests || []);
      setCounts(res.data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch requests.' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // View request details
  const handleViewRequest = async (id) => {
    try {
      const res = await verificationAPI.getRequest(id);
      setSelectedRequest(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch request details.' });
    }
  };

  // Open image modal
  const openImageModal = (imageUrl, title) => {
    setImageToView({ url: imageUrl, title });
    setShowImageModal(true);
  };

  // Handle approve action
  const handleApprove = (request) => {
    setConfirmAction({
      type: 'success',
      title: 'Approve Verification',
      message: `Are you sure you want to approve the verification for ${request.workerName}? This will mark them as a verified worker.`,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await verificationAPI.approve(request.id);
          setAlert({ type: 'success', message: `${request.workerName}'s verification approved successfully!` });
          setConfirmAction(null);
          setSelectedRequest(null);
          fetchRequests();
        } catch (err) {
          setAlert({ type: 'error', message: err.message || 'Failed to approve verification.' });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Handle reject action
  const handleReject = (request) => {
    setRejectReason('');
    setConfirmAction({
      type: 'danger',
      title: 'Reject Verification',
      message: `Are you sure you want to reject the verification for ${request.workerName}?`,
      showReasonInput: true,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await verificationAPI.reject(request.id, rejectReason);
          setAlert({ type: 'success', message: `Verification for ${request.workerName} rejected.` });
          setConfirmAction(null);
          setSelectedRequest(null);
          setRejectReason('');
          fetchRequests();
        } catch (err) {
          setAlert({ type: 'error', message: err.message || 'Failed to reject verification.' });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Handle delete action
  const handleDelete = (request) => {
    setConfirmAction({
      type: 'danger',
      title: 'Delete Request',
      message: `Are you sure you want to permanently delete this verification request from ${request.workerName}?`,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await verificationAPI.deleteRequest(request.id);
          setAlert({ type: 'success', message: 'Verification request deleted.' });
          setConfirmAction(null);
          setSelectedRequest(null);
          fetchRequests();
        } catch (err) {
          setAlert({ type: 'error', message: err.message || 'Failed to delete request.' });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { className: 'badge-pending', icon: 'bi-hourglass-split' },
      approved: { className: 'badge-approved', icon: 'bi-check-circle-fill' },
      rejected: { className: 'badge-rejected', icon: 'bi-x-circle-fill' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`wf-badge ${badge.className}`}>
        <i className={`bi ${badge.icon} me-1`}></i>
        {status}
      </span>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'workerName',
      label: 'Worker',
      render: (row) => (
        <div className="worker-cell">
          <strong>{row.workerName}</strong>
          <small>{row.workerEmail}</small>
        </div>
      )
    },
    { key: 'cnicNumber', label: 'CNIC' },
    { key: 'mobileNumber', label: 'Mobile' },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (row) => new Date(row.submittedAt).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-1 flex-wrap">
          <button
            className="btn btn-sm btn-secondary-wf"
            onClick={() => handleViewRequest(row.id)}
            title="View Details"
          >
            <i className="bi bi-eye"></i>
          </button>
          {row.status === 'pending' && (
            <>
              <button
                className="btn btn-sm btn-success-wf"
                onClick={() => handleApprove(row)}
                title="Approve"
              >
                <i className="bi bi-check-lg"></i>
              </button>
              <button
                className="btn btn-sm btn-danger-wf"
                onClick={() => handleReject(row)}
                title="Reject"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </>
          )}
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDelete(row)}
            title="Delete"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="admin-verification-panel">
      {/* Header with Stats */}
      <div className="verification-stats-row">
        <div 
          className={`stat-card ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <div className="stat-icon all">
            <i className="bi bi-list-check"></i>
          </div>
          <div className="stat-info">
            <h3>{counts.total}</h3>
            <span>Total Requests</span>
          </div>
        </div>
        <div 
          className={`stat-card ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <div className="stat-icon pending">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="stat-info">
            <h3>{counts.pending}</h3>
            <span>Pending</span>
          </div>
        </div>
        <div 
          className={`stat-card ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          <div className="stat-icon approved">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{counts.approved}</h3>
            <span>Approved</span>
          </div>
        </div>
        <div 
          className={`stat-card ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          <div className="stat-icon rejected">
            <i className="bi bi-x-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{counts.rejected}</h3>
            <span>Rejected</span>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Main Content */}
      <div className="wf-card">
        <div className="card-body">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={columns}
              data={requests}
              emptyMessage={`No ${filter !== 'all' ? filter : ''} verification requests found.`}
            />
          )}
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="request-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>
                <i className="bi bi-shield-check me-2"></i>
                Verification Request Details
              </h5>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h6><i className="bi bi-person me-2"></i>Worker Information</h6>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedRequest.request.workerName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedRequest.request.workerEmail}</span>
                  </div>
                  {selectedRequest.worker && (
                    <>
                      <div className="detail-item">
                        <label>Skills</label>
                        <span>{selectedRequest.worker.skill || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Experience</label>
                        <span>{selectedRequest.worker.experience || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Location</label>
                        <span>{selectedRequest.worker.location || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Profile Status</label>
                        <span className={`wf-badge badge-${selectedRequest.worker.status}`}>
                          {selectedRequest.worker.status}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h6><i className="bi bi-credit-card me-2"></i>Verification Details</h6>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>CNIC Number</label>
                    <span>{selectedRequest.request.cnicNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Mobile Number</label>
                    <span>{selectedRequest.request.mobileNumber}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Address</label>
                    <span>{selectedRequest.request.address}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    {getStatusBadge(selectedRequest.request.status)}
                  </div>
                  <div className="detail-item">
                    <label>Submitted On</label>
                    <span>{new Date(selectedRequest.request.submittedAt).toLocaleString()}</span>
                  </div>
                  {selectedRequest.request.rejectionReason && (
                    <div className="detail-item full-width">
                      <label>Rejection Reason</label>
                      <span className="text-danger">{selectedRequest.request.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h6><i className="bi bi-images me-2"></i>ID Card Images</h6>
                <div className="id-images-grid">
                  <div 
                    className="id-image-card"
                    onClick={() => openImageModal(
                      `/api/verification/images/${selectedRequest.request.idFrontImage}`,
                      'ID Card Front'
                    )}
                  >
                    <img
                      src={`/api/verification/images/${selectedRequest.request.idFrontImage}`}
                      alt="ID Front"
                      onError={(e) => { e.target.src = '/images/placeholder-id.png'; }}
                    />
                    <span>Front Side</span>
                  </div>
                  <div 
                    className="id-image-card"
                    onClick={() => openImageModal(
                      `/api/verification/images/${selectedRequest.request.idBackImage}`,
                      'ID Card Back'
                    )}
                  >
                    <img
                      src={`/api/verification/images/${selectedRequest.request.idBackImage}`}
                      alt="ID Back"
                      onError={(e) => { e.target.src = '/images/placeholder-id.png'; }}
                    />
                    <span>Back Side</span>
                  </div>
                </div>
              </div>

              {selectedRequest.request.status === 'pending' && (
                <div className="modal-actions">
                  <button
                    className="btn btn-success-wf"
                    onClick={() => handleApprove(selectedRequest.request)}
                  >
                    <i className="bi bi-check-lg me-2"></i>Approve Verification
                  </button>
                  <button
                    className="btn btn-danger-wf"
                    onClick={() => handleReject(selectedRequest.request)}
                  >
                    <i className="bi bi-x-lg me-2"></i>Reject Verification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && imageToView && (
        <div className="modal-overlay dark" onClick={() => setShowImageModal(false)}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>{imageToView.title}</h5>
              <button className="close-btn" onClick={() => setShowImageModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <img
                src={imageToView.url}
                alt={imageToView.title}
                onError={(e) => { e.target.src = '/images/placeholder-id.png'; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          show={true}
          title={confirmAction.title}
          message={
            <>
              {confirmAction.message}
              {confirmAction.showReasonInput && (
                <div className="mt-3">
                  <label className="wf-form-label">Rejection Reason (optional)</label>
                  <textarea
                    className="form-control wf-form-control"
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows="2"
                  />
                </div>
              )}
            </>
          }
          type={confirmAction.type}
          confirmText={actionLoading ? 'Processing...' : 'Confirm'}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
