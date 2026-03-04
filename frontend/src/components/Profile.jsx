/**
 * Profile Component
 * Displays and allows editing of user profile data.
 * Used inside dashboard sidebars as a tab view.
 * 
 * Props:
 *   user         — Current user object from AuthContext
 *   workerData   — Worker profile data (for worker role only)
 *   onUpdate     — Callback when profile is saved
 */
import { useState, useEffect } from 'react';
import Alert from './Alert';

export default function Profile({ user, workerData, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    skill: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      const storedProfile = localStorage.getItem(`wf_profile_${user.id}`);
      const profile = storedProfile ? JSON.parse(storedProfile) : {};

      setForm({
        name: user.name || '',
        phone: profile.phone || '',
        location: workerData?.location || profile.location || '',
        skill: workerData?.skill || ''
      });
    }
  }, [user, workerData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (form.phone && !/^[+]?[\d\s\-()]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number.';
    }
    if (!form.location.trim()) newErrors.location = 'Location is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    setSaving(true);

    // Save extended profile to localStorage
    const profileData = {
      phone: form.phone,
      location: form.location
    };
    localStorage.setItem(`wf_profile_${user.id}`, JSON.stringify(profileData));

    // Update user name in main storage
    const storedUser = localStorage.getItem('wf_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userData.name = form.name;
      localStorage.setItem('wf_user', JSON.stringify(userData));
    }

    setTimeout(() => {
      setSaving(false);
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
      setErrors({});
      if (onUpdate) onUpdate(form);
    }, 500);
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  return (
    <div className="wf-card profile-card">
      <div className="card-body">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Profile Header */}
        <div className="d-flex align-items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(62,39,35,0.08)' }}>
          <div className="profile-avatar">
            {getInitials(form.name)}
          </div>
          <div>
            <h5 className="mb-0 fw-bold">{form.name || 'User'}</h5>
            <span className={`wf-badge badge-${user?.role === 'admin' ? 'approved' : user?.role === 'worker' ? 'pending' : 'open'}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <button
            className={`btn ${isEditing ? 'btn-danger-wf' : 'btn-outline-wf'} ms-auto`}
            onClick={() => {
              if (isEditing) setErrors({});
              setIsEditing(!isEditing);
            }}
          >
            <i className={`bi bi-${isEditing ? 'x-lg' : 'pencil'} me-1`}></i>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Profile Form / Display */}
        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} noValidate>
            {/* Name */}
            <div className="mb-3">
              <label className="wf-form-label">Full Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control wf-form-control ${errors.name ? 'is-invalid' : ''}`}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
              />
              {errors.name && (
                <div className="wf-validation-error">
                  <i className="bi bi-exclamation-circle-fill"></i>{errors.name}
                </div>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="mb-3">
              <label className="wf-form-label">Email</label>
              <input
                type="email"
                className="form-control wf-form-control"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7 }}
              />
              <small className="text-muted">Email cannot be changed</small>
            </div>

            {/* Phone */}
            <div className="mb-3">
              <label className="wf-form-label">Phone Number</label>
              <input
                type="tel"
                className={`form-control wf-form-control ${errors.phone ? 'is-invalid' : ''}`}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
              />
              {errors.phone && (
                <div className="wf-validation-error">
                  <i className="bi bi-exclamation-circle-fill"></i>{errors.phone}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="mb-3">
              <label className="wf-form-label">Location <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control wf-form-control ${errors.location ? 'is-invalid' : ''}`}
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
              {errors.location && (
                <div className="wf-validation-error">
                  <i className="bi bi-exclamation-circle-fill"></i>{errors.location}
                </div>
              )}
            </div>

            {/* Skill (Workers only) */}
            {user?.role === 'worker' && (
              <div className="mb-3">
                <label className="wf-form-label">Primary Skill</label>
                <input
                  type="text"
                  className="form-control wf-form-control"
                  value={form.skill}
                  disabled
                  style={{ opacity: 0.7 }}
                />
                <small className="text-muted">Contact admin to change skill</small>
              </div>
            )}

            {/* Save Button */}
            <button type="submit" className="btn btn-primary-wf w-100" disabled={saving}>
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
              ) : (
                <><i className="bi bi-check-lg me-2"></i>Save Changes</>
              )}
            </button>
          </form>
        ) : (
          <div>
            <div className="profile-info-item">
              <span className="label"><i className="bi bi-envelope me-2"></i>Email</span>
              <span className="value">{user?.email || '—'}</span>
            </div>
            <div className="profile-info-item">
              <span className="label"><i className="bi bi-telephone me-2"></i>Phone</span>
              <span className="value">{form.phone || '—'}</span>
            </div>
            <div className="profile-info-item">
              <span className="label"><i className="bi bi-geo-alt me-2"></i>Location</span>
              <span className="value">{form.location || '—'}</span>
            </div>
            {user?.role === 'worker' && (
              <>
                <div className="profile-info-item">
                  <span className="label"><i className="bi bi-tools me-2"></i>Skill</span>
                  <span className="value">{form.skill || '—'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="label"><i className="bi bi-clock me-2"></i>Experience</span>
                  <span className="value">{workerData?.experience || '—'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="label"><i className="bi bi-patch-check me-2"></i>Status</span>
                  <span className={`wf-badge badge-${workerData?.status || 'pending'}`}>
                    {workerData?.status || 'Pending'}
                  </span>
                </div>
              </>
            )}
            <div className="profile-info-item">
              <span className="label"><i className="bi bi-calendar me-2"></i>Joined</span>
              <span className="value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
