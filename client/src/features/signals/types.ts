export interface AIScore {
  id: string;
  symbol: string;
  score: number;
  confidence: number;
  risk: 'Low' | 'Medium' | 'High' | 'Extreme';
  trade_readiness: number;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  created_at: string;
  
  // Advanced Signal Info
  opportunity_status: 'Elite Opportunity' | 'Strong Opportunity' | 'Watch Closely' | 'Avoid';
  current_price: number;
  entry_zone_low: number;
  entry_zone_high: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  target_3: number;
  
  // Timings
  generated_time: string;
  valid_until: string;
  
  // Scenarios & Actions
  bullish_scenario: string;
  bearish_scenario: string;
  suggested_approach: string;
  
  // Performance Tracking
  result_status?: 'Active' | 'Target Hit' | 'Stop Loss Hit';
  result_pct?: number;
}

export interface AIScoreBreakdown {
  id: string;
  symbol: string;
  technical_score: number;
  news_score: number;
  sector_score: number;
  trend_score: number;
  volume_score: number;
  risk_adjustment: number;
  created_at: string;
}

export interface MarketRegime {
  id: string;
  regime: 'Bull Market' | 'Bear Market' | 'Sideways Market' | 'High Volatility';
  confidence: number;
  updated_at: string;
}
