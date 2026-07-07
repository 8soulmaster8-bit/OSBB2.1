/*
# Wire up Supabase Auth to a `profiles` table, with automatic admin role

1. Changes
- Rename `residents` -> `profiles` and its columns to match the auth-driven
  schema: `full_name`, `apartment_number`, `square_meters` (phone, role,
  created_at unchanged). The unique constraint on the apartment number is
  dropped so multiple people (e.g. family members) can register against
  the same apartment.
- `profiles.id` now references `auth.users(id)` — every profile row IS an
  authenticated user (one-to-one), and `id` no longer auto-generates: it
  is always set to the new auth user's id.
- On sign up, the client passes ФИО / phone / apartment / area in
  `auth.users.raw_user_meta_data` (NOT the role — the role is never
  trusted from the client). A trigger (`handle_new_user`) reads that
  metadata and automatically inserts the matching `profiles` row right
  after the auth user is created.
- Role assignment (server-side only, inside the trigger):
    - The very first account ever created in the system -> 'admin'.
    - Any account whose email is 'admin@osbb.com'        -> 'admin'.
    - Everyone else                                       -> 'user' (default).
- `public.is_admin()` is a SECURITY DEFINER helper used inside RLS
  policies so a policy can check "is the current user an admin" without
  causing recursive RLS evaluation on the `profiles` table.

2. Security (RLS)
- Replace the previous anon/demo-mode policies (full open access) with
  policies scoped to `authenticated` users only:
  - Admin can read/write everything.
  - A regular user can read/write only rows that belong to them.
- Anonymous (logged-out) access is removed entirely; the app requires an
  authenticated Supabase session.
*/

-- ---------------------------------------------------------------------
-- 1. Rename residents -> profiles and align columns with the new schema
-- ---------------------------------------------------------------------

-- Existing demo rows (created before auth existed) have no matching
-- auth.users row, so they must be removed before we can add the FK.
DELETE FROM meter_readings WHERE meter_id IN (SELECT id FROM meters);
DELETE FROM receipts;
DELETE FROM requests;
DELETE FROM meters;
DELETE FROM residents;

ALTER TABLE residents RENAME TO profiles;
ALTER TABLE profiles RENAME COLUMN name TO full_name;
ALTER TABLE profiles RENAME COLUMN apartment TO apartment_number;
ALTER TABLE profiles RENAME COLUMN area TO square_meters;

-- Multiple residents may share one apartment number, so it's no longer unique.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS residents_apartment_key;

-- Role check constraint: 'resident' -> 'user'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS residents_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- profiles.id must equal the auth user's id, not a random uuid.
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 2. Auto-create the profile row when someone signs up
-- ---------------------------------------------------------------------

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

  -- Role is always decided here, server-side. The client never gets to
  -- pick its own role.
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

-- ---------------------------------------------------------------------
-- 3. Helper to check "is the current user an admin" without recursive RLS
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- 4. Replace demo (anon) policies with authenticated, role-aware policies
-- ---------------------------------------------------------------------

-- profiles ------------------------------------------------------------
DROP POLICY IF EXISTS "anon_crud_residents" ON profiles;
DROP POLICY IF EXISTS "anon_insert_residents" ON profiles;
DROP POLICY IF EXISTS "anon_update_residents" ON profiles;
DROP POLICY IF EXISTS "anon_delete_residents" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- No general INSERT policy: profile rows are only ever created by the
-- handle_new_user trigger (which runs as SECURITY DEFINER and bypasses RLS).

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- meters -----------------------------------------------------------------
DROP POLICY IF EXISTS "anon_crud_meters" ON meters;
DROP POLICY IF EXISTS "anon_insert_meters" ON meters;
DROP POLICY IF EXISTS "anon_update_meters" ON meters;
DROP POLICY IF EXISTS "anon_delete_meters" ON meters;

CREATE POLICY "meters_select" ON meters
  FOR SELECT TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "meters_insert" ON meters
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "meters_update" ON meters
  FOR UPDATE TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin())
  WITH CHECK (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "meters_delete_admin" ON meters
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- meter_readings -----------------------------------------------------------
DROP POLICY IF EXISTS "anon_crud_meter_readings" ON meter_readings;
DROP POLICY IF EXISTS "anon_insert_meter_readings" ON meter_readings;
DROP POLICY IF EXISTS "anon_update_meter_readings" ON meter_readings;
DROP POLICY IF EXISTS "anon_delete_meter_readings" ON meter_readings;

CREATE POLICY "meter_readings_select" ON meter_readings
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM meters m WHERE m.id = meter_readings.meter_id AND m.resident_id = auth.uid())
  );

CREATE POLICY "meter_readings_insert" ON meter_readings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM meters m WHERE m.id = meter_readings.meter_id AND m.resident_id = auth.uid())
  );

CREATE POLICY "meter_readings_delete_admin" ON meter_readings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- receipts -----------------------------------------------------------------
DROP POLICY IF EXISTS "anon_crud_receipts" ON receipts;
DROP POLICY IF EXISTS "anon_insert_receipts" ON receipts;
DROP POLICY IF EXISTS "anon_update_receipts" ON receipts;
DROP POLICY IF EXISTS "anon_delete_receipts" ON receipts;

CREATE POLICY "receipts_select" ON receipts
  FOR SELECT TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "receipts_insert_admin" ON receipts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "receipts_update" ON receipts
  FOR UPDATE TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin())
  WITH CHECK (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "receipts_delete" ON receipts
  FOR DELETE TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin());

-- requests (maintenance) -----------------------------------------------------
DROP POLICY IF EXISTS "anon_crud_requests" ON requests;
DROP POLICY IF EXISTS "anon_insert_requests" ON requests;
DROP POLICY IF EXISTS "anon_update_requests" ON requests;
DROP POLICY IF EXISTS "anon_delete_requests" ON requests;

CREATE POLICY "requests_select" ON requests
  FOR SELECT TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_insert" ON requests
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_update" ON requests
  FOR UPDATE TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin())
  WITH CHECK (resident_id = auth.uid() OR public.is_admin());

CREATE POLICY "requests_delete" ON requests
  FOR DELETE TO authenticated
  USING (resident_id = auth.uid() OR public.is_admin());
