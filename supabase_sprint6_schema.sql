-- Supabase Sprint 6 Schema: Paper Trading Pro
-- This migration script creates tables to manage virtual portfolios, positions tracking, and simulated order logs.

-- 1. Setup Table: paper_portfolios
CREATE TABLE IF NOT EXISTS paper_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL DEFAULT 'mock-user-id' UNIQUE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 1000000.00 CHECK (balance >= 0),
    start_balance DECIMAL(12, 2) NOT NULL DEFAULT 1000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for paper_portfolios
ALTER TABLE paper_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all on paper_portfolios" ON paper_portfolios FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on paper_portfolios" ON paper_portfolios FOR ALL USING (true);

-- 2. Setup Table: paper_positions
CREATE TABLE IF NOT EXISTS paper_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL DEFAULT 'mock-user-id',
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    avg_entry_price DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, symbol)
);

-- Enable RLS for paper_positions
ALTER TABLE paper_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all on paper_positions" ON paper_positions FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on paper_positions" ON paper_positions FOR ALL USING (true);

-- 3. Setup Table: paper_orders
CREATE TABLE IF NOT EXISTS paper_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL DEFAULT 'mock-user-id',
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity INT NOT NULL CHECK (quantity > 0),
    execution_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Executed' CHECK (status IN ('Executed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for paper_orders
ALTER TABLE paper_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all on paper_orders" ON paper_orders FOR SELECT USING (true);
CREATE POLICY "Enable write access for all on paper_orders" ON paper_orders FOR ALL USING (true);

-- Seed initial portfolio balance
INSERT INTO paper_portfolios (user_id, balance, start_balance)
VALUES ('mock-user-id', 1000000.00, 1000000.00)
ON CONFLICT (user_id) DO NOTHING;
