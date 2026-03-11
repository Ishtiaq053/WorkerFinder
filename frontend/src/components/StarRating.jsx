/**
 * ──────────────────────────────────────────────────────────────
 *  StarRating Component
 *  Displays interactive or read-only star ratings.
 * ──────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import './StarRating.css';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange = null,
  showValue = true,
  showCount = false,
  count = 0,
  label = ''
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const handleClick = (value) => {
    if (!interactive) return;
    setCurrentRating(value);
    if (onChange) onChange(value);
  };

  const handleMouseEnter = (value) => {
    if (!interactive) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || currentRating || rating;

  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'star-rating-xs';
      case 'sm': return 'star-rating-sm';
      case 'lg': return 'star-rating-lg';
      case 'xl': return 'star-rating-xl';
      default: return 'star-rating-md';
    }
  };

  const renderStar = (index) => {
    const value = index + 1;
    const fillPercentage = Math.min(Math.max(displayRating - index, 0), 1) * 100;

    return (
      <span
        key={index}
        className={`star-wrapper ${interactive ? 'interactive' : ''}`}
        onClick={() => handleClick(value)}
        onMouseEnter={() => handleMouseEnter(value)}
        onMouseLeave={handleMouseLeave}
      >
        <span className="star-empty">
          <i className="bi bi-star"></i>
        </span>
        <span
          className="star-filled"
          style={{ width: `${fillPercentage}%` }}
        >
          <i className="bi bi-star-fill"></i>
        </span>
      </span>
    );
  };

  return (
    <div className={`star-rating ${getSizeClass()}`}>
      {label && <span className="star-label">{label}</span>}
      <div className="stars-container">
        {[...Array(maxStars)].map((_, i) => renderStar(i))}
      </div>
      {showValue && (
        <span className="star-value">
          {displayRating.toFixed(1)}
        </span>
      )}
      {showCount && (
        <span className="star-count">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

/**
 * RatingBreakdown Component
 * Shows distribution of ratings.
 */
export function RatingBreakdown({ distribution = {}, totalReviews = 0 }) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="rating-breakdown">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        const barWidth = (count / maxCount) * 100;

        return (
          <div key={stars} className="rating-row">
            <span className="rating-stars-label">{stars} star</span>
            <div className="rating-bar-container">
              <div
                className="rating-bar"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="rating-count">{count}</span>
            <span className="rating-percentage">({percentage.toFixed(0)}%)</span>
          </div>
        );
      })}
    </div>
  );
}
