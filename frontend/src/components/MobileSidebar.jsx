/**
 * MobileSidebar Component
 * Professional mobile navigation for dashboard with slide-out drawer.
 *
 * Props:
 *   items       — Array of { key, label, icon } objects
 *   activeTab   — Currently selected tab key
 *   onTabChange — Callback when a tab is clicked
 *   user        — Current user object (for header display)
 */
import { useState, useEffect, useRef } from 'react';

export default function MobileSidebar({ items, activeTab, onTabChange, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        const toggleBtn = document.querySelector('.mobile-sidebar-toggle');
        if (toggleBtn && !toggleBtn.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleTabChange = (key) => {
    onTabChange(key);
    setIsOpen(false);
  };

  // Get role badge color
  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'admin':
        return 'role-badge-admin';
      case 'worker':
        return 'role-badge-worker';
      default:
        return 'role-badge-user';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className={`mobile-sidebar-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className="toggle-icon">
          {isOpen ? (
            <i className="bi bi-x-lg"></i>
          ) : (
            <i className="bi bi-list"></i>
          )}
        </span>
        <span className="toggle-label">Menu</span>
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`mobile-sidebar-backdrop ${isOpen ? 'show' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className={`mobile-sidebar ${isOpen ? 'open' : ''}`}
        aria-hidden={!isOpen}
      >
        {/* Sidebar Header */}
        <div className="mobile-sidebar-header">
          <div className="user-profile-section">
            <div className="user-avatar">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="user-info">
              <h6 className="user-name">{user?.name || 'User'}</h6>
              <span className={`role-badge ${getRoleBadgeClass()}`}>
                {user?.role?.toUpperCase() || 'USER'}
              </span>
            </div>
          </div>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Dashboard Title */}
        <div className="mobile-sidebar-title">
          <i className="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </div>

        {/* Navigation Items */}
        <nav className="mobile-sidebar-nav">
          <ul>
            {items.map((item) => (
              <li key={item.key}>
                <button
                  className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => handleTabChange(item.key)}
                >
                  <span className="nav-icon">
                    <i className={`bi bi-${item.icon}`}></i>
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {activeTab === item.key && (
                    <span className="active-indicator">
                      <i className="bi bi-check2"></i>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="mobile-sidebar-footer">
          <div className="footer-brand">
            <i className="bi bi-briefcase-fill"></i>
            <span>WorkerFinder</span>
          </div>
          <small>Labour Marketplace</small>
        </div>
      </aside>
    </>
  );
}
