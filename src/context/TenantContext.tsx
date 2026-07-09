import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Tenant, Subscription } from '../types/database';

interface TenantContextValue {
  tenantId: string | null;
  tenant: Tenant | null;
  subscription: Subscription | null;
  isActive: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      setTenant(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    loadTenantData();
  }, [user, profile]);

  async function loadTenantData() {
    if (!profile) return;

    setIsLoading(true);

    try {
      // Super admin has no tenant restrictions
      if (profile.is_super_admin) {
        setTenant(null);
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      if (!profile.tenant_id) {
        setTenant(null);
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      // Load tenant data
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .maybeSingle();

      setTenant(tenantData);

      // Load subscription data
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      setSubscription(subData);
    } catch (error) {
      console.error('Error loading tenant data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshTenant() {
    await loadTenantData();
  }

  // Check if tenant subscription is active
  const isActive = tenant?.status === 'active' || tenant?.status === 'trial';
  const isSuperAdmin = profile?.is_super_admin ?? false;

  return (
    <TenantContext.Provider
      value={{
        tenantId: tenant?.id ?? null,
        tenant,
        subscription,
        isActive,
        isLoading,
        isSuperAdmin,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
