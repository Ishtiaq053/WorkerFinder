/**
 * Login Page - Enhanced with ThemedAlert, validation, and success redirect
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import ThemedAlert from '../components/ThemedAlert';
import AppDialog from '../components/AppDialog';
import Footer from '../components/Footer';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [welcomeDialog, setWelcomeDialog] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAlert(null);

    try {
      const res = await authAPI.login(form);
      const userData = res.data.user;
      const token = res.data.token;

      login(userData, token);

      // Role-based welcome messages
      const welcomeMessages = {
        user: {
          title: `Welcome back, ${userData.name}!`,
          message: 'You can now post jobs and manage your workers.',
          icon: 'bi-briefcase-fill'
        },
        worker: {
          title: `Welcome, ${userData.name}!`,
          message: 'Browse available jobs and apply for work.',
          icon: 'bi-tools'
        },
        admin: {
          title: `Welcome, Admin ${userData.name}`,
          message: 'You can now manage workers and platform activity.',
          icon: 'bi-shield-check'
        }
      };

      setWelcomeDialog({
        role: userData.role,
        ...(welcomeMessages[userData.role] || welcomeMessages.user)
      });

    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Invalid email or password.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="auth-container flex-grow-1">
        <div className="auth-card">
          {/* Header */}
          <div className="text-center mb-4">
            <i className="bi bi-hammer text-primary-wf" style={{ fontSize: '2.5rem' }}></i>
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your WorkerFinder account</p>
          </div>

          {/* Alert */}
          {alert && (
            <ThemedAlert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              duration={alert.type === 'error' ? 5000 : 0}
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="wf-form-label">Email Address <span className="text-danger">*</span></label>
              <input
                type="email"
                className={`form-control wf-form-control ${errors.email ? 'is-invalid' : ''}`}
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
              {errors.email && (
                <div className="wf-validation-error">
                  <i className="bi bi-exclamation-circle-fill"></i>{errors.email}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="wf-form-label">Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className={`form-control wf-form-control ${errors.password ? 'is-invalid' : ''}`}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              {errors.password && (
                <div className="wf-validation-error">
                  <i className="bi bi-exclamation-circle-fill"></i>{errors.password}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary-wf w-100 py-2" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Signing In...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-light-wf mb-1">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="fw-bold text-primary-wf">Sign Up</Link>
            </p>
            <small className="text-muted">Admin: admin@workerfinder.com / admin123</small>
          </div>
        </div>
      </div>
      {/* Welcome Dialog */}
      <AppDialog
        show={!!welcomeDialog}
        type="success"
        title={welcomeDialog?.title || ''}
        message={welcomeDialog?.message || ''}
        icon={welcomeDialog?.icon}
        autoClose={true}
        duration={2500}
        onClose={() => navigate(`/dashboard/${welcomeDialog?.role}`)}
      />

      <Footer variant="public" />
    </div>
  );
}
