/**
 * App Component — Main Router Configuration
 * Defines all public and protected routes.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import UserDashboard from './pages/dashboards/UserDashboard';
import WorkerDashboard from './pages/dashboards/WorkerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {/* Global Navbar — visible on every page */}
      <Navbar />

      <Routes>
        {/* ── Public Routes ────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/login"
          element={user ? <Navigate to={`/dashboard/${user.role}`} /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to={`/dashboard/${user.role}`} /> : <Signup />}
        />

        {/* ── Protected Dashboard Routes ───────────────── */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/worker"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all: redirect unknown routes ───────── */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
