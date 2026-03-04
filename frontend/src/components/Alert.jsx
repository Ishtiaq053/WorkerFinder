/**
 * Alert Component
 * Displays success/error/warning/info messages with auto-dismiss.
 *
 * Props:
 *   type     — 'success' | 'error' | 'warning' | 'info'
 *   message  — The alert text
 *   onClose  — Callback to dismiss the alert
 *   duration — Auto-dismiss time in ms (0 = no auto-dismiss)
 */
import { useEffect } from 'react';

export default function Alert({
  type = 'success',
  message,
  onClose,
  duration = 4000
}) {
  // Auto-dismiss after `duration` milliseconds
  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  // Don't render if there's no message
  if (!message) return null;

  // Map alert types to Bootstrap icon names
  const icons = {
    success: 'check-circle-fill',
    error: 'exclamation-triangle-fill',
    warning: 'exclamation-circle-fill',
    info: 'info-circle-fill'
  };

  return (
    <div className={`wf-alert wf-alert-${type}`}>
      <i className={`bi bi-${icons[type]}`}></i>
      <span className="flex-grow-1">{message}</span>
      {onClose && (
        <button
          className="btn-close btn-close-sm"
          onClick={onClose}
          style={{ fontSize: '0.7rem' }}
        ></button>
      )}
    </div>
  );
}
