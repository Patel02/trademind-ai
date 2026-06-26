-- Supabase Migration: Portfolio Doctor Enterprise (Sprint 9)
-- This migration creates the tables for the advanced analytical modules, AI Memory, and Enterprise telemetry.

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

-- 2. portfolio_sector_analysis
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

-- 3. portfolio_risk_analysis
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

-- 4. portfolio_health_history
CREATE TABLE IF NOT EXISTS portfolio_health_history (
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

-- 5. portfolio_ai_recommendations
CREATE TABLE IF NOT EXISTS portfolio_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'implemented', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. portfolio_simulations
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

-- 7. portfolio_user_memory
CREATE TABLE IF NOT EXISTS portfolio_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  trading_style VARCHAR(100) NOT NULL DEFAULT 'Balanced',
  preferred_sectors JSONB DEFAULT '[]'::jsonb,
  avg_holding_period VARCHAR(100) NOT NULL DEFAULT 'Medium Term',
  risk_appetite VARCHAR(50) NOT NULL DEFAULT 'Medium',
  best_performing_setup TEXT DEFAULT '',
  most_common_mistakes JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. portfolio_doctor_monitoring
CREATE TABLE IF NOT EXISTS portfolio_doctor_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  db_query_time_ms INTEGER NOT NULL,
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  api_errors TEXT,
  calc_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configure Indexes for query speed optimization
CREATE INDEX IF NOT EXISTS idx_port_snaps_user ON portfolio_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_port_sectors_snap ON portfolio_sector_analysis(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_port_risk_snap ON portfolio_risk_analysis(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_port_history_user ON portfolio_health_history(user_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_port_recs_user ON portfolio_ai_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_port_sims_user ON portfolio_simulations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_port_monitoring_user ON portfolio_doctor_monitoring(user_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sector_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_risk_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_doctor_monitoring ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS snap_select_policy ON portfolio_snapshots;
DROP POLICY IF EXISTS snap_insert_policy ON portfolio_snapshots;
DROP POLICY IF EXISTS sector_select_policy ON portfolio_sector_analysis;
DROP POLICY IF EXISTS sector_insert_policy ON portfolio_sector_analysis;
DROP POLICY IF EXISTS risk_select_policy ON portfolio_risk_analysis;
DROP POLICY IF EXISTS risk_insert_policy ON portfolio_risk_analysis;
DROP POLICY IF EXISTS history_select_policy ON portfolio_health_history;
DROP POLICY IF EXISTS history_insert_policy ON portfolio_health_history;
DROP POLICY IF EXISTS recs_select_policy ON portfolio_ai_recommendations;
DROP POLICY IF EXISTS recs_insert_policy ON portfolio_ai_recommendations;
DROP POLICY IF EXISTS recs_update_policy ON portfolio_ai_recommendations;
DROP POLICY IF EXISTS sims_select_policy ON portfolio_simulations;
DROP POLICY IF EXISTS sims_insert_policy ON portfolio_simulations;
DROP POLICY IF EXISTS memory_select_policy ON portfolio_user_memory;
DROP POLICY IF EXISTS memory_upsert_policy ON portfolio_user_memory;
DROP POLICY IF EXISTS monitor_select_policy ON portfolio_doctor_monitoring;
DROP POLICY IF EXISTS monitor_insert_policy ON portfolio_doctor_monitoring;

-- Setup RLS Policies (Isolate user data by auth.uid())
CREATE POLICY snap_select_policy ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY snap_insert_policy ON portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY sector_select_policy ON portfolio_sector_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sector_insert_policy ON portfolio_sector_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY risk_select_policy ON portfolio_risk_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY risk_insert_policy ON portfolio_risk_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY history_select_policy ON portfolio_health_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY history_insert_policy ON portfolio_health_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY recs_select_policy ON portfolio_ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recs_insert_policy ON portfolio_ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recs_update_policy ON portfolio_ai_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY sims_select_policy ON portfolio_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sims_insert_policy ON portfolio_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY memory_select_policy ON portfolio_user_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY memory_upsert_policy ON portfolio_user_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY monitor_select_policy ON portfolio_doctor_monitoring FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY monitor_insert_policy ON portfolio_doctor_monitoring FOR INSERT WITH CHECK (auth.uid() = user_id);
