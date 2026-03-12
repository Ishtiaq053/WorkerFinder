/**
 * ──────────────────────────────────────────────────────────────
 *  VerificationForm Component
 *  Worker verification submission form with ID upload.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Alert from './Alert';
import LoadingSpinner from './LoadingSpinner';
import { verificationAPI } from '../services/api';
import './VerificationForm.css';

export default function VerificationForm({ workerProfile, onStatusChange }) {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [form, setForm] = useState({
    cnicNumber: '',
    mobileNumber: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [idFrontFile, setIdFrontFile] = useState(null);
  const [idBackFile, setIdBackFile] = useState(null);

  // Fetch current verification status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await verificationAPI.getStatus();
        setVerificationStatus(res.data);
        if (onStatusChange) onStatusChange(res.data);
      } catch (err) {
        console.error('Failed to fetch verification status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [onStatusChange]);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Handle file selection
  const handleFileChange = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setAlert({ type: 'error', message: 'Only JPG, JPEG, and PNG images are allowed.' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'File size must be less than 5MB.' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') {
        setIdFrontPreview(reader.result);
        setIdFrontFile(file);
      } else {
        setIdBackPreview(reader.result);
        setIdBackFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!form.cnicNumber.trim()) {
      newErrors.cnicNumber = 'CNIC/ID number is required.';
    } else if (!/^\d{5}-\d{7}-\d$/.test(form.cnicNumber.trim()) && !/^\d{13}$/.test(form.cnicNumber.replace(/-/g, ''))) {
      newErrors.cnicNumber = 'Please enter a valid CNIC number (e.g., 35201-1234567-1).';
    }
    
    if (!form.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (!/^(\+92|0)?3\d{9}$/.test(form.mobileNumber.replace(/[\s-]/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid Pakistani mobile number.';
    }
    
    if (!form.address.trim()) {
      newErrors.address = 'Address is required.';
    } else if (form.address.trim().length < 10) {
      newErrors.address = 'Please provide a complete address.';
    }
    
    if (!idFrontFile) {
      newErrors.idFront = 'ID card front image is required.';
    }
    
    if (!idBackFile) {
      newErrors.idBack = 'ID card back image is required.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setAlert(null);

      const formData = new FormData();
      formData.append('cnicNumber', form.cnicNumber.trim());
      formData.append('mobileNumber', form.mobileNumber.trim());
      formData.append('address', form.address.trim());
      formData.append('idFront', idFrontFile);
      formData.append('idBack', idBackFile);

      await verificationAPI.submit(formData);

      setAlert({
        type: 'success',
        message: 'Verification request submitted successfully! Admin will review your documents shortly.'
      });

      // Refresh status
      const res = await verificationAPI.getStatus();
      setVerificationStatus(res.data);
      if (onStatusChange) onStatusChange(res.data);

    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to submit verification request.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading verification status..." />;
  }

  // Already verified
  if (workerProfile?.verified === true || verificationStatus?.isVerified) {
    return (
      <div className="verification-status-card verified">
        <div className="status-icon">
          <i className="bi bi-patch-check-fill"></i>
        </div>
        <h5>Account Verified</h5>
        <p>Your identity has been verified. Customers can now see your contact information when you apply for jobs.</p>
        <div className="verification-benefits">
          <div className="benefit-item">
            <i className="bi bi-telephone-fill"></i>
            <span>Contact visible to customers</span>
          </div>
          <div className="benefit-item">
            <i className="bi bi-shield-check"></i>
            <span>Verified badge on profile</span>
          </div>
          <div className="benefit-item">
            <i className="bi bi-star-fill"></i>
            <span>Higher trust score</span>
          </div>
        </div>
      </div>
    );
  }

  // Pending verification request
  if (verificationStatus?.latestRequest?.status === 'pending') {
    return (
      <div className="verification-status-card pending">
        <div className="status-icon">
          <i className="bi bi-hourglass-split"></i>
        </div>
        <h5>Verification Pending</h5>
        <p>Your verification request is being reviewed by our admin team. This usually takes 24-48 hours.</p>
        <div className="request-details">
          <p><strong>Submitted:</strong> {new Date(verificationStatus.latestRequest.submittedAt).toLocaleDateString()}</p>
          <p><strong>CNIC:</strong> {verificationStatus.latestRequest.cnicNumber}</p>
        </div>
      </div>
    );
  }

  // Rejected - allow resubmission
  const wasRejected = verificationStatus?.latestRequest?.status === 'rejected';

  return (
    <div className="verification-form-container">
      <div className="verification-header">
        <i className="bi bi-shield-lock"></i>
        <div>
          <h5>Identity Verification</h5>
          <p>Verify your identity to unlock premium features and build trust with customers.</p>
        </div>
      </div>

      {wasRejected && (
        <div className="wf-alert wf-alert-warning mb-4">
          <i className="bi bi-exclamation-triangle"></i>
          <div>
            <strong>Previous Request Rejected</strong>
            <p className="mb-0 mt-1">
              Reason: {verificationStatus.latestRequest.rejectionReason || 'Documents could not be verified.'}
            </p>
          </div>
        </div>
      )}

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="verification-form">
        {/* CNIC Number */}
        <div className="mb-3">
          <label className="wf-form-label">
            CNIC / ID Card Number <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control wf-form-control ${errors.cnicNumber ? 'is-invalid' : ''}`}
            name="cnicNumber"
            value={form.cnicNumber}
            onChange={handleChange}
            placeholder="35201-1234567-1"
          />
          {errors.cnicNumber && (
            <div className="wf-validation-error">
              <i className="bi bi-exclamation-circle-fill"></i>{errors.cnicNumber}
            </div>
          )}
        </div>

        {/* Mobile Number */}
        <div className="mb-3">
          <label className="wf-form-label">
            Mobile Number <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            className={`form-control wf-form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            placeholder="0300-1234567"
          />
          {errors.mobileNumber && (
            <div className="wf-validation-error">
              <i className="bi bi-exclamation-circle-fill"></i>{errors.mobileNumber}
            </div>
          )}
          <small className="text-muted">This number will be visible to customers after verification.</small>
        </div>

        {/* Address */}
        <div className="mb-3">
          <label className="wf-form-label">
            Complete Address <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control wf-form-control ${errors.address ? 'is-invalid' : ''}`}
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="House #, Street, Area, City"
            rows="3"
          />
          {errors.address && (
            <div className="wf-validation-error">
              <i className="bi bi-exclamation-circle-fill"></i>{errors.address}
            </div>
          )}
        </div>

        {/* ID Card Images */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="wf-form-label">
              ID Card Front <span className="text-danger">*</span>
            </label>
            <div className={`id-upload-box ${errors.idFront ? 'error' : ''}`}>
              {idFrontPreview ? (
                <div className="id-preview">
                  <img src={idFrontPreview} alt="ID Front" />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger remove-btn"
                    onClick={() => {
                      setIdFrontPreview(null);
                      setIdFrontFile(null);
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <i className="bi bi-credit-card-2-front"></i>
                  <span>Click to upload front</span>
                  <small>JPG, PNG (max 5MB)</small>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handleFileChange(e, 'front')}
                    hidden
                  />
                </label>
              )}
            </div>
            {errors.idFront && (
              <div className="wf-validation-error">
                <i className="bi bi-exclamation-circle-fill"></i>{errors.idFront}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="wf-form-label">
              ID Card Back <span className="text-danger">*</span>
            </label>
            <div className={`id-upload-box ${errors.idBack ? 'error' : ''}`}>
              {idBackPreview ? (
                <div className="id-preview">
                  <img src={idBackPreview} alt="ID Back" />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger remove-btn"
                    onClick={() => {
                      setIdBackPreview(null);
                      setIdBackFile(null);
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <i className="bi bi-credit-card-2-back"></i>
                  <span>Click to upload back</span>
                  <small>JPG, PNG (max 5MB)</small>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handleFileChange(e, 'back')}
                    hidden
                  />
                </label>
              )}
            </div>
            {errors.idBack && (
              <div className="wf-validation-error">
                <i className="bi bi-exclamation-circle-fill"></i>{errors.idBack}
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice mb-4">
          <i className="bi bi-lock-fill"></i>
          <p>
            Your documents are securely stored and only accessible to authorized administrators
            for verification purposes. We follow strict data protection guidelines.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary-wf w-100 py-2"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Submitting...
            </>
          ) : (
            <>
              <i className="bi bi-shield-check me-2"></i>
              Submit Verification Request
            </>
          )}
        </button>
      </form>
    </div>
  );
}

VerificationForm.propTypes = {
  workerProfile: PropTypes.object,
  onStatusChange: PropTypes.func
};
