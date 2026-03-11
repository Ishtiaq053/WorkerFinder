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
import SavedJobsPage from './pages/SavedJobsPage';

// Service Pages
import {
  PlumbingService,
  ElectricalService,
  CarpentryService,
  PaintingService,
  ConstructionService,
  DrivingService,
  GardeningService,
  MechanicService,
} from './pages/services';

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
        
        {/* ── Service Pages ────────────────────────────── */}
        <Route path="/services/plumbing" element={<PlumbingService />} />
        <Route path="/services/electrical" element={<ElectricalService />} />
        <Route path="/services/carpentry" element={<CarpentryService />} />
        <Route path="/services/painting" element={<PaintingService />} />
        <Route path="/services/construction" element={<ConstructionService />} />
        <Route path="/services/driving" element={<DrivingService />} />
        <Route path="/services/gardening" element={<GardeningService />} />
        <Route path="/services/mechanic" element={<MechanicService />} />
        
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
          path="/saved-jobs"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <SavedJobsPage />
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
