/**
 * ──────────────────────────────────────────────────────────────
 *  ChatFAB — Floating Action Button for Chat Options
 *
 *  Shows a fixed chat icon in the bottom-right corner.
 *  On click it expands to reveal Email and WhatsApp options
 *  that link to the respective communication channels.
 *
 *  Props:
 *    - showAfterScroll: If true, FAB only appears after scrolling
 *                       past the hero section (for landing page)
 *    - scrollThreshold: Custom scroll threshold in pixels (default: 500)
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useRef, useEffect } from 'react';

const SUPPORT_EMAIL = 'support@workerfinder.com';
const WHATSAPP_NUMBER = '923001234567'; // international format, no +
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hi WorkerFinder! I need some help.'
);

export default function ChatFAB({ showAfterScroll = false, scrollThreshold = 500 }) {
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(!showAfterScroll);
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

  // Handle scroll-based visibility
  useEffect(() => {
    if (!showAfterScroll) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > scrollThreshold);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll, scrollThreshold]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className={`chat-fab-wrapper ${isVisible ? 'visible' : ''}`} ref={fabRef}>
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
