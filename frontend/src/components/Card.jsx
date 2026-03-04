/**
 * Card Components
 * Reusable card elements for dashboards.
 */

/**
 * StatCard — displays a single KPI stat with icon.
 *
 * Props:
 *   icon       — Bootstrap icon name (without 'bi-' prefix)
 *   value      — The number/stat to display
 *   label      — Description of the stat
 *   colorClass — CSS class for icon background color
 */
export function StatCard({ icon, value, label, colorClass = 'stat-icon-brown' }) {
  return (
    <div className="stat-card d-flex align-items-center gap-3">
      <div className={`stat-icon ${colorClass}`}>
        <i className={`bi bi-${icon}`}></i>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/**
 * Card — generic card wrapper with optional title.
 *
 * Props:
 *   title     — Optional card header text
 *   children  — Card body content
 *   className — Additional CSS classes
 */
export function Card({ title, children, className = '' }) {
  return (
    <div className={`wf-card ${className}`}>
      {title && (
        <div className="card-header bg-transparent border-bottom p-3">
          <h6 className="mb-0 fw-bold text-primary-wf">{title}</h6>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
