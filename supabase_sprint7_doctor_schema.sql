-- Supabase Sprint 7 Schema: Closed Trades Ledger, Journal, and AI Reviews
-- This migration script creates tables to store closed paper trades for performance tracking.

CREATE TABLE IF NOT EXISTS paper_closed_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL DEFAULT 'mock-user-id',
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    entry_price DECIMAL(12, 2) NOT NULL,
    exit_price DECIMAL(12, 2) NOT NULL,
    profit_loss DECIMAL(12, 2) NOT NULL,
    profit_loss_percent DECIMAL(6, 2) NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signal_dna JSONB, -- Opportunity, Timing, Risk, Confidence, Market, Sector
    journal JSONB, -- before_entry and after_exit notes
    ai_review JSONB, -- rating_score, strengths, weaknesses, lessons
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for paper_closed_trades
ALTER TABLE paper_closed_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all on paper_closed_trades" ON paper_closed_trades FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on paper_closed_trades" ON paper_closed_trades FOR ALL USING (true);
