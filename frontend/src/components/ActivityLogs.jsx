/**
 * ──────────────────────────────────────────────────────────────
 *  ActivityLogs Component
 *  Admin activity log viewer with filters.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { logsAPI } from '../services/api';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [actionTypes, setActionTypes] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchActionTypes();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const res = await logsAPI.getAll(params);
      
      if (res.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActionTypes = async () => {
    try {
      const res = await logsAPI.getActionTypes();
      if (res.success) {
        setActionTypes(res.data.actionTypes);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      targetType: '',
      startDate: '',
      endDate: '',
      page: 1
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    if (action.includes('approve')) return 'bi-check-circle-fill text-success';
    if (action.includes('reject')) return 'bi-x-circle-fill text-danger';
    if (action.includes('delete')) return 'bi-trash-fill text-danger';
    if (action.includes('restrict')) return 'bi-lock-fill text-warning';
    if (action.includes('create')) return 'bi-plus-circle-fill text-primary';
    if (action.includes('update')) return 'bi-pencil-fill text-info';
    return 'bi-activity text-secondary';
  };

  const getActionLabel = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="activity-logs">
      <div className="logs-header">
        <h5>
          <i className="bi bi-clock-history me-2"></i>
          Activity Logs
        </h5>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-group">
          <select
            className="form-select form-select-sm"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All Actions</option>
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {getActionLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            className="form-select form-select-sm"
            value={filters.targetType}
            onChange={(e) => handleFilterChange('targetType', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="user">Users</option>
            <option value="worker">Workers</option>
            <option value="job">Jobs</option>
            <option value="application">Applications</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            placeholder="Start Date"
          />
        </div>

        <div className="filter-group">
          <input
            type="date"
            className="form-control form-control-sm"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            placeholder="End Date"
          />
        </div>

        {(filters.action || filters.targetType || filters.startDate || filters.endDate) && (
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={clearFilters}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {/* Logs List */}
      <div className="logs-list">
        {loading ? (
          <div className="logs-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">
            <i className="bi bi-journal-x"></i>
            <p>No activity logs found</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-icon">
                <i className={getActionIcon(log.action)}></i>
              </div>
              <div className="log-content">
                <div className="log-action">
                  <strong>{log.adminName}</strong>
                  <span className="log-action-text">
                    {getActionLabel(log.action)}
                  </span>
                  {log.targetType && (
                    <span className="log-target badge bg-secondary">
                      {log.targetType}
                    </span>
                  )}
                </div>
                {log.details?.name && (
                  <div className="log-details">
                    Target: {log.details.name}
                  </div>
                )}
              </div>
              <div className="log-time">
                {formatDate(log.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="logs-pagination">
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={filters.page === 1}
            onClick={() => handleFilterChange('page', filters.page - 1)}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={!pagination.hasMore}
            onClick={() => handleFilterChange('page', filters.page + 1)}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
