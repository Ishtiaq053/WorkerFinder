/**
 * ProtectedRoute Component
 * Guards dashboard routes based on authentication and user role.
 *
 * - Not authenticated → redirect to /login
 * - Wrong role → redirect to the correct dashboard
 *
 * Props:
 *   allowedRoles — Array of roles that can access this route
 *   children     — The protected page component
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  // Still checking auth state from localStorage
  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Not logged in — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role — redirect to their dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  // All checks passed — render the protected page
  return children;
}
