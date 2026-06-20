import { supabase } from "../../services/supabase";
import type { AIScore, AIScoreBreakdown, MarketRegime } from "./types";

export interface Signal {
  id: string;
  symbol: string;
  opportunity_status: 'Elite Opportunity' | 'Strong Opportunity' | 'Watch Closely' | 'Avoid';
  setup_type: 'Bullish Breakout' | 'Pullback Recovery' | 'Volatility Squeeze' | 'Support Bounce';
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  target_3: number;
  current_price: number;
  confidence: number;
  signal_quality_score: number;
  status: 'Active' | 'Closed' | 'Archived';
  generated_time: string;
  valid_until: string;
  created_by: string;
  created_at: string;
  entry_zone_low?: number;
  entry_zone_high?: number;
  bullish_scenario?: string;
  bearish_scenario?: string;
  suggested_approach?: string;
}

export interface SignalDNA {
  id: string;
  signal_id: string;
  market_regime: string;
  sector_strength: number;
  news_score: number;
  technical_score: number;
  timing_score: number;
  risk_score: number;
  confidence_score: number;
}

export interface SignalResult {
  id: string;
  signal_id: string;
  symbol?: string; // Hydrated on client
  setup_type?: string; // Hydrated on client
  opportunity_status?: string; // Hydrated on client
  entry_price?: number; // Hydrated on client
  exit_price: number;
  profit_loss_percent: number;
  result: 'Target Hit' | 'Stop Loss Hit' | 'Expired';
  closed_at: string;
  duration_mins: number;
  max_profit: number;
  max_drawdown: number;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string;
  details: string;
  timestamp: string;
}

export interface AIInsightPattern {
  setup: string;
  conditions: string;
  win_rate: number;
  occurrences: number;
  avg_return: number;
}

const mockRegime: MarketRegime = {
  id: "reg-1",
  regime: "Bull Market",
  confidence: 81,
  updated_at: new Date().toISOString()
};

const mockBreakdowns: Record<string, AIScoreBreakdown> = {
  TCS: { id: "b-1", symbol: "TCS", technical_score: 92, news_score: 81, sector_score: 88, trend_score: 88, volume_score: 79, risk_adjustment: -5, created_at: new Date().toISOString() },
  RELIANCE: { id: "b-2", symbol: "RELIANCE", technical_score: 85, news_score: 90, sector_score: 89, trend_score: 89, volume_score: 78, risk_adjustment: -3, created_at: new Date().toISOString() },
  INFY: { id: "b-3", symbol: "INFY", technical_score: 74, news_score: 85, sector_score: 76, trend_score: 76, volume_score: 70, risk_adjustment: -5, created_at: new Date().toISOString() },
  HDFCBANK: { id: "b-4", symbol: "HDFCBANK", technical_score: 60, news_score: 72, sector_score: 68, trend_score: 68, volume_score: 82, risk_adjustment: -10, created_at: new Date().toISOString() }
};

// Initial state for Local Storage fallback
const initialActiveSignals: Signal[] = [
  {
    id: "act-1",
    symbol: "TCS",
    opportunity_status: "Elite Opportunity",
    setup_type: "Bullish Breakout",
    entry_price: 3800.00,
    stop_loss: 3740.00,
    target_1: 3910.00,
    target_2: 3960.00,
    target_3: 4020.00,
    current_price: 3845.20,
    confidence: 87,
    signal_quality_score: 92,
    status: "Active",
    generated_time: "09:30 AM",
    valid_until: "03:30 PM",
    created_by: "Admin",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "act-2",
    symbol: "INFY",
    opportunity_status: "Watch Closely",
    setup_type: "Pullback Recovery",
    entry_price: 1480.00,
    stop_loss: 1445.00,
    target_1: 1515.00,
    target_2: 1530.00,
    target_3: 1560.00,
    current_price: 1490.50,
    confidence: 76,
    signal_quality_score: 74,
    status: "Active",
    generated_time: "09:45 AM",
    valid_until: "03:30 PM",
    created_by: "Admin",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString()
  }
];

