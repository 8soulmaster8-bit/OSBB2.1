/*
# OSBB Management System Schema

1. New Tables
- `residents` - Building residents with roles
  - id (uuid, primary key)
  - name (text, not null)
  - apartment (text, not null, unique)
  - phone (text)
  - role (text, default 'resident' - 'resident' or 'admin')
  - created_at (timestamp)
  
- `meters` - Utility meters for apartments
  - id (uuid, primary key)
  - resident_id (uuid, foreign key to residents)
  - type (text - 'water', 'electricity', 'gas')
  - current_reading (numeric)
  - reading_date (date)
  - created_at (timestamp)
  
- `receipts` - Payment receipts
  - id (uuid, primary key)
  - resident_id (uuid, foreign key to residents)
  - month (text - e.g., '2024-01')
  - amount (numeric)
  - status (text - 'paid' or 'unpaid')
  - created_at (timestamp)
  
- `requests` - Maintenance requests
  - id (uuid, primary key)
  - resident_id (uuid, foreign key to residents)
  - topic (text)
  - description (text)
  - status (text - 'new', 'in_progress', 'completed')
  - master (text - assigned worker)
  - created_at (timestamp)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated full access (demo app without auth).
*/

CREATE TABLE IF NOT EXISTS residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  apartment text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('water', 'electricity', 'gas')),
  current_reading numeric DEFAULT 0,
  reading_date date DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  topic text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
  master text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Residents policies
DROP POLICY IF EXISTS "anon_crud_residents" ON residents;
CREATE POLICY "anon_crud_residents" ON residents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_residents" ON residents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_residents" ON residents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_residents" ON residents FOR DELETE TO anon, authenticated USING (true);

-- Meters policies
DROP POLICY IF EXISTS "anon_crud_meters" ON meters;
CREATE POLICY "anon_crud_meters" ON meters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_meters" ON meters FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_meters" ON meters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_meters" ON meters FOR DELETE TO anon, authenticated USING (true);

-- Receipts policies
DROP POLICY IF EXISTS "anon_crud_receipts" ON receipts;
CREATE POLICY "anon_crud_receipts" ON receipts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_receipts" ON receipts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_receipts" ON receipts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_receipts" ON receipts FOR DELETE TO anon, authenticated USING (true);

-- Requests policies
DROP POLICY IF EXISTS "anon_crud_requests" ON requests;
CREATE POLICY "anon_crud_requests" ON requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_requests" ON requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_requests" ON requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_requests" ON requests FOR DELETE TO anon, authenticated USING (true);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meters_resident ON meters(resident_id);
CREATE INDEX IF NOT EXISTS idx_receipts_resident ON receipts(resident_id);
CREATE INDEX IF NOT EXISTS idx_requests_resident ON requests(resident_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
