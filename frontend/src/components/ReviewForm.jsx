/**
 * ──────────────────────────────────────────────────────────────
 *  ReviewForm Component
 *  Form for submitting worker reviews.
 * ──────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import StarRating from './StarRating';
import { reviewAPI } from '../services/api';
import './ReviewForm.css';

export default function ReviewForm({
  workerId,
  jobId,
  workerName = 'Worker',
  onSuccess = () => {},
  onCancel = () => {}
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    try {
      setLoading(true);
      const res = await reviewAPI.create({
        workerId,
        jobId,
        rating,
        comment: comment.trim()
      });

      if (res.success) {
        onSuccess(res.data.review);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select rating';
    }
  };

  return (
    <div className="review-form-container">
      <div className="review-form-header">
        <h5 className="mb-1">
          <i className="bi bi-star me-2"></i>
          Rate {workerName}
        </h5>
        <p className="text-muted mb-0 small">
          Share your experience working with this professional
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div className="rating-section">
          <label className="form-label">Your Rating</label>
          <div className="rating-input">
            <StarRating
              rating={rating}
              interactive={true}
              onChange={setRating}
              showValue={false}
              size="xl"
            />
            <span className={`rating-label ${rating > 0 ? 'active' : ''}`}>
              {getRatingLabel()}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-3">
          <label className="form-label">
            Your Review <span className="text-muted">(optional)</span>
          </label>
          <textarea
            className="form-control"
            rows="4"
            placeholder="Tell others about your experience. What went well? Would you recommend this worker?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <small className="text-muted">
            {comment.length}/500 characters
          </small>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger py-2">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="review-form-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || rating === 0}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Submitting...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * ReviewCard - Display a single review
 */
export function ReviewCard({ review, showJob = false }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div>
            <span className="reviewer-name">{review.reviewerName || 'Anonymous'}</span>
            <span className="review-date">{formatDate(review.createdAt)}</span>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" showCount={false} />
      </div>

      {showJob && review.jobTitle && (
        <div className="review-job">
          <i className="bi bi-briefcase me-1"></i>
          {review.jobTitle}
        </div>
      )}

      {review.comment && (
        <p className="review-comment">{review.comment}</p>
      )}
    </div>
  );
}

/**
 * ReviewsList - Display list of reviews
 */
export function ReviewsList({ reviews = [], loading = false, emptyMessage = 'No reviews yet' }) {
  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <i className="bi bi-chat-square-text"></i>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} showJob />
      ))}
    </div>
  );
}
