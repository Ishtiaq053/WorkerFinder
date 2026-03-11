/**
 * ──────────────────────────────────────────────────────────────
 *  JobProgressTracker Component
 *  Visual workflow tracker for job status.
 * ──────────────────────────────────────────────────────────────
 */
import './JobProgressTracker.css';

const JOB_STAGES = [
  { key: 'posted', label: 'Posted', icon: 'bi-megaphone' },
  { key: 'open', label: 'Open', icon: 'bi-door-open' },
  { key: 'in-progress', label: 'In Progress', icon: 'bi-gear' },
  { key: 'completed', label: 'Completed', icon: 'bi-check-circle' }
];

const CANCELLED_STAGE = { key: 'cancelled', label: 'Cancelled', icon: 'bi-x-circle' };

export default function JobProgressTracker({
  status = 'open',
  createdAt = null,
  updatedAt = null,
  vertical = false,
  showDates = true,
  size = 'md'
}) {
  const isCancelled = status === 'cancelled';
  
  // Find current stage index
  const getCurrentStageIndex = () => {
    if (isCancelled) return -1;
    const index = JOB_STAGES.findIndex((stage) => stage.key === status);
    return index >= 0 ? index : 0;
  };

  const currentIndex = getCurrentStageIndex();
  const stages = isCancelled ? [...JOB_STAGES.slice(0, currentIndex + 1), CANCELLED_STAGE] : JOB_STAGES;

  const getStageStatus = (index) => {
    if (isCancelled && index === stages.length - 1) return 'cancelled';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`job-progress-tracker ${vertical ? 'vertical' : 'horizontal'} size-${size}`}>
      {stages.map((stage, index) => {
        const stageStatus = getStageStatus(index);
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.key} className={`progress-step ${stageStatus}`}>
            {/* Connector line (before icon) */}
            {index > 0 && (
              <div className={`progress-connector ${stageStatus === 'pending' ? '' : 'active'}`} />
            )}

            {/* Step icon */}
            <div className="progress-icon">
              {stageStatus === 'completed' ? (
                <i className="bi bi-check-lg"></i>
              ) : stageStatus === 'cancelled' ? (
                <i className="bi bi-x-lg"></i>
              ) : (
                <i className={`bi ${stage.icon}`}></i>
              )}
            </div>

            {/* Step label */}
            <div className="progress-content">
              <span className="progress-label">{stage.label}</span>
              {showDates && stageStatus !== 'pending' && (
                <span className="progress-date">
                  {index === 0 && createdAt
                    ? formatDate(createdAt)
                    : stageStatus === 'current' && updatedAt
                    ? formatDate(updatedAt)
                    : ''}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact inline status badge
 */
export function JobStatusBadge({ status }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return { icon: 'bi-door-open-fill', color: 'success', text: 'Open' };
      case 'in-progress':
        return { icon: 'bi-gear-fill', color: 'primary', text: 'In Progress' };
      case 'completed':
        return { icon: 'bi-check-circle-fill', color: 'info', text: 'Completed' };
      case 'cancelled':
        return { icon: 'bi-x-circle-fill', color: 'danger', text: 'Cancelled' };
      default:
        return { icon: 'bi-question-circle-fill', color: 'secondary', text: status };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`badge bg-${config.color} job-status-badge`}>
      <i className={`bi ${config.icon} me-1`}></i>
      {config.text}
    </span>
  );
}
