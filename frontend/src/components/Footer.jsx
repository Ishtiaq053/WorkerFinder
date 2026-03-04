/**
 * Footer Component
 * Reusable professional footer with WorkerFinder branding.
 * 
 * Props:
 *   variant — 'public' (full footer) | 'dashboard' (compact)
 */
import { Link } from 'react-router-dom';

export default function Footer({ variant = 'public' }) {
  const currentYear = new Date().getFullYear();

  // Compact footer for dashboard pages
  if (variant === 'dashboard') {
    return (
      <footer className="wf-footer wf-footer-compact">
        <div className="container">
          <div className="footer-bottom">
            <span>
              <i className="bi bi-hammer me-1"></i>
              <strong>WorkerFinder</strong> © {currentYear} — Labour Marketplace Platform
            </span>
          </div>
        </div>
      </footer>
    );
  }

  // Full footer for public pages
  return (
    <footer className="wf-footer">
      <div className="container">
        <div className="row g-4">
          {/* Brand & Description */}
          <div className="col-lg-4 col-md-6">
            <div className="footer-brand">
              <i className="bi bi-hammer"></i>
              WorkerFinder
            </div>
            <p>
              Connecting customers with trusted skilled workers since 2024.
              Post jobs, hire reliable labour, and get quality work done.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="bi bi-twitter-x"></i></a>
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li>
                <Link to="/"><i className="bi bi-chevron-right"></i>Home</Link>
              </li>
              <li>
                <Link to="/contact"><i className="bi bi-chevron-right"></i>Contact</Link>
              </li>
              <li>
                <Link to="/signup"><i className="bi bi-chevron-right"></i>Sign Up</Link>
              </li>
              <li>
                <Link to="/login"><i className="bi bi-chevron-right"></i>Login</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-lg-3 col-md-6">
            <h5>Services</h5>
            <ul className="footer-links">
              <li>
                <Link to="/signup"><i className="bi bi-chevron-right"></i>Find Workers</Link>
              </li>
              <li>
                <Link to="/signup"><i className="bi bi-chevron-right"></i>Post a Job</Link>
              </li>
              <li>
                <Link to="/signup"><i className="bi bi-chevron-right"></i>Join as Worker</Link>
              </li>
              <li>
                <Link to="/signup"><i className="bi bi-chevron-right"></i>Browse Jobs</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-3 col-md-6">
            <h5>Get in Touch</h5>
            <div className="footer-contact-item">
              <i className="bi bi-envelope"></i>
              <span>support@workerfinder.com</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-telephone"></i>
              <span>+92 300 1234567</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-geo-alt"></i>
              <span>Lahore, Pakistan</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-clock"></i>
              <span>Mon — Sat, 9 AM — 6 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          © {currentYear} <strong>WorkerFinder</strong>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
