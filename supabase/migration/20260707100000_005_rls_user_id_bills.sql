/*
# Row Level Security: auto-filter bills / meters / requests by user_id

This migration is purely about data isolation. It does not change what the
app can do — it changes what the database will *allow*, no matter what the
client asks for.

1. Renames (to match app terminology 1:1)
- `receipts` -> `bills` (квитанции)
- `resident_id` -> `user_id` on `meters`, `bills`, `requests`
  (this column always equals the owning `auth.users.id` / `profiles.id`)

2. Row Level Security (the actual access control)
- RLS is already enabled on every table (`ENABLE ROW LEVEL SECURITY`,
  done in migration 001). What matters is the POLICY attached to each
  table, because Postgres evaluates it on every single query — SELECT,
  INSERT, UPDATE, DELETE — automatically, on the database side. The
  frontend does NOT add `.eq('user_id', ...)` anywhere; it can't opt out
  of this even if it tried.
- For `meters`, `bills`, `requests` the rule is the same everywhere:
    USING / WITH CHECK (user_id = auth.uid() OR public.is_admin())
  -> a regular user (`profiles.role = 'user'`) only ever sees/changes
     rows where `user_id` matches their own `auth.uid()`.
  -> an admin (`profiles.role = 'admin'`, checked via the SECURITY
     DEFINER helper `public.is_admin()`) sees/changes every row, for
     every apartment.
- `meter_readings` has no `user_id` column of its own (it belongs to a
  meter), so it is scoped through the parent meter's `user_id` instead.
*/

-- ---------------------------------------------------------------------
-- 1. Renames
-- ---------------------------------------------------------------------

ALTER TABLE receipts RENAME TO bills;

ALTER TABLE meters RENAME COLUMN resident_id TO user_id;
ALTER TABLE bills RENAME COLUMN resident_id TO user_id;
ALTER TABLE requests RENAME COLUMN resident_id TO user_id;

ALTER INDEX IF EXISTS idx_meters_resident RENAME TO idx_meters_user_id;
ALTER INDEX IF EXISTS idx_receipts_resident RENAME TO idx_bills_user_id;
ALTER INDEX IF EXISTS idx_requests_resident RENAME TO idx_requests_user_id;

-- ---------------------------------------------------------------------
-- 2. Re-create RLS policies against the renamed table/column
-- ---------------------------------------------------------------------

-- meters -------------------------------------------------------------------
DROP POLICY IF EXISTS "meters_select" ON meters;
DROP POLICY IF EXISTS "meters_insert" ON meters;
DROP POLICY IF EXISTS "meters_update" ON meters;
DROP POLICY IF EXISTS "meters_delete_admin" ON meters;

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

-- meter_readings (scoped through the parent meter's user_id) ---------------
DROP POLICY IF EXISTS "meter_readings_select" ON meter_readings;
DROP POLICY IF EXISTS "meter_readings_insert" ON meter_readings;
DROP POLICY IF EXISTS "meter_readings_delete_admin" ON meter_readings;

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

-- bills (formerly receipts) -------------------------------------------------
DROP POLICY IF EXISTS "receipts_select" ON bills;
DROP POLICY IF EXISTS "receipts_insert_admin" ON bills;
DROP POLICY IF EXISTS "receipts_update" ON bills;
DROP POLICY IF EXISTS "receipts_delete" ON bills;

CREATE POLICY "bills_select_own_or_admin" ON bills
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Only the admin (Голова ОСББ) issues bills.
CREATE POLICY "bills_insert_admin_only" ON bills
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- A resident may mark their own bill as paid; admin can update any bill.
CREATE POLICY "bills_update_own_or_admin" ON bills
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "bills_delete_own_or_admin" ON bills
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- requests (maintenance) -----------------------------------------------------
DROP POLICY IF EXISTS "requests_select" ON requests;
DROP POLICY IF EXISTS "requests_insert" ON requests;
DROP POLICY IF EXISTS "requests_update" ON requests;
DROP POLICY IF EXISTS "requests_delete" ON requests;

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
