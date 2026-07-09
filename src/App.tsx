import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute, dashboardPathForRole } from './components/ProtectedRoute';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { Building2 } from 'lucide-react';

function RootRedirect() {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading && !profile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25 animate-pulse">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPathForRole(profile.role)} replace />;
}

function App() {
  return (
    <SubscriptionGuard>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SubscriptionGuard>
  );
}

export default App;
