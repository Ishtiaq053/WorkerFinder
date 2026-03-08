/**
 * ──────────────────────────────────────────────────────────────
 *  Profile Component
 *  Displays and allows editing of user profile data.
 *  Includes profile picture upload functionality.
 *
 *  Props:
 *    user         — Current user object from AuthContext
 *    workerData   — Worker profile data (for worker role only)
 *    onUpdate     — Callback when profile is saved
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import Alert from './Alert';
import { profileAPI } from '../services/api';

export default function Profile({ user, workerData, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    skill: ''
  });

  // Initialize form and fetch profile picture on mount
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

      // Load profile picture from localStorage or fetch from API
      const storedPicture = localStorage.getItem(`wf_picture_${user.id}`);
      if (storedPicture) {
        setProfilePicture(storedPicture);
      } else {
        fetchProfilePicture();
      }
    }
  }, [user, workerData]);

  // Fetch the user's current profile picture
  const fetchProfilePicture = async () => {
    try {
      const response = await profileAPI.getMyPicture();
      if (response.data?.pictureUrl) {
        setProfilePicture(response.data.pictureUrl);
        localStorage.setItem(`wf_picture_${user.id}`, response.data.pictureUrl);
      }
    } catch (err) {
      // No profile picture set — that's okay
      console.log('No profile picture:', err.message);
    }
  };

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

  // Handle profile picture file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAlert({ type: 'error', message: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'File too large. Maximum size is 5MB.' });
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Upload the file
    uploadProfilePicture(file);
  };

  // Upload profile picture to server
  const uploadProfilePicture = async (file) => {
    setUploading(true);
    setAlert(null);

    try {
      const response = await profileAPI.uploadPicture(file);
      
      if (response.success && response.data?.pictureUrl) {
        setProfilePicture(response.data.pictureUrl);
        setPreviewUrl(null);
        setAlert({ type: 'success', message: 'Profile picture updated successfully!' });
        
        // Store in localStorage for persistence
        localStorage.setItem(`wf_picture_${user.id}`, response.data.pictureUrl);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to upload profile picture.' });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete profile picture
  const handleDeletePicture = async () => {
    if (!profilePicture) return;

    try {
      await profileAPI.deletePicture();
      setProfilePicture(null);
      localStorage.removeItem(`wf_picture_${user.id}`);
      setAlert({ type: 'success', message: 'Profile picture removed.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete profile picture.' });
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      // Call API to update profile
      await profileAPI.update({
        name: form.name,
        phone: form.phone,
        location: form.location
      });

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

      setAlert({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
      setErrors({});
      if (onUpdate) onUpdate(form);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  // Get the display picture (preview > profile picture > initials)
  const displayPicture = previewUrl || profilePicture;

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

        {/* Profile Header with Picture Upload */}
        <div className="profile-header mb-4 pb-3" style={{ borderBottom: '1px solid rgba(62,39,35,0.08)' }}>
          <div className="d-flex align-items-start gap-3 flex-wrap">
            {/* Profile Picture Section */}
            <div className="profile-picture-wrapper">
              <div className={`profile-avatar-lg ${uploading ? 'uploading' : ''}`}>
                {displayPicture ? (
                  <img
                    src={displayPicture}
                    alt="Profile"
                    className="profile-avatar-img"
                  />
                ) : (
                  <span className="profile-initials">{getInitials(form.name)}</span>
                )}
                {uploading && (
                  <div className="upload-overlay">
                    <span className="spinner-border spinner-border-sm"></span>
                  </div>
                )}
              </div>

              {/* Picture Upload Controls */}
              <div className="picture-controls mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="d-none"
                  id="profile-picture-input"
                />
                <label
                  htmlFor="profile-picture-input"
                  className="btn btn-sm btn-outline-wf picture-btn"
                  title="Upload new picture"
                >
                  <i className="bi bi-camera"></i>
                </label>
                {profilePicture && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger-wf picture-btn ms-1"
                    onClick={handleDeletePicture}
                    title="Remove picture"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Name and Role */}
            <div className="profile-info flex-grow-1">
              <h5 className="mb-1 fw-bold">{form.name || 'User'}</h5>
              <span className={`wf-badge badge-${user?.role === 'admin' ? 'approved' : user?.role === 'worker' ? 'pending' : 'open'}`}>
                {user?.role?.toUpperCase()}
              </span>
              <p className="text-muted small mt-2 mb-0">
                <i className="bi bi-envelope me-1"></i>{user?.email}
              </p>
            </div>

            {/* Edit Button */}
            <button
              className={`btn ${isEditing ? 'btn-danger-wf' : 'btn-outline-wf'}`}
              onClick={() => {
                if (isEditing) setErrors({});
                setIsEditing(!isEditing);
              }}
            >
              <i className={`bi bi-${isEditing ? 'x-lg' : 'pencil'} me-1`}></i>
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {/* Picture Upload Hint */}
          <div className="text-center mt-3">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Click <i className="bi bi-camera"></i> to upload a profile picture (max 5MB)
            </small>
          </div>
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
