-- Supabase Sprint 6.1 Schema: Security Foundation (RBAC & RLS)
-- This migration script establishes user sessions, audit logs, alters profiles defaults, and enforces RLS policies.

-- 1. Alter Profiles Role defaults and update values
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'FREE_USER';
UPDATE public.profiles SET role = 'FREE_USER' WHERE role = 'user' OR role IS NULL;
UPDATE public.profiles SET role = 'ADMIN' WHERE role = 'admin';

-- 2. Create User Sessions Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on User Sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100), -- Can be UUID string or mock-user-id string
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert audit logs
CREATE POLICY "Allow anyone to insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Only Admins/Super Admins can read audit logs
CREATE POLICY "Restrict select to admins" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- 4. Secure Paper Portfolios table
ALTER TABLE public.paper_portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all on paper_portfolios" ON public.paper_portfolios;
DROP POLICY IF EXISTS "Enable write access for all on paper_portfolios" ON public.paper_portfolios;

CREATE POLICY "Users can manage own portfolios" ON public.paper_portfolios
    FOR ALL USING (auth.uid()::text = user_id OR user_id = 'mock-user-id');

-- 5. Secure Paper Positions table
ALTER TABLE public.paper_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all on paper_positions" ON public.paper_positions;
DROP POLICY IF EXISTS "Enable write access for all on paper_positions" ON public.paper_positions;

CREATE POLICY "Users can manage own positions" ON public.paper_positions
    FOR ALL USING (auth.uid()::text = user_id OR user_id = 'mock-user-id');

-- 6. Secure Paper Orders table
ALTER TABLE public.paper_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all on paper_orders" ON public.paper_orders;
DROP POLICY IF EXISTS "Enable write access for all on paper_orders" ON public.paper_orders;

CREATE POLICY "Users can manage own orders" ON public.paper_orders
    FOR ALL USING (auth.uid()::text = user_id OR user_id = 'mock-user-id');

-- 7. Secure Paper Closed Trades table
ALTER TABLE public.paper_closed_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all on paper_closed_trades" ON public.paper_closed_trades;
DROP POLICY IF EXISTS "Enable write access for all on paper_closed_trades" ON public.paper_closed_trades;

CREATE POLICY "Users can manage own closed trades" ON public.paper_closed_trades
    FOR ALL USING (auth.uid()::text = user_id OR user_id = 'mock-user-id');
