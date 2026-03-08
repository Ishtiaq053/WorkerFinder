/**
 * ──────────────────────────────────────────────────────────────
 *  ChatFAB — Floating Action Button for Chat Options
 *
 *  Shows a fixed chat icon in the bottom-right corner.
 *  On click it expands to reveal Email and WhatsApp options
 *  that link to the respective communication channels.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect } from 'react';

const SUPPORT_EMAIL = 'support@workerfinder.com';
const WHATSAPP_NUMBER = '923001234567'; // international format, no +
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hi WorkerFinder! I need some help.'
);

export default function ChatFAB() {
  const [open, setOpen] = useState(false);
  const fabRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="chat-fab-wrapper" ref={fabRef}>
      {/* Options popup */}
      <div className={`chat-fab-popup ${open ? 'show' : ''}`}>
        <div className="chat-fab-popup-header">
          <i className="bi bi-headset me-2"></i>Chat with us
        </div>

        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Request`}
          className="chat-fab-option"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
        >
          <span className="chat-fab-option-icon email-icon">
            <i className="bi bi-envelope-fill"></i>
          </span>
          <div className="chat-fab-option-text">
            <strong>Email</strong>
            <small>Send us an email</small>
          </div>
          <i className="bi bi-arrow-right"></i>
        </a>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          className="chat-fab-option"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
        >
          <span className="chat-fab-option-icon whatsapp-icon">
            <i className="bi bi-whatsapp"></i>
          </span>
          <div className="chat-fab-option-text">
            <strong>WhatsApp</strong>
            <small>Chat on WhatsApp</small>
          </div>
          <i className="bi bi-arrow-right"></i>
        </a>
      </div>

      {/* FAB button */}
      <button
        className={`chat-fab-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open chat options"
        title="Chat with us"
      >
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </button>
    </div>
  );
}
