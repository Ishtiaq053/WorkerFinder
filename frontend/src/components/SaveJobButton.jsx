/**
 * ──────────────────────────────────────────────────────────────
 *  SaveJobButton Component
 *  Heart icon button to save/unsave jobs.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { savedJobsAPI } from '../services/api';
import './SaveJobButton.css';

export default function SaveJobButton({
  jobId,
  initialSaved = null,
  size = 'md',
  showText = false,
  onToggle = null
}) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If initialSaved is not provided, check via API
    if (initialSaved === null && jobId) {
      checkIfSaved();
    }
  }, [jobId, initialSaved]);

  const checkIfSaved = async () => {
    try {
      const res = await savedJobsAPI.checkIfSaved(jobId);
      if (res.success) {
        setIsSaved(res.data.isSaved);
      }
    } catch (err) {
      console.error('Failed to check saved status:', err);
      setIsSaved(false);
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;

    try {
      setLoading(true);
      const res = await savedJobsAPI.toggle(jobId);
      
      if (res.success) {
        const newState = res.data.isSaved;
        setIsSaved(newState);
        if (onToggle) onToggle(newState);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'save-btn-sm';
      case 'lg': return 'save-btn-lg';
      default: return 'save-btn-md';
    }
  };

  return (
    <button
      className={`save-job-btn ${getSizeClass()} ${isSaved ? 'saved' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={isSaved ? 'Remove from saved' : 'Save job'}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" />
      ) : (
        <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'}`}></i>
      )}
      {showText && (
        <span className="save-text">
          {isSaved ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
