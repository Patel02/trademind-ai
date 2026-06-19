-- TradeMind AI - Supabase Database Schema Migration (Sprint 4)
-- This script creates the News Intelligence, Sector Strength, and AI Activity Feed tables.
-- Execute this in your Supabase SQL Editor.

-- 1. Create News Table
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  category text check (category in ('Market', 'Company', 'Economy', 'Global', 'Sector', 'Earnings')),
  summary text,
  sentiment_score integer check (sentiment_score >= 0 and sentiment_score <= 100),
  impact_score integer check (impact_score >= 0 and impact_score <= 100),
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Create News Stock Mapping Table
create table if not exists public.news_stock_mapping (
  id uuid primary key default gen_random_uuid(),
  news_id uuid references public.news(id) on delete cascade not null,
  symbol text not null,
  created_at timestamptz default now()
);

-- 3. Create Sector Strength Table
create table if not exists public.sector_strength (
  id uuid primary key default gen_random_uuid(),
  sector text unique not null,
  strength_score integer check (strength_score >= 0 and strength_score <= 100) not null,
  trend text check (trend in ('up', 'down', 'flat')) default 'flat',
  updated_at timestamptz default now()
);

-- 4. Create AI Activity Feed Table
create table if not exists public.ai_activity_feed (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('Signal', 'News', 'Sector', 'Regime')) not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 5. Enable Row Level Security (RLS)
alter table public.news enable row level security;
alter table public.news_stock_mapping enable row level security;
alter table public.sector_strength enable row level security;
alter table public.ai_activity_feed enable row level security;

-- 6. RLS Policies - Allow Read Access to All Users (including anonymous & authenticated)
create policy "Allow select access to everyone for news" on public.news for select using (true);
create policy "Allow select access to everyone for news mapping" on public.news_stock_mapping for select using (true);
create policy "Allow select access to everyone for sector strength" on public.sector_strength for select using (true);
create policy "Allow select access to everyone for activity feed" on public.ai_activity_feed for select using (true);

-- 7. Seed Sample Data (Fallback dataset identical)

-- Clear old seed data if re-run
truncate table public.news_stock_mapping cascade;
truncate table public.news cascade;
truncate table public.sector_strength cascade;
truncate table public.ai_activity_feed cascade;

-- Seed News
insert into public.news (id, title, source, category, summary, sentiment_score, impact_score, published_at) values
('a123e456-789b-12d3-a456-426614174000', 'RBI holds repo rate unchanged at 6.5%, maintains focus on inflation targets', 'Financial Times', 'Economy', 'The Reserve Bank of India has decided to maintain the policy repo rate at 6.5% for the eighth consecutive time. The decision is in line with expectations to keep inflation within check while supporting balanced GDP growth.', 52, 74, now() - interval '10 minutes'),
('b123e456-789b-12d3-a456-426614174001', 'TCS signs strategic cloud migration partnership with European retail conglomerate', 'Bloomberg', 'Company', 'Tata Consultancy Services announced a multi-year deal worth $450M to migrate legacy infrastructure to hybrid cloud environments. This is expected to improve enterprise revenue growth and margin visibility over the long term.', 88, 85, now() - interval '30 minutes'),
('c123e456-789b-12d3-a456-426614174002', 'US tech indices rally as federal inflation prints at 3.1%, beating estimates', 'Reuters', 'Global', 'Nasdaq composite rose 1.8% in pre-market trade following lower-than-expected CPI prints. Investors expect interest rate cuts by the Federal Reserve to commence sooner, boosting global tech valuations.', 85, 78, now() - interval '2 hours'),
('d123e456-789b-12d3-a456-426614174003', 'Auto sector expects sales expansion following premium model demand spikes', 'Economic Times', 'Sector', 'Passenger vehicle exports saw a 12% rise in May. High-end SUV segments continue to drive margins higher, offsetting flat volumes in entry-level sedan categories.', 78, 65, now() - interval '4 hours'),
('e123e456-789b-12d3-a456-426614174004', 'Reliance Industries acquires premium retail licensing rights for global luxury brands', 'CNBC', 'Company', 'Reliance Retail has announced the acquisition of rights to operate key luxury designer boutiques in prime metropolitan locations, expanding its premium fashion segment market share.', 82, 80, now() - interval '6 hours'),
('f123e456-789b-12d3-a456-426614174005', 'Metal index trades down following slow real estate expansion metrics in China', 'Reuters', 'Global', 'Steel and aluminum contracts dipped 2.3% as property demand indexes drop. Steel output continues to face near-term headwinds from excess supply concerns.', 25, 42, now() - interval '1 day'),
('g123e456-789b-12d3-a456-426614174006', 'Infosys partners with Nvidia to deploy generative AI solutions globally', 'Mint', 'Company', 'Infosys will build custom LLM-based enterprise workflows for global manufacturing clients. This elevates competitive footing in IT consultancy AI segments.', 82, 81, now() - interval '5 hours');

-- Seed Mapping
insert into public.news_stock_mapping (news_id, symbol) values
('a123e456-789b-12d3-a456-426614174000', 'BANKNIFTY'),
('b123e456-789b-12d3-a456-426614174001', 'TCS'),
('c123e456-789b-12d3-a456-426614174002', 'INFY'),
('c123e456-789b-12d3-a456-426614174002', 'TCS'),
('d123e456-789b-12d3-a456-426614174003', 'RELIANCE'),
('e123e456-789b-12d3-a456-426614174004', 'RELIANCE'),
('g123e456-789b-12d3-a456-426614174006', 'INFY');

-- Seed Sector Strength
insert into public.sector_strength (sector, strength_score, trend) values
('IT Services', 91, 'up'),
('Banking & Finance', 88, 'up'),
('Automotive', 82, 'flat'),
('FMCG', 61, 'down'),
('Metals & Mining', 58, 'down');

-- Seed AI Activity Feed
insert into public.ai_activity_feed (type, message, metadata) values
('Signal', 'AI Confidence rating for TCS increased from 81 → 89 based on volume breakout.', '{"symbol": "TCS", "old_score": 81, "new_score": 89}'),
('Sector', 'IT Services sector upgraded to Strong Bullish following cloud deal confirmations.', '{"sector": "IT Services", "status": "Strong Bullish"}'),
('News', 'RBI Repo rate decision uploaded. Financial sector volatility adjustment: Low.', '{"category": "Economy", "impact": "Neutral"}'),
('Signal', 'Reliance Industries Impact Score upgraded to 92 after retail buyout announcement.', '{"symbol": "RELIANCE", "score": 92}'),
('Regime', 'NIFTY Index regime adjusted to Bullish as Nasdaq prints cooler CPI reports.', '{"index": "NIFTY 50", "regime": "Bullish"}');
