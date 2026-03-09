/**
 * Navbar Component
 * Global navigation bar — adapts based on auth state.
 * Includes logout confirmation dialog.
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import AppDialog from './AppDialog';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const isOnDashboard = location.pathname.startsWith('/dashboard');

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    setShowLogoutSuccess(true);
  };

  const handleLogoutSuccessClose = () => {
    setShowLogoutSuccess(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg wf-navbar">
        <div className="container-fluid">
          {/* Brand */}
          <Link className="navbar-brand" to="/">
            <i className="bi bi-hammer me-2"></i>
            WorkerFinder
          </Link>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center gap-1">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              {/* Show Contact only for non-authenticated users */}
              {!isAuthenticated && (
                <li className="nav-item">
                  <Link className="nav-link" to="/contact">
                    <i className="bi bi-envelope me-1"></i>Contact
                  </Link>
                </li>
              )}

              {isAuthenticated ? (
                <>
                  {!isOnDashboard && (
                    <li className="nav-item">
                      <Link className="nav-link" to={`/dashboard/${user.role}`}>
                        <i className="bi bi-speedometer2 me-1"></i>Dashboard
                      </Link>
                    </li>
                  )}
                  <li className="nav-item ms-2">
                    <span
                      className="nav-link"
                      style={{ cursor: 'default', opacity: 0.8 }}
                    >
                      <i className="bi bi-person-circle me-1"></i>
                      {user.name}
                      <span className="ms-1 opacity-75">({user.role})</span>
                    </span>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-outline-light btn-sm ms-2"
                      onClick={handleLogoutClick}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i>Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-outline-light btn-sm ms-2" to="/signup">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        show={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
        icon="bi-box-arrow-right"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Logout Success Dialog */}
      <AppDialog
        show={showLogoutSuccess}
        type="success"
        title="Logged Out"
        message="You have been logged out successfully. See you next time!"
        autoClose={true}
        duration={2000}
        onClose={handleLogoutSuccessClose}
      />
    </>
  );
}
