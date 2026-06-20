-- TradeMind AI - Supabase Database Schema Migration (Sprint 5)
-- This script creates the AI Signal Engine, Score Breakdown, and Market Regime tables.
-- Execute this in your Supabase SQL Editor.

-- 1. Create AI Scores Table
create table if not exists public.ai_scores (
  id uuid primary key default gen_random_uuid(),
  symbol text unique not null,
  score integer check (score >= 0 and score <= 100) not null,
  confidence integer check (confidence >= 0 and confidence <= 100) not null,
  risk text check (risk in ('Low', 'Medium', 'High', 'Extreme')) not null,
  trade_readiness integer check (trade_readiness >= 0 and trade_readiness <= 100) not null,
  trend text check (trend in ('Bullish', 'Bearish', 'Neutral')) not null,
  created_at timestamptz default now()
);

-- 2. Create AI Score Breakdown Table
create table if not exists public.ai_score_breakdown (
  id uuid primary key default gen_random_uuid(),
  symbol text unique not null references public.ai_scores(symbol) on delete cascade,
  technical_score integer check (technical_score >= 0 and technical_score <= 100) not null,
  news_score integer check (news_score >= 0 and news_score <= 100) not null,
  sector_score integer check (sector_score >= 0 and sector_score <= 100) not null,
  trend_score integer check (trend_score >= 0 and trend_score <= 100) not null,
  volume_score integer check (volume_score >= 0 and volume_score <= 100) not null,
  risk_adjustment integer not null, -- negative points (e.g. -5)
  created_at timestamptz default now()
);

-- 3. Create Market Regime Table
create table if not exists public.market_regime (
  id uuid primary key default gen_random_uuid(),
  regime text check (regime in ('Bull Market', 'Bear Market', 'Sideways Market', 'High Volatility')) not null,
  confidence integer check (confidence >= 0 and confidence <= 100) not null,
  updated_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS)
alter table public.ai_scores enable row level security;
alter table public.ai_score_breakdown enable row level security;
alter table public.market_regime enable row level security;

-- 5. RLS Policies - Allow Read Access to All Users (including anonymous & authenticated)
create policy "Allow select access to everyone for ai_scores" on public.ai_scores for select using (true);
create policy "Allow select access to everyone for breakdown" on public.ai_score_breakdown for select using (true);
create policy "Allow select access to everyone for market_regime" on public.market_regime for select using (true);

-- 6. Seed Sample Data

-- Clear old seed data if re-run
truncate table public.ai_score_breakdown cascade;
truncate table public.ai_scores cascade;
truncate table public.market_regime cascade;

-- Seed Market Regime
insert into public.market_regime (regime, confidence) values
('Bull Market', 81);

-- Seed AI Scores
insert into public.ai_scores (id, symbol, score, confidence, risk, trade_readiness, trend) values
('c5a01234-789b-12d3-a456-426614175000', 'TCS', 89, 87, 'Medium', 84, 'Bullish'),
('c5a01234-789b-12d3-a456-426614175001', 'RELIANCE', 87, 90, 'Low', 81, 'Bullish'),
('c5a01234-789b-12d3-a456-426614175002', 'INFY', 81, 76, 'Medium', 78, 'Neutral'),
('c5a01234-789b-12d3-a456-426614175003', 'HDFCBANK', 75, 65, 'High', 72, 'Neutral');

-- Seed AI Score Breakdown
insert into public.ai_score_breakdown (symbol, technical_score, news_score, sector_score, trend_score, volume_score, risk_adjustment) values
('TCS', 92, 81, 88, 88, 79, -5),
('RELIANCE', 85, 90, 89, 89, 78, -3),
('INFY', 74, 85, 76, 76, 70, -5),
('HDFCBANK', 60, 72, 68, 68, 82, -10);
