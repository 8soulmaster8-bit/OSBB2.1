import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SubscriptionGuardProps {
  children: ReactNode;
}

// Check if tenant has active subscription (or is in trial)
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  // For now, just pass through - subscription check should be done server-side
  // and enforced via RLS policies
  return <>{children}</>;
}
