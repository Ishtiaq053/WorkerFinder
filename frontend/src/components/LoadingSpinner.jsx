/**
 * LoadingSpinner Component
 * Centered spinner with optional message text.
 */
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="wf-spinner-container">
      <div className="text-center">
        <div className="wf-spinner mx-auto mb-3"></div>
        <p className="text-light-wf">{message}</p>
      </div>
    </div>
  );
}
