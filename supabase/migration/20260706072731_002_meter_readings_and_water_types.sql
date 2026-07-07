/*
# Add meter readings history and hot/cold water support

1. Changes
- Update meters.type to include 'hot_water' and 'cold_water'
- Create meter_readings table for historical readings
- Each reading stores: meter_id, reading value, date, submitted_at

2. Security
- Enable RLS on meter_readings
- Allow anon + authenticated full access (demo app)
*/

-- Update type constraint to include hot/cold water
ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_type_check;
ALTER TABLE meters ADD CONSTRAINT meters_type_check 
  CHECK (type IN ('water', 'hot_water', 'cold_water', 'electricity', 'gas'));

-- Update existing 'water' meters to 'cold_water'
UPDATE meters SET type = 'cold_water' WHERE type = 'water';

-- Create meter readings history table
CREATE TABLE IF NOT EXISTS meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  reading numeric NOT NULL,
  reading_date date NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_meter_readings" ON meter_readings;
CREATE POLICY "anon_crud_meter_readings" ON meter_readings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_meter_readings" ON meter_readings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_meter_readings" ON meter_readings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_meter_readings" ON meter_readings FOR DELETE TO anon, authenticated USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(reading_date);
