/**
 * Shared Type Definitions for TradeMind AI
 */

// 1. User
export interface User {
  id: string;
  email: string;
  role: "user" | "admin" | "analyst";
  created_at: string;
  updated_at: string;
}

// 2. Trade
export interface PaperPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_price: number; // For backward compatibility
  avg_entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  status: "open" | "closed" | "partial";
  created_at: string;
  updated_at: string;
}

export interface PaperTrade {
  id: string;
  user_id: string;
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  timestamp: string;
  status: "completed" | "failed" | "pending";
}

// 3. Portfolio
export interface PaperPortfolio {
  id: string;
  user_id: string;
  balance: number;
  total_value: number;
  start_balance: number;
  created_at: string;
  updated_at: string;
}

// 4. Signal
export interface Signal {
  id: string;
  symbol: string;
  type: "BUY" | "SELL" | "HOLD";
  strength: number; // 0-100
  timeframe: string; // e.g. "1D", "4H"
  indicators: Record<string, any>;
  reasoning: string;
  timestamp: string;
}

// 5. News
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
  impact_score: number; // 1-10
  timestamp: string;
}

// 6. Market
export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

// 7. AI Recommendation
export interface AIRecommendation {
  id: string;
  user_id: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  status: "active" | "implemented" | "dismissed";
  created_at: string;
}

// 8. Admin Audit & Monitoring
export interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  table_name: string;
  record_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
