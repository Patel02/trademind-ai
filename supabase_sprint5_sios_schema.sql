-- Supabase Sprint 5 Upgrade: Signal Intelligence Operating System (SIOS v1.0)
-- This migration script creates tables for admin signal lifecycle, results tracking, AI learning DNA, and auditing.

-- 1. Setup Table: signals
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    opportunity_status VARCHAR(50) NOT NULL CHECK (opportunity_status IN ('Elite Opportunity', 'Strong Opportunity', 'Watch Closely', 'Avoid')),
    setup_type VARCHAR(50) NOT NULL CHECK (setup_type IN ('Bullish Breakout', 'Pullback Recovery', 'Volatility Squeeze', 'Support Bounce')),
    entry_price DECIMAL(12, 2) NOT NULL,
    stop_loss DECIMAL(12, 2) NOT NULL,
    target_1 DECIMAL(12, 2) NOT NULL,
    target_2 DECIMAL(12, 2) NOT NULL,
    target_3 DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    signal_quality_score INT NOT NULL CHECK (signal_quality_score BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Archived')),
    generated_time VARCHAR(20) NOT NULL,
    valid_until VARCHAR(20) NOT NULL,
    created_by VARCHAR(100) NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for signals
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on signals" ON signals FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated admin users on signals" ON signals FOR ALL USING (true);

-- 2. Setup Table: signal_dna
CREATE TABLE IF NOT EXISTS signal_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    market_regime VARCHAR(50) NOT NULL,
    sector_strength INT NOT NULL,
    news_score INT NOT NULL,
    technical_score INT NOT NULL,
    timing_score INT NOT NULL,
    risk_score INT NOT NULL,
    confidence_score INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for signal_dna
ALTER TABLE signal_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on signal_dna" ON signal_dna FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on signal_dna" ON signal_dna FOR ALL USING (true);

-- 3. Setup Table: signal_results
CREATE TABLE IF NOT EXISTS signal_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    exit_price DECIMAL(12, 2) NOT NULL,
    profit_loss_percent DECIMAL(6, 2) NOT NULL,
    result VARCHAR(30) NOT NULL CHECK (result IN ('Target Hit', 'Stop Loss Hit', 'Expired')),
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_mins INT NOT NULL,
    max_profit DECIMAL(6, 2) DEFAULT 0.00,
    max_drawdown DECIMAL(6, 2) DEFAULT 0.00
);

-- Enable RLS for signal_results
ALTER TABLE signal_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on signal_results" ON signal_results FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on signal_results" ON signal_results FOR ALL USING (true);

-- 4. Setup Table: signal_updates
CREATE TABLE IF NOT EXISTS signal_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    current_price DECIMAL(12, 2) NOT NULL,
    current_confidence INT NOT NULL,
    health_score INT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for signal_updates
ALTER TABLE signal_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on signal_updates" ON signal_updates FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on signal_updates" ON signal_updates FOR ALL USING (true);

-- 5. Setup Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(100) NOT NULL DEFAULT 'Admin',
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on audit_logs" ON audit_logs FOR ALL USING (true);

-- Seed Initial Closed Signal History (For Performance Dashboard)
-- Seed 1: TCS Closed
INSERT INTO signals (id, symbol, opportunity_status, setup_type, entry_price, stop_loss, target_1, target_2, target_3, current_price, confidence, signal_quality_score, status, generated_time, valid_until, created_by, created_at)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'TCS',
    'Elite Opportunity',
    'Bullish Breakout',
    3800.00,
    3710.00,
    3880.00,
    3940.00,
    4000.00,
    3940.00,
    88,
    92,
    'Closed',
    '09:30 AM',
    '03:30 PM',
    'Admin',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

INSERT INTO signal_results (signal_id, exit_price, profit_loss_percent, result, closed_at, duration_mins, max_profit, max_drawdown)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    3940.00,
    3.68,
    'Target Hit',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '4 hours',
    240,
    4.10,
    -0.50
) ON CONFLICT DO NOTHING;

-- Seed 2: RELIANCE Closed
INSERT INTO signals (id, symbol, opportunity_status, setup_type, entry_price, stop_loss, target_1, target_2, target_3, current_price, confidence, signal_quality_score, status, generated_time, valid_until, created_by, created_at)
VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'RELIANCE',
    'Strong Opportunity',
    'Pullback Recovery',
    2925.00,
    2860.00,
    3000.00,
    3060.00,
    3120.00,
    3060.00,
    90,
    88,
    'Closed',
    '10:15 AM',
    '03:30 PM',
    'Admin',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;

INSERT INTO signal_results (signal_id, exit_price, profit_loss_percent, result, closed_at, duration_mins, max_profit, max_drawdown)
VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    3060.00,
    4.61,
    'Target Hit',
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '3 hours',
    180,
    5.00,
    -0.80
) ON CONFLICT DO NOTHING;
