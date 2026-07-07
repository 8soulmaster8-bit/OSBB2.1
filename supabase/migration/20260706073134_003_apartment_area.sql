/*
# Add apartment area for billing calculations

1. Changes
- Add area column to residents table (apartment area in sq.meters)
- Used for calculating monthly bills based on tariff per sq.meter

2. Security
- No changes needed, column inherits table RLS
*/

ALTER TABLE residents ADD COLUMN IF NOT EXISTS area numeric DEFAULT 50;

-- Set sample areas
UPDATE residents SET area = 
  CASE apartment
    WHEN '12' THEN 65
    WHEN '23' THEN 78
    WHEN '34' THEN 92
    WHEN '45' THEN 58
    WHEN '56' THEN 72
    ELSE 50
  END
WHERE apartment IN ('12', '23', '34', '45', '56');
