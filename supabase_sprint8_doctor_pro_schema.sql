-- Supabase Sprint 8 Schema: Portfolio Doctor Pro Additions
-- This migration script adds support for sector_score, recommendation status, and portfolio_alerts.

-- 1. Alter portfolio_snapshots to add sector_score if it doesn't exist
ALTER TABLE portfolio_snapshots 
  ADD COLUMN IF NOT EXISTS sector_score NUMERIC;

-- 2. Alter portfolio_recommendations to add status if it doesn't exist
ALTER TABLE portfolio_recommendations 
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 3. Create portfolio_alerts table
CREATE TABLE IF NOT EXISTS portfolio_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for portfolio_alerts
ALTER TABLE portfolio_alerts ENABLE ROW LEVEL SECURITY;

-- Remove policies if they exist first, to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can insert own alerts" ON portfolio_alerts;
DROP POLICY IF EXISTS "Users can read own alerts" ON portfolio_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON portfolio_alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON portfolio_alerts;

CREATE POLICY "Users can insert own alerts" ON portfolio_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own alerts" ON portfolio_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON portfolio_alerts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON portfolio_alerts
  FOR DELETE USING (auth.uid() = user_id);
