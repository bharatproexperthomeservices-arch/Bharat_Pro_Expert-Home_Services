-- SQL Migration: Add GPS Location Fields and RLS Policies to Supabase PostgreSQL bookings table

ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS house_number TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'GPS',
  ADD COLUMN IF NOT EXISTS address_confirmed BOOLEAN DEFAULT TRUE;

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 1. Customers can view their own bookings
DROP POLICY IF EXISTS "Customers can view their own bookings" ON bookings;
CREATE POLICY "Customers can view their own bookings" ON bookings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      customer_id = auth.uid()::text OR
      (address->>'phone') IS NOT NULL
    )
  );

-- 2. Customers can insert new bookings
DROP POLICY IF EXISTS "Customers can insert bookings" ON bookings;
CREATE POLICY "Customers can insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (TRUE);

-- 3. Admins have full access to all bookings
DROP POLICY IF EXISTS "Super admins have full access" ON bookings;
CREATE POLICY "Super admins have full access" ON bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()::text AND admin_users.is_active = TRUE
    ) OR auth.jwt()->>'role' = 'service_role'
  );

-- 4. Assigned Partners can view their assigned job location details
DROP POLICY IF EXISTS "Partners can view assigned job locations" ON bookings;
CREATE POLICY "Partners can view assigned job locations" ON bookings
  FOR SELECT
  USING (
    partner_id IS NOT NULL AND partner_id = auth.uid()::text
  );