const initialClosedSignals: Signal[] = [
  {
    id: "cls-1",
    symbol: "RELIANCE",
    opportunity_status: "Strong Opportunity",
    setup_type: "Pullback Recovery",
    entry_price: 2925.00,
    stop_loss: 2860.00,
    target_1: 2990.00,
    target_2: 3040.00,
    target_3: 3100.00,
    current_price: 3060.00,
    confidence: 90,
    signal_quality_score: 88,
    status: "Closed",
    generated_time: "10:15 AM",
    valid_until: "03:30 PM",
    created_by: "Admin",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: "cls-2",
    symbol: "HDFCBANK",
    opportunity_status: "Avoid",
    setup_type: "Support Bounce",
    entry_price: 1530.00,
    stop_loss: 1490.00,
    target_1: 1580.00,
    target_2: 1610.00,
    target_3: 1640.00,
    current_price: 1485.00,
    confidence: 65,
    signal_quality_score: 55,
    status: "Closed",
    generated_time: "11:00 AM",
    valid_until: "03:30 PM",
    created_by: "Admin",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  }
];

const initialResults: SignalResult[] = [
  {
    id: "res-1",
    signal_id: "cls-1",
    exit_price: 3060.00,
    profit_loss_percent: 4.61,
    result: "Target Hit",
    closed_at: new Date(Date.now() - 21 * 3600000).toISOString(),
    duration_mins: 180,
    max_profit: 5.00,
    max_drawdown: -0.80
  },
  {
    id: "res-2",
    signal_id: "cls-2",
    exit_price: 1485.00,
    profit_loss_percent: -2.94,
    result: "Stop Loss Hit",
    closed_at: new Date(Date.now() - 44 * 3600000).toISOString(),
    duration_mins: 240,
    max_profit: 1.20,
    max_drawdown: -3.50
  }
];

const initialAuditLogs: AuditLog[] = [
  {
    id: "aud-1",
    admin_id: "Admin",
    action: "CREATE_SIGNAL",
    target_table: "signals",
    target_id: "act-1",
    details: "Admin created Elite Opportunity signal on TCS at Entry 3800.00",
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "aud-2",
    admin_id: "Admin",
    action: "CREATE_SIGNAL",
    target_table: "signals",
    target_id: "act-2",
    details: "Admin created Watch Closely signal on INFY at Entry 1480.00",
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "aud-3",
    admin_id: "Admin",
    action: "CLOSE_SIGNAL",
    target_table: "signals",
    target_id: "cls-1",
    details: "Admin closed RELIANCE signal at Exit price 3060.00. Result: Target Hit (+4.61%)",
    timestamp: new Date(Date.now() - 21 * 3600000).toISOString()
  }
];

const mockLearningInsights: AIInsightPattern[] = [
  { setup: "Pullback Recovery", conditions: "IT Sector Strength > 85 + Bull Market + Positive News", win_rate: 82, occurrences: 340, avg_return: 5.12 },
  { setup: "Bullish Breakout", conditions: "Volume Surge > 2x + Sector strength > 80 + Trend Bullish", win_rate: 76, occurrences: 412, avg_return: 4.82 },
  { setup: "Support Bounce", conditions: "RSI Oversold (< 30) + Key support levels + Sideways regime", win_rate: 79, occurrences: 218, avg_return: 3.90 },
  { setup: "Volatility Squeeze", conditions: "Index volatility High + MACD positive cross + Low risk score", win_rate: 68, occurrences: 154, avg_return: 6.20 }
];

