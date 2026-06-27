import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import PublicLayout  from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/auth/LoginPage';
import RegisterPage  from './pages/auth/RegisterPage';

// Protected pages
import DashboardPage    from './pages/dashboard/DashboardPage';
import IssuesPage       from './pages/issues/IssuesPage';
import IssueDetailPage  from './pages/issues/IssueDetailPage';
import ReportIssuePage  from './pages/issues/ReportIssuePage';
import VerificationsPage from './pages/verifications/VerificationsPage';
import ProfilePage      from './pages/profile/ProfilePage';
import NotFoundPage     from './pages/NotFoundPage';

// Admin pages
import AdminDashboardPage   from './pages/admin/AdminDashboardPage';
import AdminComplaintsPage  from './pages/admin/AdminComplaintsPage';
import AdminUsersPage       from './pages/admin/AdminUsersPage';

// Route guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      </Route>

      {/* ── Protected / dashboard routes ──────────────────────── */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard"               element={<DashboardPage />} />
        <Route path="/issues"                  element={<IssuesPage />} />
        <Route path="/issues/report"           element={<ReportIssuePage />} />
        <Route path="/issues/:id"              element={<IssueDetailPage />} />
        <Route path="/issues/:id/verify"       element={<VerificationsPage />} />
        <Route path="/profile"                 element={<ProfilePage />} />
      </Route>

      {/* ── Admin routes ────────────────────────────────────────── */}
      <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route path="/admin"            element={<AdminDashboardPage />} />
        <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
        <Route path="/admin/users"      element={<AdminUsersPage />} />
      </Route>

      {/* ── 404 ───────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
