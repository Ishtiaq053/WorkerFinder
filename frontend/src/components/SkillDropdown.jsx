/**
 * ──────────────────────────────────────────────────────────────
 *  SkillDropdown Component
 *  Reusable component for selecting skills from the centralized
 *  skills list. Used in signup, profile, job posting, and filters.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { skillsAPI } from '../services/api';
import './SkillDropdown.css';

export default function SkillDropdown({
  value = '',
  onChange,
  multiple = false,
  maxSelections = 3,
  placeholder = 'Select skill(s)',
  label = 'Skills',
  required = false,
  error = '',
  disabled = false,
  showCount = true,
  variant = 'default' // 'default', 'pills', 'chips'
}) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Parse current value into array
  const selectedSkills = value
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const res = await skillsAPI.getAll();
        setSkills(res.data.skills || []);
        setFetchError(null);
      } catch (err) {
        console.error('Failed to fetch skills:', err);
        setFetchError('Failed to load skills');
        // Fallback to default skills
        setSkills([
          'Plumbing', 'Electrical', 'Carpentry', 'Painting',
          'Construction', 'Driving', 'Gardening', 'Mechanic',
          'Cleaning', 'Mason', 'Welder', 'General Labour'
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  // Handle skill toggle (for multiple selection)
  const handleSkillToggle = (skill) => {
    if (disabled) return;

    if (multiple) {
      let updatedSkills;
      if (selectedSkills.includes(skill)) {
        updatedSkills = selectedSkills.filter(s => s !== skill);
      } else {
        if (selectedSkills.length >= maxSelections) {
          return; // Don't add if max reached
        }
        updatedSkills = [...selectedSkills, skill];
      }
      onChange(updatedSkills.join(','));
    } else {
      onChange(skill);
    }
  };

  // Handle single select dropdown change
  const handleSelectChange = (e) => {
    if (disabled) return;
    onChange(e.target.value);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="skill-dropdown-loading">
        <div className="spinner-border spinner-border-sm me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        Loading skills...
      </div>
    );
  }

  // Render single select dropdown
  if (!multiple) {
    return (
      <div className="skill-dropdown-wrapper">
        {label && (
          <label className="wf-form-label">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          className={`form-select wf-form-control ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={handleSelectChange}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {skills.map((skill) => (
            <option key={skill} value={skill.toLowerCase()}>
              {skill}
            </option>
          ))}
        </select>
        {error && <div className="wf-validation-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
        {fetchError && <small className="text-warning">{fetchError}</small>}
      </div>
    );
  }

  // Render multiple selection (pills/chips variant)
  return (
    <div className="skill-dropdown-wrapper">
      {label && (
        <label className="wf-form-label">
          {label} {required && <span className="text-danger">*</span>}
          {showCount && (
            <small className={`ms-2 ${selectedSkills.length >= maxSelections ? 'text-warning fw-bold' : 'text-muted'}`}>
              (select up to {maxSelections} — {selectedSkills.length}/{maxSelections} selected)
            </small>
          )}
        </label>
      )}
      
      <div className={`skill-pills-container ${variant}`}>
        {skills.map((skill) => {
          const isSelected = selectedSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
          const isDisabled = disabled || (!isSelected && selectedSkills.length >= maxSelections);
          
          return (
            <label
              key={skill}
              className={`skill-pill ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              title={isDisabled && !isSelected ? `Maximum ${maxSelections} skills allowed` : ''}
            >
              <input
                type="checkbox"
                className="d-none"
                checked={isSelected}
                onChange={() => handleSkillToggle(skill)}
                disabled={isDisabled}
              />
              {isSelected && <i className="bi bi-check-lg me-1"></i>}
              {skill}
            </label>
          );
        })}
      </div>
      
      {error && <div className="wf-validation-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
      {fetchError && <small className="text-warning d-block mt-1">{fetchError}</small>}
    </div>
  );
}

SkillDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  maxSelections: PropTypes.number,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  showCount: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'pills', 'chips'])
};
