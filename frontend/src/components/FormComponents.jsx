/**
 * Reusable Form Components
 * Styled form inputs that follow the WorkerFinder theme.
 */

/**
 * FormInput — standard text/email/password/number input.
 */
export function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false
}) {
  return (
    <div className="mb-3">
      <label className="wf-form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        className="form-control wf-form-control"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

/**
 * FormTextArea — multi-line text input.
 */
export function FormTextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false
}) {
  return (
    <div className="mb-3">
      <label className="wf-form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <textarea
        className="form-control wf-form-control"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
    </div>
  );
}

/**
 * FormSelect — dropdown select input.
 * options: Array of { value, label }
 */
export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  required = false
}) {
  return (
    <div className="mb-3">
      <label className="wf-form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        className="form-select wf-form-control"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
