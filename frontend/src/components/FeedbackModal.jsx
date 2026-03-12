/**
 * ──────────────────────────────────────────────────────────────
 *  FeedbackModal Component
 *  Modal for customers to submit feedback after job completion.
 * ──────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';
import Alert from './Alert';
import { feedbackAPI } from '../services/api';
import './FeedbackModal.css';

export default function FeedbackModal({ show, job, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [demeritPoints, setDemeritPoints] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  if (!show || !job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setAlert({ type: 'error', message: 'Please select a rating.' });
      return;
    }

    try {
      setSubmitting(true);
      setAlert(null);

      await feedbackAPI.submit({
        jobId: job.id,
        rating,
        demeritPoints,
        feedbackText: feedbackText.trim()
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();

    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to submit feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemeritChange = (value) => {
    setDemeritPoints(Math.max(0, Math.min(5, value)));
  };

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <div className="header-content">
            <i className="bi bi-star-half"></i>
            <div>
              <h5>Rate Your Experience</h5>
              <p>How was your experience with {job.assignedWorker}?</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="feedback-modal-body">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit}>
            {/* Job Info */}
            <div className="job-info-card mb-4">
              <div className="job-icon">
                <i className="bi bi-briefcase-fill"></i>
              </div>
              <div className="job-details">
                <h6>{job.title}</h6>
                <span className="job-meta">
                  <i className="bi bi-person me-1"></i>{job.assignedWorker}
                  <span className="mx-2">•</span>
                  <i className="bi bi-geo-alt me-1"></i>{job.location}
                </span>
              </div>
            </div>

            {/* Star Rating */}
            <div className="rating-section mb-4">
              <label className="section-label">
                Overall Rating <span className="text-danger">*</span>
              </label>
              <div className="star-rating-container">
                <StarRating
                  rating={rating}
                  onRate={setRating}
                  size="large"
                  interactive
                />
                <span className="rating-label">
                  {rating === 0 && 'Select rating'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              </div>
            </div>

            {/* Demerit Points */}
            <div className="demerit-section mb-4">
              <label className="section-label">
                Demerit Points (Optional)
                <i 
                  className="bi bi-info-circle ms-2" 
                  title="Award demerit points for issues like lateness, unprofessional behavior, or quality problems"
                ></i>
              </label>
              <p className="section-hint">
                Issue demerit points for any problems encountered (0 = no issues, 5 = severe issues)
              </p>
              <div className="demerit-selector">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`demerit-btn ${demeritPoints === num ? 'active' : ''} ${num > 0 ? 'negative' : ''}`}
                    onClick={() => handleDemeritChange(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {demeritPoints > 0 && (
                <div className="demerit-warning">
                  <i className="bi bi-exclamation-triangle"></i>
                  <span>
                    {demeritPoints} demerit point{demeritPoints !== 1 ? 's' : ''} will affect the worker&apos;s reputation score.
                  </span>
                </div>
              )}
            </div>

            {/* Feedback Text */}
            <div className="feedback-text-section mb-4">
              <label className="section-label">
                Written Feedback (Optional)
              </label>
              <textarea
                className="form-control wf-form-control"
                placeholder="Share details about your experience..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows="4"
                maxLength="500"
              />
              <small className="char-count">
                {feedbackText.length}/500 characters
              </small>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary-wf"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-wf"
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

FeedbackModal.propTypes = {
  show: PropTypes.bool.isRequired,
  job: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};
