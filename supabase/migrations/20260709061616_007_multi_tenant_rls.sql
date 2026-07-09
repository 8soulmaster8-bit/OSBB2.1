/*
# Multi-Tenant RLS Policies and Helper Functions

This migration adds:
1. Helper functions for tenant isolation
2. RLS policies for tenants, subscriptions, payments
3. Updates existing RLS policies to support multi-tenancy

Security Model:
- Super admin (platform owner): access ALL data across all tenants
- Tenant admin: access data within their tenant only
- Regular user: access their own data within their tenant
- Blocked tenant: access denied (handled in frontend middleware)
*/

-- ═══════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS FOR RLS
-- ═══════════════════════════════════════════════════════════════════

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Check if current user is super admin (platform owner)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Check if current user is tenant admin (ОСББ admin)
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND tenant_id IS NOT NULL
  );
$$;

-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES FOR TENANTS
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "tenants_select" ON tenants;
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenants_insert" ON tenants;
CREATE POLICY "tenants_insert" ON tenants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "tenants_update" ON tenants;
CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "tenants_delete" ON tenants;
CREATE POLICY "tenants_delete" ON tenants
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES FOR SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
CREATE POLICY "subscriptions_insert" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_update" ON subscriptions
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;
CREATE POLICY "subscriptions_delete" ON subscriptions
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES FOR PAYMENTS
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE RLS POLICIES FOR PROFILES (Multi-tenant aware)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin() 
    OR tenant_id = public.get_current_tenant_id()
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR id = auth.uid()
    OR (public.is_tenant_admin() AND tenant_id = public.get_current_tenant_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR id = auth.uid()
    OR (public.is_tenant_admin() AND tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE RLS POLICIES FOR METERS (Multi-tenant aware)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "meters_select_own_or_admin" ON meters;
DROP POLICY IF EXISTS "meters_select_tenant" ON meters;
CREATE POLICY "meters_select_tenant" ON meters
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "meters_insert_own_or_admin" ON meters;
DROP POLICY IF EXISTS "meters_insert_tenant" ON meters;
CREATE POLICY "meters_insert_tenant" ON meters
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "meters_update_own_or_admin" ON meters;
DROP POLICY IF EXISTS "meters_update_tenant" ON meters;
CREATE POLICY "meters_update_tenant" ON meters
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "meters_delete_admin_only" ON meters;
DROP POLICY IF EXISTS "meters_delete_tenant" ON meters;
CREATE POLICY "meters_delete_tenant" ON meters
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin())
  );

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE RLS POLICIES FOR BILLS (Multi-tenant aware)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "bills_select_own_or_admin" ON bills;
DROP POLICY IF EXISTS "bills_select_tenant" ON bills;
CREATE POLICY "bills_select_tenant" ON bills
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "bills_insert_admin_only" ON bills;
DROP POLICY IF EXISTS "bills_insert_tenant" ON bills;
CREATE POLICY "bills_insert_tenant" ON bills
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin())
  );

DROP POLICY IF EXISTS "bills_update_own_or_admin" ON bills;
DROP POLICY IF EXISTS "bills_update_tenant" ON bills;
CREATE POLICY "bills_update_tenant" ON bills
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "bills_delete_own_or_admin" ON bills;
DROP POLICY IF EXISTS "bills_delete_tenant" ON bills;
CREATE POLICY "bills_delete_tenant" ON bills
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin())
  );

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE RLS POLICIES FOR REQUESTS (Multi-tenant aware)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "requests_select_own_or_admin" ON requests;
DROP POLICY IF EXISTS "requests_select_tenant" ON requests;
CREATE POLICY "requests_select_tenant" ON requests
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "requests_insert_own_or_admin" ON requests;
DROP POLICY IF EXISTS "requests_insert_tenant" ON requests;
CREATE POLICY "requests_insert_tenant" ON requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "requests_update_own_or_admin" ON requests;
DROP POLICY IF EXISTS "requests_update_tenant" ON requests;
CREATE POLICY "requests_update_tenant" ON requests
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "requests_delete_own_or_admin" ON requests;
DROP POLICY IF EXISTS "requests_delete_tenant" ON requests;
CREATE POLICY "requests_delete_tenant" ON requests
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND (user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE RLS POLICIES FOR METER_READINGS (Multi-tenant aware)
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "meter_readings_select_own_or_admin" ON meter_readings;
DROP POLICY IF EXISTS "meter_readings_select_tenant" ON meter_readings;
CREATE POLICY "meter_readings_select_tenant" ON meter_readings
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM meters m 
      WHERE m.id = meter_readings.meter_id 
      AND m.tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "meter_readings_insert_own_or_admin" ON meter_readings;
DROP POLICY IF EXISTS "meter_readings_insert_tenant" ON meter_readings;
CREATE POLICY "meter_readings_insert_tenant" ON meter_readings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM meters m 
      WHERE m.id = meter_readings.meter_id 
      AND m.tenant_id = public.get_current_tenant_id()
      AND (m.user_id = auth.uid() OR public.is_tenant_admin())
    )
  );

DROP POLICY IF EXISTS "meter_readings_delete_admin_only" ON meter_readings;
DROP POLICY IF EXISTS "meter_readings_delete_tenant" ON meter_readings;
CREATE POLICY "meter_readings_delete_tenant" ON meter_readings
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM meters m 
      WHERE m.id = meter_readings.meter_id 
      AND m.tenant_id = public.get_current_tenant_id()
      AND public.is_tenant_admin()
    )
  );