// Helper to interact with Local Storage for offline resiliency
const getLocalData = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initial;
    }
  }
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const saveLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const signalsService = {
  /**
   * Fetch system-wide Nifty Market Regime.
   */
  async getMarketRegime(): Promise<MarketRegime> {
    try {
      const { data, error } = await supabase
        .from("market_regime")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as MarketRegime;
      return mockRegime;
    } catch (err) {
      console.warn("Supabase market_regime query failed; using mock data fallback.", err);
      return mockRegime;
    }
  },

  /**
   * Fetch all AI Signal Scores (For the active Opportunity Hub / Watchlist widgets)
   */
  async getSignals(): Promise<AIScore[]> {
    try {
      const { data, error } = await supabase
        .from("ai_scores")
        .select("*")
        .order("score", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) return data as AIScore[];
      return this.getActiveSignalsAsAIScores();
    } catch (err) {
      console.warn("Supabase ai_scores query failed; using mock data fallback.", err);
      return this.getActiveSignalsAsAIScores();
    }
  },

  /**
   * Helper mapping admin Active signals into standard AIScore view
   */
  getActiveSignalsAsAIScores(): AIScore[] {
    const active = this.getLocalActiveSignals();
    return active.map((sig) => ({
      id: sig.id,
      symbol: sig.symbol,
      score: sig.signal_quality_score,
      confidence: sig.confidence,
      risk: sig.opportunity_status === "Avoid" ? "High" : sig.opportunity_status === "Elite Opportunity" ? "Low" : "Medium",
      trade_readiness: sig.opportunity_status === "Elite Opportunity" ? 88 : sig.opportunity_status === "Strong Opportunity" ? 81 : 72,
      trend: sig.setup_type === "Bullish Breakout" ? "Bullish" : sig.setup_type === "Support Bounce" ? "Neutral" : "Bullish",
      created_at: sig.created_at,
      opportunity_status: sig.opportunity_status,
      current_price: sig.current_price,
      entry_zone_low: sig.entry_zone_low ?? Number((sig.entry_price * 0.995).toFixed(1)),
      entry_zone_high: sig.entry_zone_high ?? Number((sig.entry_price * 1.005).toFixed(1)),
      stop_loss: sig.stop_loss,
      target_1: sig.target_1,
      target_2: sig.target_2,
      target_3: sig.target_3,
      generated_time: sig.generated_time,
      valid_until: sig.valid_until,
      bullish_scenario: sig.bullish_scenario ?? `If price sustains above ₹${sig.entry_price}, high probability of breakout.`,
      bearish_scenario: sig.bearish_scenario ?? `If price breaks below ₹${sig.entry_price * 0.99}, risk increases.`,
      suggested_approach: sig.suggested_approach ?? `Accumulate near entry zones. Setup strategy: ${sig.setup_type}.`,
      result_status: "Active"
    }));
  },

  /**
   * Fetch detailed breakdown weights for a symbol.
   */
  async getBreakdown(symbol: string): Promise<AIScoreBreakdown | null> {
    try {
      const { data, error } = await supabase
        .from("ai_score_breakdown")
        .select("*")
        .eq("symbol", symbol)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as AIScoreBreakdown;
      return mockBreakdowns[symbol] || null;
    } catch (err) {
      console.warn(`Supabase ai_score_breakdown query failed for ${symbol}; using mock data fallback.`, err);
      return mockBreakdowns[symbol] || null;
    }
  },

  // --- SIOS Admin & Results Tracking Layer (Local Storage Failbacks) ---

  getLocalActiveSignals(): Signal[] {
    return getLocalData<Signal[]>("trademind_active_signals", initialActiveSignals);
  },

  getLocalClosedSignals(): Signal[] {
    return getLocalData<Signal[]>("trademind_closed_signals", initialClosedSignals);
  },

  getLocalResults(): SignalResult[] {
    return getLocalData<SignalResult[]>("trademind_results", initialResults);
  },

  getLocalAuditLogs(): AuditLog[] {
    return getLocalData<AuditLog[]>("trademind_audit_logs", initialAuditLogs);
  },

  /**
   * Fetch all active signals for admin panel
   */
  async getActiveSignals(): Promise<Signal[]> {
    try {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .eq("status", "Active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) return data as Signal[];
      return this.getLocalActiveSignals();
    } catch (err) {
      console.warn("Supabase active signals fetch failed; using local storage fallback.", err);
      return this.getLocalActiveSignals();
    }
  },

  /**
   * Fetch completed signal results for accuracy panel
   */
  async getClosedResults(): Promise<SignalResult[]> {
    try {
      const { data, error } = await supabase
        .from("signal_results")
        .select(`
          id,
          signal_id,
          exit_price,
          profit_loss_percent,
          result,
          closed_at,
          duration_mins,
          max_profit,
          max_drawdown,
          signals (symbol, setup_type, opportunity_status, entry_price)
        `)
        .order("closed_at", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          signal_id: item.signal_id,
          exit_price: Number(item.exit_price),
          profit_loss_percent: Number(item.profit_loss_percent),
          result: item.result,
          closed_at: item.closed_at,
          duration_mins: item.duration_mins,
          max_profit: Number(item.max_profit),
          max_drawdown: Number(item.max_drawdown),
          symbol: item.signals?.symbol,
          setup_type: item.signals?.setup_type,
          opportunity_status: item.signals?.opportunity_status,
          entry_price: Number(item.signals?.entry_price)
        }));
      }
      return this.getHydratedLocalResults();
    } catch (err) {
      console.warn("Supabase closed results fetch failed; using local storage fallback.", err);
      return this.getHydratedLocalResults();
    }
  },

  getHydratedLocalResults(): SignalResult[] {
    const closed = this.getLocalClosedSignals();
    const results = this.getLocalResults();

    return results.map((res) => {
      const parent = closed.find((c) => c.id === res.signal_id);
      return {
        ...res,
        symbol: parent?.symbol || "TCS",
        setup_type: parent?.setup_type || "Bullish Breakout",
        opportunity_status: parent?.opportunity_status || "Strong Opportunity",
        entry_price: parent?.entry_price || 3800.00
      };
    });
  },

  /**
   * Admin Signal Creator
   */
  async createSignal(
    signal: Omit<Signal, "id" | "current_price" | "status" | "created_by" | "created_at">,
    dna: Omit<SignalDNA, "id" | "signal_id">
  ): Promise<Signal> {
    const newId = `sig-${Math.random().toString(36).substr(2, 9)}`;
    const createdSignal: Signal = {
      ...signal,
      id: newId,
      current_price: signal.entry_price,
      status: "Active",
      created_by: "Admin",
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from("signals")
        .insert({
          symbol: signal.symbol,
          opportunity_status: signal.opportunity_status,
          setup_type: signal.setup_type,
          entry_price: signal.entry_price,
          stop_loss: signal.stop_loss,
          target_1: signal.target_1,
          target_2: signal.target_2,
          target_3: signal.target_3,
          current_price: signal.entry_price,
          confidence: signal.confidence,
          signal_quality_score: signal.signal_quality_score,
          generated_time: signal.generated_time,
          valid_until: signal.valid_until
        })
        .select()
        .single();

      if (error) throw error;
      
      // Insert DNA
      if (data) {
        await supabase.from("signal_dna").insert({
          signal_id: data.id,
          ...dna
        });

        // Insert Audit Log
        await supabase.from("audit_logs").insert({
          action: "CREATE_SIGNAL",
          target_table: "signals",
          target_id: data.id,
          details: `Admin created ${signal.opportunity_status} on ${signal.symbol}`
        });

        return data as Signal;
      }
    } catch (err) {
      console.warn("Supabase createSignal query failed; saving locally.", err);
    }

    // Local Fallback operations
    const active = this.getLocalActiveSignals();
    active.unshift(createdSignal);
    saveLocalData("trademind_active_signals", active);

    const audits = this.getLocalAuditLogs();
    audits.unshift({
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      admin_id: "Admin",
      action: "CREATE_SIGNAL",
      target_table: "signals",
      target_id: newId,
      details: `Admin created ${signal.opportunity_status} signal on ${signal.symbol} at Entry ${signal.entry_price}`,
      timestamp: new Date().toISOString()
    });
    saveLocalData("trademind_audit_logs", audits);

    return createdSignal;
  },

  /**
   * Close active signal
   */
  async closeSignal(signalId: string, exitPrice: number, outcome: 'Target Hit' | 'Stop Loss Hit' | 'Expired'): Promise<void> {
    try {
      const { data: signal, error: fetchErr } = await supabase
        .from("signals")
        .select("*")
        .eq("id", signalId)
        .single();

      if (fetchErr) throw fetchErr;

      if (signal) {
        const entry = Number(signal.entry_price);
        const pnl = ((exitPrice - entry) / entry) * 100;
        const duration = Math.round((Date.now() - new Date(signal.created_at).getTime()) / 60000);

        // Update status in signals table
        await supabase
          .from("signals")
          .update({ status: "Closed", current_price: exitPrice })
          .eq("id", signalId);

        // Insert results tracking
        await supabase.from("signal_results").insert({
          signal_id: signalId,
          exit_price: exitPrice,
          profit_loss_percent: pnl,
          result: outcome,
          duration_mins: duration,
          max_profit: outcome === "Target Hit" ? Math.abs(pnl) * 1.1 : 1.2,
          max_drawdown: outcome === "Stop Loss Hit" ? pnl * 1.1 : -0.5
        });

        // Insert audit log
        await supabase.from("audit_logs").insert({
          action: "CLOSE_SIGNAL",
          target_table: "signals",
          target_id: signalId,
          details: `Admin closed ${signal.symbol} signal. Exit: ${exitPrice}, PnL: ${pnl.toFixed(2)}%`
        });

        return;
      }
    } catch (err) {
      console.warn("Supabase closeSignal failed; performing local closure.", err);
    }

    // Local Storage Fallback
    const active = this.getLocalActiveSignals();
    const closed = this.getLocalClosedSignals();
    const results = this.getLocalResults();
    const audits = this.getLocalAuditLogs();

    const targetIdx = active.findIndex((s) => s.id === signalId);
    if (targetIdx !== -1) {
      const sig = active[targetIdx];
      active.splice(targetIdx, 1);
      sig.status = "Closed";
      sig.current_price = exitPrice;
      closed.unshift(sig);

      const pnl = ((exitPrice - sig.entry_price) / sig.entry_price) * 100;
      const duration = Math.round((Date.now() - new Date(sig.created_at).getTime()) / 60000);

      results.unshift({
        id: `res-${Math.random().toString(36).substr(2, 9)}`,
        signal_id: signalId,
        exit_price: exitPrice,
        profit_loss_percent: Number(pnl.toFixed(2)),
        result: outcome,
        closed_at: new Date().toISOString(),
        duration_mins: duration || 60,
        max_profit: outcome === "Target Hit" ? Number((Math.abs(pnl) * 1.08).toFixed(2)) : 0.8,
        max_drawdown: outcome === "Stop Loss Hit" ? Number((pnl * 1.05).toFixed(2)) : -0.3
      });

      audits.unshift({
        id: `aud-${Math.random().toString(36).substr(2, 9)}`,
        admin_id: "Admin",
        action: "CLOSE_SIGNAL",
        target_table: "signals",
        target_id: signalId,
        details: `Admin closed ${sig.symbol} signal. Exit: ${exitPrice}, PnL: ${pnl.toFixed(2)}% (${outcome})`,
        timestamp: new Date().toISOString()
      });

      saveLocalData("trademind_active_signals", active);
      saveLocalData("trademind_closed_signals", closed);
      saveLocalData("trademind_results", results);
      saveLocalData("trademind_audit_logs", audits);
    }
  },

  /**
   * Fetch audit logs
   */
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data && data.length > 0) return data as AuditLog[];
      return this.getLocalAuditLogs();
    } catch (err) {
      console.warn("Supabase audit logs fetch failed; using local storage fallback.", err);
      return this.getLocalAuditLogs();
    }
  },

  /**
   * Get learning insights mock configurations
   */
  getLearningInsights(): AIInsightPattern[] {
    return mockLearningInsights;
  }
};

export default signalsService;
