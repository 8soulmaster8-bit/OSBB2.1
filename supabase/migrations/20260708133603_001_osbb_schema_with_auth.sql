/*
# OSBB Management System Schema with Auth

Creates all tables for the building management system with proper
Row Level Security for authenticated users.
*/

-- ---------------------------------------------------------------------
-- 1. Profiles table (linked to auth.users)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  apartment_number text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  square_meters numeric DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_account boolean;
  assigned_role text;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_account;

  IF is_first_account OR NEW.email = 'admin@osbb.com' THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, full_name, apartment_number, phone, role, square_meters)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'apartment_number', ''),
    NEW.raw_user_meta_data->>'phone',
    assigned_role,
    COALESCE((NEW.raw_user_meta_data->>'square_meters')::numeric, 50)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles RLS policies
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Meters table
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('water', 'hot_water', 'cold_water', 'electricity', 'gas')),
  current_reading numeric DEFAULT 0,
  reading_date date DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_meters_user_id ON meters(user_id);

-- Meters RLS policies
CREATE POLICY "meters_select_own_or_admin" ON meters
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "meters_insert_own_or_admin" ON meters
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "meters_update_own_or_admin" ON meters
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "meters_delete_admin_only" ON meters
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Meter readings history
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  reading numeric NOT NULL,
  reading_date date NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_meter_readings_meter ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(reading_date);

-- Meter readings RLS policies
CREATE POLICY "meter_readings_select_own_or_admin" ON meter_readings
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM meters m WHERE m.id = meter_readings.meter_id AND m.user_id = auth.uid())
  );

CREATE POLICY "meter_readings_insert_own_or_admin" ON meter_readings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM meters m WHERE m.id = meter_readings.meter_id AND m.user_id = auth.uid())
  );

CREATE POLICY "meter_readings_delete_admin_only" ON meter_readings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Bills (receipts)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);

-- Bills RLS policies
CREATE POLICY "bills_select_own_or_admin" ON bills
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "bills_insert_admin_only" ON bills
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "bills_update_own_or_admin" ON bills
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "bills_delete_own_or_admin" ON bills
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Maintenance requests
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
  master text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- Requests RLS policies
CREATE POLICY "requests_select_own_or_admin" ON requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_insert_own_or_admin" ON requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_update_own_or_admin" ON requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_delete_own_or_admin" ON requests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());