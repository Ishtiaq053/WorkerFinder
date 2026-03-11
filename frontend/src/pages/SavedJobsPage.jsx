/**
 * ──────────────────────────────────────────────────────────────
 *  SavedJobsPage Component
 *  Displays user's saved/bookmarked jobs.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { savedJobsAPI } from '../services/api';
import SaveJobButton from '../components/SaveJobButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import './SavedJobsPage.css';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const res = await savedJobsAPI.getAll();
      if (res.success) {
        setSavedJobs(res.data.savedJobs);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch saved jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = (jobId) => {
    setSavedJobs((prev) => prev.filter((s) => s.job.id !== jobId));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-success',
      'in-progress': 'bg-primary',
      completed: 'bg-info',
      cancelled: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="saved-jobs-page">
        <div className="container py-4">
          <LoadingSpinner message="Loading saved jobs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="saved-jobs-page">
      <div className="container py-4">
        {/* Header */}
        <div className="page-header">
          <div>
            <h2>
              <i className="bi bi-heart-fill text-danger me-2"></i>
              Saved Jobs
            </h2>
            <p className="text-muted mb-0">
              Jobs you've bookmarked for later
            </p>
          </div>
          <span className="badge bg-primary saved-count">
            {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'}
          </span>
        </div>

        {error && (
          <Alert type="danger" message={error} onClose={() => setError('')} />
        )}

        {/* Jobs Grid */}
        {savedJobs.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-bookmark-heart"></i>
            <h4>No saved jobs yet</h4>
            <p className="text-muted">
              Browse available jobs and click the heart icon to save them for later.
            </p>
            <Link to="/dashboard/worker" className="btn btn-primary">
              <i className="bi bi-search me-2"></i>
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="saved-jobs-grid">
            {savedJobs.map((item) => (
              <div key={item.id} className="saved-job-card">
                <div className="card-header">
                  <span className={`badge ${getStatusBadge(item.job.status)}`}>
                    {item.job.status}
                  </span>
                  <SaveJobButton
                    jobId={item.job.id}
                    initialSaved={true}
                    size="sm"
                    onToggle={(isSaved) => !isSaved && handleUnsave(item.job.id)}
                  />
                </div>

                <h5 className="job-title">{item.job.title}</h5>
                
                <div className="job-meta">
                  <span>
                    <i className="bi bi-geo-alt me-1"></i>
                    {item.job.location}
                  </span>
                  <span>
                    <i className="bi bi-cash me-1"></i>
                    ${item.job.budget}
                  </span>
                </div>

                <p className="job-description">
                  {item.job.description?.substring(0, 100)}
                  {item.job.description?.length > 100 && '...'}
                </p>

                <div className="job-footer">
                  <small className="text-muted">
                    Saved on {formatDate(item.savedAt)}
                  </small>
                  <small className="text-muted">
                    Posted by {item.job.posterName}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
