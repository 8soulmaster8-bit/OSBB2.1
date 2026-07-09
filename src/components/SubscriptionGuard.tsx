import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useTenant } from '../context/TenantContext';
import { BlockedPage } from '../pages/BlockedPage';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isActive, isLoading, isSuperAdmin, tenant } = useTenant();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Проверка подписки...</p>
        </div>
      </div>
    );
  }

  // Super admin bypasses all subscription checks
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Allow access to blocked page itself
  if (location.pathname === '/blocked') {
    return <>{children}</>;
  }

  // No tenant assigned - redirect to error
  if (!tenant) {
    return <Navigate to="/login" replace />;
  }

  // Check subscription status
  if (!isActive) {
    // Show appropriate blocked page based on tenant status
    return <BlockedPage reason={tenant.status} />;
  }

  // Subscription is active, allow access
  return <>{children}</>;
}
