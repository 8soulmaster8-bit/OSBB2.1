import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2 } from 'lucide-react';

function FullScreenLoader() {
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

export function dashboardPathForRole(role: string | undefined, isSuperAdmin: boolean = false) {
  if (isSuperAdmin) return '/super-admin';
  return role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
}

interface ProtectedRouteProps {
  role?: 'admin' | 'user';
  requireSuperAdmin?: boolean;
  children: ReactNode;
}

export function ProtectedRoute({ role, requireSuperAdmin, children }: ProtectedRouteProps) {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading && !profile)) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <FullScreenLoader />;
  }

  if (requireSuperAdmin && !profile.is_super_admin) {
    return <Navigate to={dashboardPathForRole(profile.role)} replace />;
  }

  if (profile.is_super_admin) {
    return <>{children}</>;
  }

  if (role && profile.role !== role) {
    return <Navigate to={dashboardPathForRole(profile.role)} replace />;
  }

  return <>{children}</>;
}
