-- Migration: Location Flow tables and Row Level Security
-- Date: 2025-02-28

-- 1. Table: service_pincodes
CREATE TABLE IF NOT EXISTS service_pincodes (
  pincode VARCHAR(10) PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE service_pincodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to service pincodes"
  ON service_pincodes FOR SELECT
  USING (true);

-- Seed initial serviceable pincodes (e.g. Gurugram, Delhi NCR)
INSERT INTO service_pincodes (pincode, city, active)
VALUES
  ('122001', 'Gurugram', true),
  ('122002', 'Gurugram', true),
  ('122003', 'Gurugram', true),
  ('122018', 'Gurugram', true),
  ('122505', 'Gurugram', true),
  ('110001', 'Delhi', true),
  ('110020', 'Delhi', true)
ON CONFLICT (pincode) DO NOTHING;

-- 2. Table: user_addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Home' NOT NULL, -- 'Home', 'Work', 'Other'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  formatted_address TEXT NOT NULL,
  apartment_name TEXT,
  flat_no TEXT,
  landmark TEXT,
  pincode VARCHAR(10),
  city VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses"
  ON user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Table: notify_requests
CREATE TABLE IF NOT EXISTS notify_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pincode VARCHAR(10) NOT NULL,
  email_or_phone VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE notify_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role or anon insert for notify_requests"
  ON notify_requests FOR INSERT
  WITH CHECK (true);
