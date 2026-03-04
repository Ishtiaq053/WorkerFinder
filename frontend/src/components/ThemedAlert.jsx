/**
 * ThemedAlert Component
 * Enhanced styled alert component with auto-dismiss and progress bar.
 * Supports: success, error, warning, info
 * 
 * Props:
 *   type     — 'success' | 'error' | 'warning' | 'info'
 *   title    — Optional bold heading
 *   message  — Alert body text (required)
 *   onClose  — Callback to dismiss (optional)
 *   duration — Auto-dismiss in ms (0 = no auto-dismiss)
 */
import { useEffect, useState } from 'react';

const icons = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill'
};

export default function ThemedAlert({
  type = 'success',
  title,
  message,
  onClose,
  duration = 4000
}) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after duration (if > 0)
  useEffect(() => {
    if (duration > 0 && message) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, message, onClose]);

  // Don't render if no message or dismissed
  if (!message || !visible) return null;

  return (
    <div className={`wf-alert wf-alert-${type}`} role="alert">
      <i className={`bi ${icons[type]}`} style={{ fontSize: '1.25rem', flexShrink: 0 }}></i>
      <div className="flex-grow-1">
        {title && <strong className="d-block mb-1">{title}</strong>}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          style={{ fontSize: '0.65rem', opacity: 0.6 }}
          aria-label="Close"
        ></button>
      )}
      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div
          className="alert-progress"
          style={{ animationDuration: `${duration}ms` }}
        ></div>
      )}
    </div>
  );
}
