import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PricingPage } from './pages/PricingPage';
import { OsbbRegisterPage } from './pages/OsbbRegisterPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { ResidentsPage } from './pages/admin/ResidentsPage';
import { MetersPage } from './pages/admin/MetersPage';
import { ChargesPage } from './pages/admin/ChargesPage';
import { InvoicesPage } from './pages/admin/InvoicesPage';
import { RequestsPage } from './pages/admin/RequestsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
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
  return <Navigate to={dashboardPathForRole(profile.role, profile.is_super_admin)} replace />;
}

function App() {
  return (
    <SubscriptionGuard>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/register" element={<OsbbRegisterPage />} />

        <Route path="/super-admin" element={<ProtectedRoute requireSuperAdmin><SuperAdminDashboard /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/residents" element={<ProtectedRoute role="admin"><ResidentsPage /></ProtectedRoute>} />
        <Route path="/admin/meters" element={<ProtectedRoute role="admin"><MetersPage /></ProtectedRoute>} />
        <Route path="/admin/charges" element={<ProtectedRoute role="admin"><ChargesPage /></ProtectedRoute>} />
        <Route path="/admin/invoices" element={<ProtectedRoute role="admin"><InvoicesPage /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute role="admin"><RequestsPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><ReportsPage /></ProtectedRoute>} />

        <Route path="/user/dashboard" element={<ProtectedRoute role="user"><UserDashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SubscriptionGuard>
  );
}

export default App;
