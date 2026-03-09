/**
 * Signup Page - Enhanced with validation and role-based post-signup flow
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import ThemedAlert from '../components/ThemedAlert';
import AppDialog from '../components/AppDialog';
import Footer from '../components/Footer';

const skillOptions = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'mason', label: 'Mason' },
  { value: 'welder', label: 'Welder' },
  { value: 'driver', label: 'Driver' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'labourer', label: 'General Labourer' },
  { value: 'other', label: 'Other' }
];

const MAX_SKILLS = 3;

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    skill: '',
    experience: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [signupDialog, setSignupDialog] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear field error on change
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Toggle a skill in the comma-separated skill string (max 3 skills)
  const handleSkillToggle = (skillValue) => {
    const currentSkills = form.skill ? form.skill.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let updatedSkills;
    if (currentSkills.includes(skillValue)) {
      // Always allow removing a skill
      updatedSkills = currentSkills.filter((s) => s !== skillValue);
    } else {
      // Check if max skills reached
      if (currentSkills.length >= MAX_SKILLS) {
        setAlert({
          type: 'warning',
          title: 'Maximum Skills Reached',
          message: `You can only select up to ${MAX_SKILLS} skills. Please remove one to add another.`
        });
        return;
      }
      updatedSkills = [...currentSkills, skillValue];
    }
    setForm({ ...form, skill: updatedSkills.join(',') });
    if (errors.skill) setErrors({ ...errors, skill: '' });
  };

  // Get current skills count
  const getCurrentSkillsCount = () => {
    return form.skill ? form.skill.split(',').map((s) => s.trim()).filter(Boolean).length : 0;
  };

  // Client-side validation
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!form.role) newErrors.role = 'Please select a role.';
    if (form.role === 'worker') {
      if (!form.skill) newErrors.skill = 'Please select at least one skill.';
      if (!form.experience.trim()) newErrors.experience = 'Experience is required.';
      if (!form.location.trim()) newErrors.location = 'Location is required.';
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
      await authAPI.signup(form);

      // Role-based post-signup flow (DO NOT auto-login)
      if (form.role === 'worker') {
        setSignupDialog({
          type: 'warning',
          title: 'Account Created — Approval Pending',
          message: 'Your worker account has been created! An admin will review and approve your profile within 12–24 hours. Please wait for approval before logging in.',
          icon: 'bi-hourglass-split',
          confirmText: 'Got It'
        });
      } else {
        setSignupDialog({
          type: 'success',
          title: 'Account Created Successfully!',
          message: 'Your customer account is ready. You can now sign in and start posting jobs or hiring workers.',
          confirmText: 'Continue to Login'
        });
      }

    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Signup failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="auth-container flex-grow-1">
        <div className="auth-card" style={{ maxWidth: '520px' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <i className="bi bi-person-plus text-primary-wf" style={{ fontSize: '2.5rem' }}></i>
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join WorkerFinder as a customer or worker</p>
          </div>

          {/* Alert */}
          {alert && (
            <ThemedAlert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert(null)}
              duration={alert.type === 'error' ? 6000 : 0}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="mb-3">
              <label className="wf-form-label">Full Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control wf-form-control ${errors.name ? 'border-danger' : ''}`}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
              {errors.name && <small className="text-danger">{errors.name}</small>}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="wf-form-label">Email Address <span className="text-danger">*</span></label>
              <input
                type="email"
                className={`form-control wf-form-control ${errors.email ? 'border-danger' : ''}`}
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
              {errors.email && <small className="text-danger">{errors.email}</small>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="wf-form-label">Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className={`form-control wf-form-control ${errors.password ? 'border-danger' : ''}`}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
              />
              {errors.password && <small className="text-danger">{errors.password}</small>}
            </div>

            {/* Role Selection */}
            <div className="mb-3">
              <label className="wf-form-label">I want to join as <span className="text-danger">*</span></label>
              <div className="d-flex gap-3">
                <label
                  className={`flex-fill text-center p-3 rounded-3 border-2 ${
                    form.role === 'user' ? 'border-dark bg-primary-wf text-white' : 'border bg-light'
                  }`}
                  style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <input type="radio" name="role" value="user" className="d-none" onChange={handleChange} />
                  <i className="bi bi-briefcase d-block mb-1" style={{ fontSize: '1.5rem' }}></i>
                  <strong>Customer</strong>
                  <small className="d-block" style={{ opacity: 0.75 }}>Post jobs & hire</small>
                </label>

                <label
                  className={`flex-fill text-center p-3 rounded-3 border-2 ${
                    form.role === 'worker' ? 'border-dark bg-primary-wf text-white' : 'border bg-light'
                  }`}
                  style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <input type="radio" name="role" value="worker" className="d-none" onChange={handleChange} />
                  <i className="bi bi-tools d-block mb-1" style={{ fontSize: '1.5rem' }}></i>
                  <strong>Worker</strong>
                  <small className="d-block" style={{ opacity: 0.75 }}>Find work & earn</small>
                </label>
              </div>
              {errors.role && <small className="text-danger">{errors.role}</small>}
            </div>

            {/* Worker fields */}
            {form.role === 'worker' && (
              <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--bg-warm)' }}>
                <h6 className="fw-bold text-primary-wf mb-3">
                  <i className="bi bi-tools me-2"></i>Worker Profile Details
                </h6>
                <div className="mb-3">
                  <label className="wf-form-label">
                    Skills <span className="text-danger">*</span>{' '}
                    <small className={`${getCurrentSkillsCount() >= MAX_SKILLS ? 'text-warning fw-bold' : 'text-muted'}`}>
                      (select up to {MAX_SKILLS} skills — {getCurrentSkillsCount()}/{MAX_SKILLS} selected)
                    </small>
                  </label>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {skillOptions.map((opt) => {
                      const selected = form.skill.split(',').map((s) => s.trim()).includes(opt.value);
                      const isDisabled = !selected && getCurrentSkillsCount() >= MAX_SKILLS;
                      return (
                        <label
                          key={opt.value}
                          className={`d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill border ${
                            selected 
                              ? 'bg-primary-wf text-white border-dark' 
                              : isDisabled 
                                ? 'bg-light text-muted border-secondary' 
                                : 'bg-white'
                          }`}
                          style={{ 
                            cursor: isDisabled ? 'not-allowed' : 'pointer', 
                            fontSize: '0.88rem', 
                            transition: 'all 0.2s',
                            opacity: isDisabled ? 0.5 : 1
                          }}
                          title={isDisabled ? `Maximum ${MAX_SKILLS} skills allowed` : ''}
                        >
                          <input
                            type="checkbox"
                            className="d-none"
                            checked={selected}
                            onChange={() => handleSkillToggle(opt.value)}
                            disabled={isDisabled}
                          />
                          {selected && <i className="bi bi-check-lg"></i>}
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  {errors.skill && <small className="text-danger">{errors.skill}</small>}
                </div>
                <div className="mb-3">
                  <label className="wf-form-label">Experience <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control wf-form-control ${errors.experience ? 'border-danger' : ''}`}
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="e.g., 3 years"
                  />
                  {errors.experience && <small className="text-danger">{errors.experience}</small>}
                </div>
                <div className="mb-0">
                  <label className="wf-form-label">Location <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control wf-form-control ${errors.location ? 'border-danger' : ''}`}
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g., Lahore, Pakistan"
                  />
                  {errors.location && <small className="text-danger">{errors.location}</small>}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary-wf w-100 py-2" disabled={loading || !form.role}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Creating Account...</>
              ) : (
                <><i className="bi bi-person-plus me-2"></i>Create Account</>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-light-wf">
              Already have an account?{' '}
              <Link to="/login" className="fw-bold text-primary-wf">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
      {/* Success / Pending Dialog */}
      <AppDialog
        show={!!signupDialog}
        type={signupDialog?.type || 'success'}
        title={signupDialog?.title || ''}
        message={signupDialog?.message || ''}
        icon={signupDialog?.icon}
        autoClose={true}
        duration={3000}
        onClose={() => navigate('/login')}
      />

      <Footer variant="public" />
    </div>
  );
}
