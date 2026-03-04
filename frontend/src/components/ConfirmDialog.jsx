/**
 * ConfirmDialog Component
 * Reusable Bootstrap-styled confirmation modal.
 * 
 * Props:
 *   show      — Boolean to control visibility
 *   title     — Modal heading (default: 'Confirm Action')
 *   message   — Body text (default: 'Are you sure?')
 *   confirmText — Text for confirm button (default: 'Confirm')
 *   cancelText  — Text for cancel button (default: 'Cancel')
 *   type      — 'danger' | 'warning' | 'info' (controls confirm button color)
 *   icon      — Bootstrap icon class (optional)
 *   onConfirm — Callback when confirmed
 *   onCancel  — Callback when cancelled / closed
 *   loading   — Show spinner on confirm button
 */
import { useEffect } from 'react';

export default function ConfirmDialog({
  show = false,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon,
  onConfirm,
  onCancel,
  loading = false,
  showCancel = true
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && show && onCancel) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onCancel]);

  if (!show) return null;

  const iconMap = {
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-question-circle-fill',
    success: 'bi-check-circle-fill'
  };

  const confirmBtnClass = {
    danger: 'btn-danger-wf',
    warning: 'btn-secondary-wf',
    info: 'btn-primary-wf',
    success: 'btn-primary-wf'
  };

  return (
    <>
      {/* Backdrop */}
      <div className="confirm-dialog-backdrop" onClick={onCancel} />

      {/* Modal */}
      <div className="confirm-dialog-wrapper">
        <div className="confirm-dialog">
          {/* Icon */}
          <div className={`confirm-dialog-icon confirm-dialog-icon-${type}`}>
            <i className={`bi ${icon || iconMap[type]}`}></i>
          </div>

          {/* Title */}
          <h5 className="confirm-dialog-title">{title}</h5>

          {/* Message */}
          <p className="confirm-dialog-message">{message}</p>

          {/* Actions */}
          <div className="confirm-dialog-actions">
            {showCancel && (
              <button
                className="btn btn-outline-wf"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </button>
            )}
            <button
              className={`btn ${confirmBtnClass[type] || 'btn-danger-wf'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Please wait...</>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
