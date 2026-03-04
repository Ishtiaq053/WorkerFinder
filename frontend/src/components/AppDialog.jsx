/**
 * AppDialog Component
 * Reusable auto-closing notification dialog for success/info/warning/error feedback.
 *
 * Props:
 *   show       — Boolean to control visibility
 *   title      — Dialog heading
 *   message    — Body text
 *   type       — 'success' | 'info' | 'warning' | 'error' (controls icon & accent)
 *   onClose    — Callback when dialog closes (auto or manual)
 *   autoClose  — Enable auto-close countdown (default: true)
 *   duration   — Auto-close delay in ms (default: 2500)
 *   icon       — Optional override Bootstrap icon class
 */
import { useEffect, useRef, useState } from 'react';

export default function AppDialog({
  show = false,
  title = '',
  message = '',
  type = 'success',
  onClose,
  autoClose = true,
  duration = 2500,
  icon
}) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);

  // Auto-close countdown
  useEffect(() => {
    if (show && autoClose && duration > 0) {
      timerRef.current = setTimeout(() => {
        setClosing(true);
        setTimeout(() => {
          setClosing(false);
          if (onClose) onClose();
        }, 300); // fade-out duration
      }, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, autoClose, duration, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && show && onClose) {
        setClosing(true);
        setTimeout(() => { setClosing(false); onClose(); }, 300);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onClose]);

  if (!show) return null;

  const iconMap = {
    success: 'bi-check-circle-fill',
    info: 'bi-info-circle-fill',
    warning: 'bi-exclamation-circle-fill',
    error: 'bi-x-circle-fill'
  };

  const handleManualClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setClosing(true);
    setTimeout(() => { setClosing(false); if (onClose) onClose(); }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`app-dialog-backdrop ${closing ? 'app-dialog-closing' : ''}`}
        onClick={handleManualClose}
      />

      {/* Dialog */}
      <div className="app-dialog-wrapper">
        <div className={`app-dialog app-dialog-${type} ${closing ? 'app-dialog-closing' : ''}`}>
          {/* Icon */}
          <div className={`app-dialog-icon app-dialog-icon-${type}`}>
            <i className={`bi ${icon || iconMap[type]}`}></i>
          </div>

          {/* Title */}
          {title && <h5 className="app-dialog-title">{title}</h5>}

          {/* Message */}
          <p className="app-dialog-message">{message}</p>

          {/* OK Button */}
          <button
            className={`btn app-dialog-btn app-dialog-btn-${type}`}
            onClick={handleManualClose}
          >
            OK
          </button>

          {/* Auto-close progress bar */}
          {autoClose && duration > 0 && (
            <div className="app-dialog-progress">
              <div
                className={`app-dialog-progress-bar app-dialog-progress-${type}`}
                style={{ animationDuration: `${duration}ms` }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
