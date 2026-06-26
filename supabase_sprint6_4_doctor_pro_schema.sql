-- Supabase Migration: Portfolio Doctor Pro (Sprint 6.4)
-- This migration script creates the database schemas, indexes, and RLS policies for the Portfolio Doctor Pro.

-- 1. portfolio_snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  health_score NUMERIC(5,2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  risk_score NUMERIC(5,2) NOT NULL,
  diversification_score NUMERIC(5,2) NOT NULL,
  sector_score NUMERIC(5,2) NOT NULL DEFAULT 85.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. portfolio_health_scores
CREATE TABLE IF NOT EXISTS portfolio_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  health_score NUMERIC(5,2) NOT NULL,
  stability_score NUMERIC(5,2) NOT NULL,
  growth_potential_score NUMERIC(5,2) NOT NULL,
  risk_score NUMERIC(5,2) NOT NULL,
  grade VARCHAR(5) NOT NULL, -- 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. portfolio_sector_analysis
CREATE TABLE IF NOT EXISTS portfolio_sector_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_id UUID REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
  sector VARCHAR(100) NOT NULL,
  allocation_pct NUMERIC(5,2) NOT NULL,
  state VARCHAR(50) NOT NULL, -- 'Overweight' | 'Healthy' | 'Underweight'
  risk_level VARCHAR(50) NOT NULL, -- 'Low' | 'Medium' | 'High'
  ai_rating NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. portfolio_risk_analysis
CREATE TABLE IF NOT EXISTS portfolio_risk_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_id UUID REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
  concentration_risk_pct NUMERIC(5,2) NOT NULL,
  top_holding_symbol VARCHAR(20) NOT NULL,
  volatility_drag NUMERIC(5,2) NOT NULL,
  risk_index VARCHAR(20) NOT NULL, -- 'Low' | 'Medium' | 'High'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. portfolio_recommendations
CREATE TABLE IF NOT EXISTS portfolio_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'implemented', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. portfolio_alerts
CREATE TABLE IF NOT EXISTS portfolio_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. portfolio_simulations
CREATE TABLE IF NOT EXISTS portfolio_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL,
  initial_health NUMERIC(5,2) NOT NULL,
  predicted_health NUMERIC(5,2) NOT NULL,
  initial_cash_pct NUMERIC(5,2) NOT NULL,
  predicted_cash_pct NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configure Indexes for speed & performance optimization
CREATE INDEX IF NOT EXISTS idx_port_snaps_user ON portfolio_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_port_sectors_snap ON portfolio_sector_analysis(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_port_risk_snap ON portfolio_risk_analysis(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_port_scores_user ON portfolio_health_scores(user_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_port_recs_user ON portfolio_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_port_alerts_user ON portfolio_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_port_sims_user ON portfolio_simulations(user_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sector_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_risk_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_simulations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS snap_select_policy ON portfolio_snapshots;
DROP POLICY IF EXISTS snap_insert_policy ON portfolio_snapshots;
DROP POLICY IF EXISTS scores_select_policy ON portfolio_health_scores;
DROP POLICY IF EXISTS scores_insert_policy ON portfolio_health_scores;
DROP POLICY IF EXISTS sector_select_policy ON portfolio_sector_analysis;
DROP POLICY IF EXISTS sector_insert_policy ON portfolio_sector_analysis;
DROP POLICY IF EXISTS risk_select_policy ON portfolio_risk_analysis;
DROP POLICY IF EXISTS risk_insert_policy ON portfolio_risk_analysis;
DROP POLICY IF EXISTS recs_select_policy ON portfolio_recommendations;
DROP POLICY IF EXISTS recs_insert_policy ON portfolio_recommendations;
DROP POLICY IF EXISTS recs_update_policy ON portfolio_recommendations;
DROP POLICY IF EXISTS alerts_select_policy ON portfolio_alerts;
DROP POLICY IF EXISTS alerts_insert_policy ON portfolio_alerts;
DROP POLICY IF EXISTS alerts_update_policy ON portfolio_alerts;
DROP POLICY IF EXISTS sims_select_policy ON portfolio_simulations;
DROP POLICY IF EXISTS sims_insert_policy ON portfolio_simulations;

-- Setup RLS Policies (Isolate user data by auth.uid())
CREATE POLICY snap_select_policy ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY snap_insert_policy ON portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY scores_select_policy ON portfolio_health_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY scores_insert_policy ON portfolio_health_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY sector_select_policy ON portfolio_sector_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sector_insert_policy ON portfolio_sector_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY risk_select_policy ON portfolio_risk_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY risk_insert_policy ON portfolio_risk_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY recs_select_policy ON portfolio_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recs_insert_policy ON portfolio_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recs_update_policy ON portfolio_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY alerts_select_policy ON portfolio_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY alerts_insert_policy ON portfolio_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY alerts_update_policy ON portfolio_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY sims_select_policy ON portfolio_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sims_insert_policy ON portfolio_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
