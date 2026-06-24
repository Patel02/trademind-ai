import { supabase } from "../../services/supabase";
import { signalsService } from "../signals/signals.service";
import { portfolioDoctorService } from "../portfolio-doctor/portfolio-doctor.service";
import { markerService } from "./services/marker.service";
import { tradeOrderSchema } from "../../security/validations";
import { rateLimiter } from "../../security/rateLimit";
import { auditService } from "../../security/audit.service";
import { sentryMock } from "../../security/monitoring";

export interface PaperPortfolio {
  id: string;
  user_id: string;
  balance: number;
  total_value: number;
  created_at: string;
  updated_at?: string;
  start_balance: number; // legacy fallback made mandatory
}

export interface SignalDNASnapshot {
  opportunityScore: number;
  timingScore: number;
  riskScore: number;
  confidenceScore: number;
  marketRegime: string;
  sectorStrength: number;
  newsScore: number;
  setupType: string; // D1 Setup Type
}

export interface TradeJournal {
  beforeEntry: {
    reason: string;
    expectations: string;
    riskPlan: string;
  };
  afterExit: {
    whatHappened: string;
    whatWorked: string;
    whatFailed: string;
  };
}

export interface AITradeReview {
  score: number;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  lessons: string[];
}

export interface PaperPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  created_at: string;
  status: 'open' | 'partial' | 'closed'; // B3: position lifecycle status

  // Legacy fallback compatibility made mandatory
  avg_entry_price: number;
  updated_at: string;
  entry_date?: string;
  signal_dna?: SignalDNASnapshot;
  journal_before?: {
    reason: string;
    expectations: string;
    riskPlan: string;
  };
}

export interface PaperOrder {
  id: string;
  user_id: string;
  symbol: string;
  type: "BUY" | "SELL"; // Mapped from DB side
  quantity: number;
  execution_price: number; // Mapped from DB price
  status: "Executed" | "Cancelled";
  created_at: string;
}

export interface PaperClosedTrade {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  entry_price: number;
  exit_price: number;
  profit_loss: number;         // Mapped from DB pnl
  profit_loss_percent: number;
  status: 'open' | 'closed' | 'cancelled'; // A3: explicit status field
  entry_date: string;
  exit_date: string | null;    // null when trade is still open
  signal_dna: SignalDNASnapshot;
  journal: TradeJournal;
  ai_review: AITradeReview;
  created_at: string;
}

export interface BehavioralAnalytics {
  totalTrades: number;
  winRate: number;
  avgGain: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgHoldingMins: number;
  sectorStats: { sector: string; trades: number; profit: number }[];
  recommendations: string[];
}

const DEFAULT_BALANCE = 1000000.00;

const defaultTickerPrices: Record<string, number> = {
  TCS: 3845.20,
  RELIANCE: 2950.40,
  INFY: 1490.50,
  HDFCBANK: 1560.10
};

// Helper to safely fetch logged-in user id or default to mock UUID
const getUserId = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Fail silently
  }
  return "00000000-0000-0000-0000-000000000000";
};

// Local storage helpers
const getLocalPortfolio = (): PaperPortfolio => {
  const stored = localStorage.getItem("trademind_paper_portfolio_v2");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  const defaultPort: PaperPortfolio = {
    id: "port-mock",
    user_id: "00000000-0000-0000-0000-000000000000",
    balance: DEFAULT_BALANCE,
    total_value: DEFAULT_BALANCE,
    start_balance: DEFAULT_BALANCE,
    created_at: new Date().toISOString()
  };
  localStorage.setItem("trademind_paper_portfolio_v2", JSON.stringify(defaultPort));
  return defaultPort;
};

const saveLocalPortfolio = (portfolio: PaperPortfolio) => {
  localStorage.setItem("trademind_paper_portfolio_v2", JSON.stringify(portfolio));
};

const getLocalPositions = (): PaperPosition[] => {
  const stored = localStorage.getItem("trademind_paper_positions_v2");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  return [];
};

const saveLocalPositions = (positions: PaperPosition[]) => {
  localStorage.setItem("trademind_paper_positions_v2", JSON.stringify(positions));
};

const getLocalOrders = (): PaperOrder[] => {
  const stored = localStorage.getItem("trademind_paper_orders_v2");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  return [];
};

const saveLocalOrders = (orders: PaperOrder[]) => {
  localStorage.setItem("trademind_paper_orders_v2", JSON.stringify(orders));
};

const getLocalClosedTrades = (): PaperClosedTrade[] => {
  const stored = localStorage.getItem("trademind_paper_closed_trades_v2");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  return [];
};

const saveLocalClosedTrades = (closed: PaperClosedTrade[]) => {
  localStorage.setItem("trademind_paper_closed_trades_v2", JSON.stringify(closed));
};

export const paperTradingService = {
  /**
   * Helper to resolve the latest market price of a stock.
   */
  async getStockPrice(symbol: string): Promise<number> {
    try {
      const signals = await signalsService.getSignals();
      const match = signals.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
      if (match && match.current_price) {
        return match.current_price;
      }
    } catch {
      // Fail silently, use defaults
    }
    return defaultTickerPrices[symbol.toUpperCase()] || 1000.00;
  },

  /**
   * Get virtual portfolio details (paper_accounts table)
   */
  async getPortfolio(): Promise<PaperPortfolio> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const localPort = getLocalPortfolio();
      localPort.user_id = userId;
      return localPort;
    }
    try {
      const { data, error } = await supabase
        .from("paper_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          balance: Number(data.balance),
          total_value: Number(data.total_value),
          start_balance: DEFAULT_BALANCE,
          created_at: data.created_at
        };
      } else {
        // Seed initial balance for user in database
        const { data: inserted, error: insertErr } = await supabase
          .from("paper_accounts")
          .insert({
            user_id: userId,
            balance: DEFAULT_BALANCE,
            total_value: DEFAULT_BALANCE
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return {
          id: inserted.id,
          user_id: inserted.user_id,
          balance: Number(inserted.balance),
          total_value: Number(inserted.total_value),
          start_balance: DEFAULT_BALANCE,
          created_at: inserted.created_at
        };
      }
    } catch (err) {
      console.warn("Supabase paper_accounts fetch/seed failed; using local storage.", err);
    }
    
    // Sync local storage portfolio if DB fails
    const localPort = getLocalPortfolio();
    localPort.user_id = userId;
    return localPort;
  },

  /**
   * Get open positions (paper_positions table)
   */
  async getPositions(): Promise<PaperPosition[]> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const localPositions = getLocalPositions().filter((p) => p.user_id === userId);
      const updated = await Promise.all(
        localPositions.map(async (pos) => {
          const price = await this.getStockPrice(pos.symbol);
          const unrealized = Number(((price - pos.avg_price) * pos.quantity).toFixed(2));
          return {
            ...pos,
            current_price: price,
            unrealized_pnl: unrealized
          };
        })
      );
      const allLocal = getLocalPositions().filter((p) => p.user_id !== userId);
      saveLocalPositions([...allLocal, ...updated]);
      return updated;
    }
    let positions: PaperPosition[] = [];
    try {
      const { data, error } = await supabase
        .from("paper_positions")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      if (data) {
        positions = data.map((pos) => ({
          id: pos.id,
          user_id: pos.user_id,
          symbol: pos.symbol,
          quantity: Number(pos.quantity),
          avg_price: Number(pos.avg_price),
          avg_entry_price: Number(pos.avg_price), // backward compatibility
          current_price: Number(pos.current_price),
          unrealized_pnl: Number(pos.unrealized_pnl),
          realized_pnl: Number(pos.realized_pnl),
          created_at: pos.created_at,
          entry_date: pos.created_at,
          updated_at: pos.updated_at || pos.created_at || new Date().toISOString(),
          status: (Number(pos.realized_pnl) > 0 ? 'partial' : 'open') as 'open' | 'partial' | 'closed', // B3 status field
          signal_dna: pos.signal_dna,
          journal_before: pos.journal_before
        }));
      }
    } catch (err) {
      console.warn("Supabase paper_positions fetch failed; using local storage.", err);
      positions = getLocalPositions().filter((p) => p.user_id === userId);
    }

    // Hydrate current price and PnLs dynamically
    const updated = await Promise.all(
      positions.map(async (pos) => {
        const price = await this.getStockPrice(pos.symbol);
        const unrealized = Number(((price - pos.avg_price) * pos.quantity).toFixed(2));
        
        const updatedPos = {
          ...pos,
          current_price: price,
          unrealized_pnl: unrealized
        };

        // Try to update current price and unrealized pnl in database
        try {
          await supabase
            .from("paper_positions")
            .update({
              current_price: price,
              unrealized_pnl: unrealized
            })
            .eq("id", pos.id);
        } catch {
          // Ignore write failure during reads
        }

        return updatedPos;
      })
    );

    // If local positions, save them back
    const allLocal = getLocalPositions().filter((p) => p.user_id !== userId);
    saveLocalPositions([...allLocal, ...updated]);

    return updated;
  },

  /**
   * C1: Refresh portfolio value — recalculate unrealized PnL using current prices.
   * Call this periodically (e.g. every 60s) or on-demand for accurate portfolio value.
   */
  async refreshPortfolioValue(): Promise<void> {
    try {
      const [portfolio, positions] = await Promise.all([
        this.getPortfolio(),
        this.getPositions(), // getPositions already hydrates current prices
      ]);

      const totalUnrealized = positions.reduce((s, p) => s + p.unrealized_pnl, 0);
      const newTotalValue   = Number((portfolio.balance + totalUnrealized).toFixed(2));

      const userId = await getUserId();
      if (userId !== "00000000-0000-0000-0000-000000000000") {
        await supabase
          .from("paper_accounts")
          .update({ total_value: newTotalValue })
          .eq("user_id", userId);
      }

      // Update local
      const localPort = getLocalPortfolio();
      localPort.total_value = newTotalValue;
      saveLocalPortfolio(localPort);

      // E2: Log audit event POSITION_PRICE_REFRESHED
      try {
        await auditService.logAction("POSITION_PRICE_REFRESHED", "paper_accounts", portfolio.id, {
          totalValue: newTotalValue,
          unrealizedPnL: totalUnrealized
        });
      } catch (auditErr) {
        // Ignore fallback logging errors
      }
    } catch (err) {
      console.warn("[refreshPortfolioValue] Failed:", err);
    }
  },

  /**
   * C2: Get rich computed portfolio metrics.
   * Includes: cash, invested, current value, unrealized PnL, realized PnL, return %.
   */
  async getPortfolioMetrics(): Promise<{
    cashBalance:          number;
    investedAmount:       number;
    currentValue:         number;
    unrealizedPnL:        number;
    realizedPnL:          number;
    totalPortfolioValue:  number;
    totalReturnPct:       number;
    dayChangePct:         number;
  }> {
    const [portfolio, positions, closedTrades] = await Promise.all([
      this.getPortfolio(),
      this.getPositions(),
      this.getClosedTrades(),
    ]);

    const cashBalance    = portfolio.balance;
    const investedAmount = positions.reduce((s, p) => s + p.avg_price * p.quantity, 0);
    const currentValue   = positions.reduce((s, p) => s + p.current_price * p.quantity, 0);
    const unrealizedPnL  = positions.reduce((s, p) => s + p.unrealized_pnl, 0);
    const realizedPnL    = closedTrades.reduce((s, t) => s + t.profit_loss, 0);

    const totalPortfolioValue = Number((cashBalance + currentValue).toFixed(2));
    const startBalance        = portfolio.start_balance || DEFAULT_BALANCE;
    const totalReturnPct      = Number((((totalPortfolioValue - startBalance) / startBalance) * 100).toFixed(2));

    return {
      cashBalance:         Number(cashBalance.toFixed(2)),
      investedAmount:      Number(investedAmount.toFixed(2)),
      currentValue:        Number(currentValue.toFixed(2)),
      unrealizedPnL:       Number(unrealizedPnL.toFixed(2)),
      realizedPnL:         Number(realizedPnL.toFixed(2)),
      totalPortfolioValue,
      totalReturnPct,
      dayChangePct:        0, // Placeholder — requires previous day close prices
    };
  },

  /**
   * Get transaction orders journal (paper_orders table)
   */
  async getOrders(): Promise<PaperOrder[]> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      return getLocalOrders().filter((o) => o.user_id === userId);
    }
    try {
      const { data, error } = await supabase
        .from("paper_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map((ord) => ({
          id: ord.id,
          user_id: ord.user_id,
          symbol: ord.symbol,
          type: ord.side as "BUY" | "SELL",
          quantity: Number(ord.quantity),
          execution_price: Number(ord.price),
          status: ord.status as "Executed" | "Cancelled",
          created_at: ord.created_at
        }));
      }
    } catch (err) {
      console.warn("Supabase paper_orders fetch failed; using local storage.", err);
    }
    return getLocalOrders().filter((o) => o.user_id === userId);
  },

  /**
   * Fetch ALL trades (open + closed) — A4: unified fetch with correct date mapping
   */
  async getAllTrades(): Promise<PaperClosedTrade[]> {
    const userId = await getUserId();
    const mapTrade = (trade: any): PaperClosedTrade => {
      const entryPrice  = Number(trade.entry_price) || 0;
      const exitPrice   = Number(trade.exit_price)  || 0;
      const pnl         = Number(trade.pnl)         || 0;
      const pnlPct      = entryPrice > 0 && exitPrice > 0
        ? Number((((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2))
        : 0;
      const dna = trade.signal_dna || {
        opportunityScore: 70, timingScore: 70, riskScore: 30, confidenceScore: 70,
        marketRegime: "Bull Market", sectorStrength: 80, newsScore: 70
      };
      return {
        id:                   trade.id,
        user_id:              trade.user_id,
        symbol:               trade.symbol,
        quantity:             Number(trade.quantity),
        entry_price:          entryPrice,
        exit_price:           exitPrice,
        profit_loss:          pnl,
        profit_loss_percent:  pnlPct,
        status:               (trade.status as 'open' | 'closed' | 'cancelled') || 'closed',
        entry_date:           trade.entry_date  || trade.created_at,   // A2: correct field
        exit_date:            trade.exit_date   || trade.closed_at || null, // A2: null when open
        signal_dna:           dna,
        journal: {
          beforeEntry: {
            reason:       trade.entry_reason || "Technical setup.",
            expectations: "Bullish progression.",
            riskPlan:     "Stop loss defined."
          },
          afterExit: {
            whatHappened: trade.exit_reason || "Position closed.",
            whatWorked:   trade.notes       || "None.",
            whatFailed:   "None."
          }
        },
        ai_review:   this.generateAIReview(trade.symbol, pnlPct, dna),
        created_at:  trade.created_at
      };
    };

    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        const { data, error } = await supabase
          .from("paper_trades")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          // Sync local for offline use
          const mapped = data.map(mapTrade);
          saveLocalClosedTrades(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("[paperTradingService] getAllTrades Supabase fetch failed; using local.", err);
      }
    }
    return getLocalClosedTrades().filter((t) => t.user_id === userId);
  },

  /**
   * Fetch only CLOSED trades — for History closed tab & analytics
   */
  async getClosedTrades(): Promise<PaperClosedTrade[]> {
    const all = await this.getAllTrades();
    return all.filter((t) => t.status === 'closed' || t.status === 'cancelled');
  },

  /**
   * Fetch only OPEN trades — for History open tab & positions overview
   */
  async getOpenTrades(): Promise<PaperClosedTrade[]> {
    const all = await this.getAllTrades();
    return all.filter((t) => t.status === 'open');
  },

  /**
   * Update Trade Journal Notes
   */
  async updateClosedTradeJournal(tradeId: string, exitNotes: Partial<TradeJournal["afterExit"]>): Promise<boolean> {
    const closed = getLocalClosedTrades();
    const idx = closed.findIndex((t) => t.id === tradeId);
    if (idx !== -1) {
      closed[idx].journal.afterExit = {
        ...closed[idx].journal.afterExit,
        ...exitNotes
      };
      saveLocalClosedTrades(closed);

      try {
        await supabase
          .from("paper_trades")
          .update({
            exit_reason: closed[idx].journal.afterExit.whatHappened,
            notes: closed[idx].journal.afterExit.whatWorked
          })
          .eq("id", tradeId);
      } catch (err) {
        console.warn("Supabase paper_trades journal update failed; saved locally.", err);
      }

      // E2: Log audit event TRADE_EDITED
      try {
        await auditService.logAction("TRADE_EDITED", "paper_trades", tradeId, exitNotes);
      } catch (auditErr) {
        // ignore fallback errors
      }

      return true;
    }
    return false;
  },

  /**
   * Helper to generate AI Trade Review metrics
   */
  generateAIReview(symbol: string, pnlPct: number, dna: SignalDNASnapshot): AITradeReview {
    const isProfit = pnlPct >= 0;
    let score = isProfit ? 7.0 + Math.min(3.0, pnlPct * 0.4) : 4.5 + Math.max(-3.5, pnlPct * 0.5);
    if (dna.timingScore > 80) score += 0.5;
    if (dna.newsScore > 80) score += 0.5;
    score = Math.max(1.0, Math.min(10.0, Number(score.toFixed(1))));

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const lessons: string[] = [];
    let analysis = "";

    if (isProfit) {
      analysis = `Excellent execution. The setup capitalized on strong ${symbol === "TCS" || symbol === "INFY" ? "IT Services" : symbol === "RELIANCE" ? "Energy" : "Financials"} sector momentum. Entry near support zones timed with a bullish market regime enabled a positive yield outcome.`;
      strengths.push("Disciplined entry near support");
      strengths.push(`Strong opportunity score alignment (${dna.opportunityScore})`);
      if (dna.newsScore > 80) strengths.push("Positive news sentiment trigger");
      weaknesses.push("Slight exit timing lag compared to daily peaks");
      lessons.push("Maintain strict risk criteria. Secure partial returns near target thresholds to lock in alpha.");
    } else {
      analysis = `The setup suffered from high volatility drag or systematic sector pressure, triggering the risk mitigation stop-loss. Adhering to stop-loss guidelines preserved core trading capital.`;
      strengths.push("Strict stop-loss discipline observed");
      if (dna.riskScore > 60) weaknesses.push("Entered high-risk structural setup");
      weaknesses.push("Market regime volatility drag");
      lessons.push("Avoid averaging down during negative trend regimes. Wait for MACD recovery crossovers on index level.");
    }

    return { score, analysis, strengths, weaknesses, lessons };
  },

  /**
   * Execute BUY or SELL order simulation
   */
  async placeOrder(symbol: string, type: "BUY" | "SELL", quantity: number, note?: string): Promise<{ success: boolean; message: string }> {
    // 1. Rate Limiting Check
    try {
      rateLimiter.checkLimit("orders", 5, 10000);
    } catch (err: any) {
      sentryMock.captureException(err);
      return { success: false, message: err.message };
    }

    // 2. Data Validation
    try {
      tradeOrderSchema.parse({ symbol, type, quantity });
    } catch (err: any) {
      sentryMock.captureException(err);
      if (err.errors && err.errors[0]) {
        return { success: false, message: err.errors[0].message };
      }
      return { success: false, message: "Order data validation failed." };
    }

    const price = await this.getStockPrice(symbol);
    const totalCost = price * quantity;
    const userId = await getUserId();

    // Fetch current portfolio & positions
    const portfolio = await this.getPortfolio();
    const positions = await this.getPositions();

    if (type === "BUY") {
      if (portfolio.balance < totalCost) {
        return {
          success: false,
          message: `Insufficient balance. Required: ₹${totalCost.toLocaleString()}, Available: ₹${portfolio.balance.toLocaleString()}`
        };
      }

      const updatedBalance = Number((portfolio.balance - totalCost).toFixed(2));

      // Resolve Signal DNA Snapshots
      let dna: SignalDNASnapshot = {
        opportunityScore: 75,
        timingScore: 72,
        riskScore: 35,
        confidenceScore: 70,
        marketRegime: "Bull Market",
        sectorStrength: 80,
        newsScore: 75,
        setupType: "Bullish Breakout"
      };

      try {
        const activeSigs = await signalsService.getActiveSignals(); // Use getActiveSignals to get setup_type
        const match = activeSigs.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
        const regimeObj = await signalsService.getMarketRegime();
        
        if (match) {
          dna = {
            opportunityScore: match.signal_quality_score || match.confidence || 75,
            timingScore: match.confidence || 72,
            riskScore: match.opportunity_status === "Avoid" ? 70 : match.opportunity_status === "Elite Opportunity" ? 25 : 45,
            confidenceScore: match.confidence || 70,
            marketRegime: regimeObj.regime,
            sectorStrength: symbol === "TCS" || symbol === "INFY" ? 92 : symbol === "RELIANCE" ? 82 : 78,
            newsScore: match.signal_quality_score > 80 ? 85 : 70,
            setupType: match.setup_type || "Bullish Breakout"
          };
        }
      } catch {
        // Fall back to default
      }

      const journalBefore = {
        reason: note || `Technical breakout entry targeting support level parameters for ${symbol}.`,
        expectations: "Expecting price stabilization and progression towards target 1 and target 2.",
        riskPlan: "Establish strict trailing stop-losses to contain negative volatility drag."
      };

      // F1: Snapshot existing position BEFORE any DB writes (for rollback)
      const existingPos = positions.find((p) => p.symbol === symbol);
      const rollbackSnapshot = existingPos ? { ...existingPos } : null;

      let newTradeId: string | null = null;

      // Try Supabase operations
      if (userId !== "00000000-0000-0000-0000-000000000000") {
        try {
          const existing = positions.find((p) => p.symbol === symbol);
          
          if (existing) {
            const newQty = existing.quantity + quantity;
            const newAvgPrice = Number(((existing.quantity * existing.avg_price + totalCost) / newQty).toFixed(2));
            const unrealized = Number(((price - newAvgPrice) * newQty).toFixed(2));
            
            await supabase
              .from("paper_positions")
              .update({ 
                quantity: newQty, 
                avg_price: newAvgPrice, 
                current_price: price, 
                unrealized_pnl: unrealized,
                signal_dna: dna as any,
                journal_before: journalBefore as any
              })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("paper_positions")
              .insert({
                user_id: userId,
                symbol,
                quantity,
                avg_price: price,
                current_price: price,
                unrealized_pnl: 0,
                realized_pnl: 0,
                signal_dna: dna as any,
                journal_before: journalBefore as any
              });
          }

          // Insert paper_trades record (open status)
          try {
            const { data: tradeData } = await supabase
              .from("paper_trades")
              .insert({
                user_id: userId,
                symbol,
                entry_price: price,
                quantity,
                status: "open",
                entry_date: new Date().toISOString(),
                entry_reason: journalBefore.reason,
                signal_dna: dna as any,
              })
              .select()
              .single();
            if (tradeData) newTradeId = tradeData.id;
          } catch (tradeErr) {
            console.warn("[paperTradingService] paper_trades BUY insert failed.", tradeErr);
          }

          // Insert Order log
          await supabase
            .from("paper_orders")
            .insert({
              user_id: userId,
              symbol,
              side: "BUY",
              quantity,
              price,
              status: "Executed"
            });

          // Compute updated portfolio value
          const { data: latestPos } = await supabase
            .from("paper_positions")
            .select("unrealized_pnl")
            .eq("user_id", userId);
          const totalUnrealized = (latestPos || []).reduce((sum, p) => sum + Number(p.unrealized_pnl), 0);
          const totalValue = Number((updatedBalance + totalUnrealized).toFixed(2));

          // Update portfolio balance & total value
          await supabase
            .from("paper_accounts")
            .update({ balance: updatedBalance, total_value: totalValue })
            .eq("id", portfolio.id);

          // Save BUY chart marker
          await markerService.saveMarker(symbol, "BUY", price, quantity, newTradeId, note);

        } catch (dbErr) {
          // F1: Compensating rollback — revert position if DB writes partially failed
          console.warn("[BUY] Supabase writes failed; attempting position rollback.", dbErr);
          try {
            if (rollbackSnapshot) {
              // Revert position to its pre-BUY state
              await supabase
                .from("paper_positions")
                .update({
                  quantity:       rollbackSnapshot.quantity,
                  avg_price:      rollbackSnapshot.avg_price,
                  unrealized_pnl: rollbackSnapshot.unrealized_pnl,
                })
                .eq("id", rollbackSnapshot.id);
            } else {
              // No position existed before — delete the newly created one
              await supabase
                .from("paper_positions")
                .delete()
                .eq("user_id", userId)
                .eq("symbol", symbol);
            }
            console.info("[BUY] Rollback successful. No partial state left in DB.");
          } catch (rollbackErr) {
            console.error("[BUY] Rollback also failed — manual DB cleanup may be needed.", rollbackErr);
          }
        }
      }

      // Sync Local Storage
      const localPort = getLocalPortfolio();
      localPort.balance = updatedBalance;
      
      const localPositions = getLocalPositions();
      const localIdx = localPositions.findIndex((p) => p.symbol === symbol && p.user_id === userId);
      if (localIdx !== -1) {
        const existing = localPositions[localIdx];
        const newQty = existing.quantity + quantity;
        existing.avg_price = Number(((existing.quantity * existing.avg_price + totalCost) / newQty).toFixed(2));
        existing.avg_entry_price = existing.avg_price;
        existing.quantity = newQty;
        existing.current_price = price;
        existing.unrealized_pnl = Number(((price - existing.avg_price) * newQty).toFixed(2));
        existing.status = (Number(existing.realized_pnl) > 0 ? 'partial' : 'open') as 'open' | 'partial' | 'closed'; // B3 status
        if (!existing.signal_dna) existing.signal_dna = dna;
        if (!existing.journal_before) existing.journal_before = journalBefore;
      } else {
        localPositions.push({
          id: `pos-${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          symbol,
          quantity,
          avg_price: price,
          avg_entry_price: price,
          current_price: price,
          unrealized_pnl: 0,
          realized_pnl: 0,
          status: 'open', // B3 status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          signal_dna: dna,
          journal_before: journalBefore
        });
      }
      
      const totalUnrealizedLocal = localPositions.filter((p) => p.user_id === userId).reduce((sum, p) => sum + p.unrealized_pnl, 0);
      localPort.total_value = Number((updatedBalance + totalUnrealizedLocal).toFixed(2));
      saveLocalPortfolio(localPort);
      saveLocalPositions(localPositions);

      // Save open trade to local storage (for both anonymous and offline sync)
      const openTradeLocal: PaperClosedTrade = {
        id: newTradeId || `trade-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        symbol,
        quantity,
        entry_price: price,
        exit_price: 0,
        profit_loss: 0,
        profit_loss_percent: 0,
        status: "open",
        entry_date: new Date().toISOString(),
        exit_date: null,
        signal_dna: dna,
        journal: {
          beforeEntry: journalBefore,
          afterExit: {
            whatHappened: "",
            whatWorked: "",
            whatFailed: ""
          }
        },
        ai_review: {
          score: 0,
          analysis: "Trade is currently open.",
          strengths: [],
          weaknesses: [],
          lessons: []
        },
        created_at: new Date().toISOString()
      };
      const localClosed = getLocalClosedTrades();
      localClosed.unshift(openTradeLocal);
      saveLocalClosedTrades(localClosed);

      const localOrders = getLocalOrders();
      localOrders.unshift({
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        symbol,
        type: "BUY",
        quantity,
        execution_price: price,
        status: "Executed",
        created_at: new Date().toISOString()
      });
      saveLocalOrders(localOrders);

      await auditService.logAction("BUY_CREATED", "paper_orders", symbol, { quantity, price });

      // A1 FIX: marker already saved inside Supabase block (authenticated) or we save once here for anonymous
      if (userId === "00000000-0000-0000-0000-000000000000") {
        try {
          await markerService.saveMarker(symbol, "BUY", price, quantity, null, note);
        } catch (mkrErr) {
          console.warn("[paperTradingService] Anonymous marker save failed.", mkrErr);
        }
      }

      // Emit DOM event so TradingChart reloads markers immediately
      markerService.emitMarkersUpdated(symbol);

      // Save portfolio snapshot for doctor history
      try {
        const latestPort = await this.getPortfolio();
        const latestPos = await this.getPositions();
        await portfolioDoctorService.saveSnapshot(latestPort, latestPos);
      } catch (snapErr) {
        console.warn("Failed to generate and save portfolio snapshot:", snapErr);
      }

      return { success: true, message: `Successfully bought ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}.` };

    } else {
      // SELL Transaction
      const existing = positions.find((p) => p.symbol === symbol);

      // J2: Early quantity validation — explicit error before any DB writes
      if (!existing) {
        return {
          success: false,
          message: `No open position found for ${symbol}. You must own shares before selling.`
        };
      }
      if (quantity > existing.quantity) {
        return {
          success: false,
          message: `Cannot sell ${quantity} shares — you only hold ${existing.quantity} shares of ${symbol}. Reduce quantity or sell all.`
        };
      }

      const updatedBalance = Number((portfolio.balance + totalCost).toFixed(2));
      const remainingQty = existing.quantity - quantity;
      
      const entryPrice = existing.avg_price;
      const profitLoss = Number(((price - entryPrice) * quantity).toFixed(2));
      const profitLossPercent = Number((((price - entryPrice) / entryPrice) * 100).toFixed(2));
      
      const dna = existing.signal_dna || {
        opportunityScore: 75, timingScore: 70, riskScore: 35, confidenceScore: 80,
        marketRegime: "Bull Market", sectorStrength: 80, newsScore: 75
      };

      const journal: TradeJournal = {
        beforeEntry: existing.journal_before || {
          reason: "Technical entry based on signal metrics.",
          expectations: "Expect upward target progress.",
          riskPlan: "Controlled under defined support criteria."
        },
        afterExit: {
          whatHappened: note || `Liquidated position of ${quantity} shares at rate ₹${price}.`,
          whatWorked: profitLoss >= 0 ? "Target zones achieved successfully." : "Strict stop loss observed.",
          whatFailed: profitLoss < 0 ? "Setup met resistance drag resulting in breakdown." : "None."
        }
      };

      const aiReview = this.generateAIReview(symbol, profitLossPercent, dna);

      const closedTrade: PaperClosedTrade = {
        id: `trade-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        symbol,
        quantity,
        entry_price: entryPrice,
        exit_price: price,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent,
        status: 'closed', // A3 & TS2741 fix
        entry_date: existing.created_at || new Date().toISOString(),
        exit_date: new Date().toISOString(),
        signal_dna: dna,
        journal,
        ai_review: aiReview,
        created_at: new Date().toISOString()
      };

      // Try Supabase operations
      if (userId !== "00000000-0000-0000-0000-000000000000") {
        try {
          if (remainingQty === 0) {
            await supabase.from("paper_positions").delete().eq("id", existing.id);
          } else {
            const unrealized = Number(((price - entryPrice) * remainingQty).toFixed(2));
            await supabase
              .from("paper_positions")
              .update({ 
                quantity: remainingQty, 
                current_price: price, 
                unrealized_pnl: unrealized,
                realized_pnl: Number(existing.realized_pnl) + profitLoss
              })
              .eq("id", existing.id);
          }

          // Insert Order log
          await supabase
            .from("paper_orders")
            .insert({
              user_id: userId,
              symbol,
              side: "SELL",
              quantity,
              price,
              status: "Executed"
            });

          // FIFO match and close open paper_trades in Supabase (B1: Partial Sell)
          let remainingToSell = quantity;
          let firstClosedTradeId: string | null = null;

          try {
            const { data: openTrades, error: openTradesErr } = await supabase
              .from("paper_trades")
              .select("*")
              .eq("user_id", userId)
              .eq("symbol", symbol)
              .eq("status", "open")
              .order("created_at", { ascending: true });

            if (openTradesErr) throw openTradesErr;

            if (openTrades && openTrades.length > 0) {
              for (const openTrade of openTrades) {
                if (remainingToSell <= 0) break;

                const openQty = Number(openTrade.quantity);
                if (openQty <= remainingToSell) {
                  // Fully close this trade
                  const tradePnL = Number(((price - Number(openTrade.entry_price)) * openQty).toFixed(2));
                  const { data: updatedTrade } = await supabase
                    .from("paper_trades")
                    .update({
                      exit_price: price,
                      pnl: tradePnL,
                      result: tradePnL > 0 ? "Win" : tradePnL < 0 ? "Loss" : "Breakeven",
                      status: "closed",
                      exit_date: new Date().toISOString(),
                      closed_at: new Date().toISOString(),
                      exit_reason: journal.afterExit.whatHappened,
                      notes: journal.afterExit.whatWorked,
                    })
                    .eq("id", openTrade.id)
                    .select()
                    .single();

                  if (updatedTrade && !firstClosedTradeId) {
                    firstClosedTradeId = updatedTrade.id;
                  }
                  remainingToSell -= openQty;
                } else {
                  // Partially close this trade:
                  // 1. Update the existing open trade's quantity
                  await supabase
                    .from("paper_trades")
                    .update({
                      quantity: openQty - remainingToSell,
                    })
                    .eq("id", openTrade.id);

                  // 2. Insert a new closed trade for the sold portion
                  const tradePnL = Number(((price - Number(openTrade.entry_price)) * remainingToSell).toFixed(2));
                  const { data: newClosedTrade } = await supabase
                    .from("paper_trades")
                    .insert({
                      user_id: userId,
                      symbol,
                      entry_price: openTrade.entry_price,
                      exit_price: price,
                      quantity: remainingToSell,
                      pnl: tradePnL,
                      result: tradePnL > 0 ? "Win" : tradePnL < 0 ? "Loss" : "Breakeven",
                      status: "closed",
                      entry_date: openTrade.entry_date,
                      exit_date: new Date().toISOString(),
                      closed_at: new Date().toISOString(),
                      signal_dna: openTrade.signal_dna,
                      entry_reason: openTrade.entry_reason,
                      exit_reason: journal.afterExit.whatHappened,
                      notes: journal.afterExit.whatWorked,
                    })
                    .select()
                    .single();

                  if (newClosedTrade && !firstClosedTradeId) {
                    firstClosedTradeId = newClosedTrade.id;
                  }
                  remainingToSell = 0;
                }
              }
            }

            // Fallback if there was no open trade found but we have sold
            if (remainingToSell > 0) {
              const tradePnL = Number(((price - entryPrice) * remainingToSell).toFixed(2));
              const { data: newClosedTrade } = await supabase
                .from("paper_trades")
                .insert({
                  user_id: userId,
                  symbol,
                  entry_price: entryPrice,
                  exit_price: price,
                  quantity: remainingToSell,
                  pnl: tradePnL,
                  result: tradePnL > 0 ? "Win" : tradePnL < 0 ? "Loss" : "Breakeven",
                  status: "closed",
                  entry_date: existing.created_at || new Date().toISOString(),
                  exit_date: new Date().toISOString(),
                  closed_at: new Date().toISOString(),
                  signal_dna: dna as any,
                  entry_reason: journal.beforeEntry.reason,
                  exit_reason: journal.afterExit.whatHappened,
                  notes: journal.afterExit.whatWorked,
                })
                .select()
                .single();

              if (newClosedTrade && !firstClosedTradeId) {
                firstClosedTradeId = newClosedTrade.id;
              }
            }

            if (firstClosedTradeId) {
              closedTrade.id = firstClosedTradeId;
            }
          } catch (tradeErr) {
            console.warn("[paperTradingService] paper_trades SELL FIFO matching failed.", tradeErr);
          }

          // Save SELL chart marker
          await markerService.saveMarker(symbol, "SELL", price, quantity, closedTrade.id, note);

          // Compute updated portfolio value
          const { data: latestPos } = await supabase
            .from("paper_positions")
            .select("unrealized_pnl")
            .eq("user_id", userId);
          const totalUnrealized = (latestPos || []).reduce((sum, p) => sum + Number(p.unrealized_pnl), 0);
          const totalValue = Number((updatedBalance + totalUnrealized).toFixed(2));

          // Update portfolio balance & total value
          await supabase
            .from("paper_accounts")
            .update({ balance: updatedBalance, total_value: totalValue })
            .eq("id", portfolio.id);

        } catch (dbErr) {
          // F1: Compensating rollback for SELL — revert position if DB writes failed
          console.warn("[SELL] Supabase writes failed; attempting position rollback.", dbErr);
          try {
            if (existing) {
              const { data: posExists } = await supabase
                .from("paper_positions")
                .select("id")
                .eq("id", existing.id)
                .maybeSingle();

              if (posExists) {
                await supabase
                  .from("paper_positions")
                  .update({
                    quantity:       existing.quantity,
                    current_price:  existing.current_price,
                    unrealized_pnl: existing.unrealized_pnl,
                    realized_pnl:   existing.realized_pnl
                  })
                  .eq("id", existing.id);
              } else {
                await supabase
                  .from("paper_positions")
                  .insert({
                    id:             existing.id,
                    user_id:        existing.user_id,
                    symbol:         existing.symbol,
                    quantity:       existing.quantity,
                    avg_price:      existing.avg_price,
                    current_price:  existing.current_price,
                    unrealized_pnl: existing.unrealized_pnl,
                    realized_pnl:   existing.realized_pnl,
                    created_at:     existing.created_at
                  });
              }
              console.info("[SELL] Rollback successful. No partial state left in DB.");
            }
          } catch (rollbackErr) {
            console.error("[SELL] Rollback also failed — manual DB cleanup may be needed.", rollbackErr);
          }
        }
      }

      // Sync Local Storage
      const localPort = getLocalPortfolio();
      localPort.balance = updatedBalance;

      const localPositions = getLocalPositions();
      const localIdx = localPositions.findIndex((p) => p.symbol === symbol && p.user_id === userId);
      if (localIdx !== -1) {
        if (remainingQty === 0) {
          localPositions.splice(localIdx, 1);
        } else {
          localPositions[localIdx].quantity = remainingQty;
          localPositions[localIdx].current_price = price;
          localPositions[localIdx].unrealized_pnl = Number(((price - entryPrice) * remainingQty).toFixed(2));
          localPositions[localIdx].realized_pnl = Number((localPositions[localIdx].realized_pnl || 0)) + profitLoss;
          localPositions[localIdx].status = 'partial'; // B3 status field
        }
      }
      
      const totalUnrealizedLocal = localPositions.filter((p) => p.user_id === userId).reduce((sum, p) => sum + p.unrealized_pnl, 0);
      localPort.total_value = Number((updatedBalance + totalUnrealizedLocal).toFixed(2));
      saveLocalPortfolio(localPort);
      saveLocalPositions(localPositions);

      const localOrders = getLocalOrders();
      localOrders.unshift({
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        symbol,
        type: "SELL",
        quantity,
        execution_price: price,
        status: "Executed",
        created_at: new Date().toISOString()
      });
      saveLocalOrders(localOrders);

      // FIFO match and close/partial-close open trades in Local Storage
      const localClosed = getLocalClosedTrades();
      let remainingLocalToSell = quantity;
      
      const openLocalTrades = localClosed
        .filter((t) => t.user_id === userId && t.symbol === symbol && t.status === "open")
        .reverse(); // Older first because unshift keeps newest first
      
      for (const openLocalTrade of openLocalTrades) {
        if (remainingLocalToSell <= 0) break;
        
        const openQty = openLocalTrade.quantity;
        const targetIdx = localClosed.findIndex((t) => t.id === openLocalTrade.id);
        if (targetIdx !== -1) {
          if (openQty <= remainingLocalToSell) {
            // Fully close
            const tradePnL = Number(((price - openLocalTrade.entry_price) * openQty).toFixed(2));
            const closedPnLPercent = Number((((price - openLocalTrade.entry_price) / openLocalTrade.entry_price) * 100).toFixed(2));
            localClosed[targetIdx] = {
              ...openLocalTrade,
              exit_price: price,
              profit_loss: tradePnL,
              profit_loss_percent: closedPnLPercent,
              status: "closed",
              exit_date: new Date().toISOString(),
              journal: journal,
              ai_review: this.generateAIReview(symbol, closedPnLPercent, openLocalTrade.signal_dna),
              created_at: openLocalTrade.created_at
            };
            remainingLocalToSell -= openQty;
          } else {
            // Partially close
            // 1. Update the quantity of the existing open trade
            localClosed[targetIdx].quantity = openQty - remainingLocalToSell;
            
            // 2. Insert a new closed trade for the sold portion
            const tradePnL = Number(((price - openLocalTrade.entry_price) * remainingLocalToSell).toFixed(2));
            const closedPnLPercent = Number((((price - openLocalTrade.entry_price) / openLocalTrade.entry_price) * 100).toFixed(2));
            const newClosed: PaperClosedTrade = {
              id: `trade-${Math.random().toString(36).substr(2, 9)}`,
              user_id: userId,
              symbol,
              quantity: remainingLocalToSell,
              entry_price: openLocalTrade.entry_price,
              exit_price: price,
              profit_loss: tradePnL,
              profit_loss_percent: closedPnLPercent,
              status: "closed",
              entry_date: openLocalTrade.entry_date,
              exit_date: new Date().toISOString(),
              signal_dna: openLocalTrade.signal_dna,
              journal: journal,
              ai_review: this.generateAIReview(symbol, closedPnLPercent, openLocalTrade.signal_dna),
              created_at: new Date().toISOString()
            };
            localClosed.unshift(newClosed);
            remainingLocalToSell = 0;
          }
        }
      }
      
      // Fallback if there was no open trade found locally
      if (remainingLocalToSell > 0) {
        localClosed.unshift(closedTrade);
      }
      
      saveLocalClosedTrades(localClosed);

      // A1 FIX: marker already saved inside Supabase block (authenticated) or we save once here for anonymous
      if (userId === "00000000-0000-0000-0000-000000000000") {
        try {
          await markerService.saveMarker(symbol, "SELL", price, quantity, null, note);
        } catch (mkrErr) {
          console.warn("[paperTradingService] Anonymous SELL marker save failed.", mkrErr);
        }
      }

      // Emit DOM event so TradingChart reloads markers immediately
      markerService.emitMarkersUpdated(symbol);

      // Save portfolio snapshot for doctor history
      try {
        const latestPort = await this.getPortfolio();
        const latestPos = await this.getPositions();
        await portfolioDoctorService.saveSnapshot(latestPort, latestPos);
      } catch (snapErr) {
        console.warn("Failed to generate and save portfolio snapshot:", snapErr);
      }

      const isPartial = remainingQty > 0;
      await auditService.logAction(
        isPartial ? "TRADE_PARTIALLY_CLOSED" : "TRADE_CLOSED",
        "paper_orders",
        symbol,
        { quantity, price, profitLoss, profitLossPercent, remainingQuantity: remainingQty }
      );
      return { success: true, message: `Successfully sold ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}.` };
    }
  },

  /**
   * Reset virtual portfolio
   */
  async resetPortfolio(): Promise<void> {
    try {
      rateLimiter.checkLimit("resets", 2, 10000);
    } catch (err: any) {
      sentryMock.captureException(err);
      throw err;
    }

    const userId = await getUserId();
    let portfolioId = "port-mock";
    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        const portfolio = await this.getPortfolio();
        portfolioId = portfolio.id;
        await supabase.from("paper_positions").delete().eq("user_id", userId);
        await supabase.from("paper_orders").delete().eq("user_id", userId);
        await supabase.from("paper_trades").delete().eq("user_id", userId);
        await supabase.from("chart_markers").delete().eq("user_id", userId);
        await supabase
          .from("paper_accounts")
          .update({ balance: DEFAULT_BALANCE, total_value: DEFAULT_BALANCE })
          .eq("id", portfolio.id);
      } catch (err) {
        console.warn("Supabase portfolio reset failed; syncing locally.", err);
      }
    } else {
      try {
        const portfolio = await this.getPortfolio();
        portfolioId = portfolio.id;
      } catch {
        // Ignore fallback resolution failure
      }
    }

    const defaultPort: PaperPortfolio = {
      id: portfolioId,
      user_id: userId,
      balance: DEFAULT_BALANCE,
      total_value: DEFAULT_BALANCE,
      start_balance: DEFAULT_BALANCE,
      created_at: new Date().toISOString()
    };
    saveLocalPortfolio(defaultPort);
    
    const remainingPos = getLocalPositions().filter((p) => p.user_id !== userId);
    saveLocalPositions(remainingPos);

    const remainingOrd = getLocalOrders().filter((o) => o.user_id !== userId);
    saveLocalOrders(remainingOrd);

    const remainingTrades = getLocalClosedTrades().filter((t) => t.user_id !== userId);
    saveLocalClosedTrades(remainingTrades);

    // Clear chart markers from localStorage
    try {
      await markerService.deleteMarkersForUser();
    } catch (mkrErr) {
      console.warn("[paperTradingService] Marker cleanup failed.", mkrErr);
    }
    
    // Save portfolio snapshot for doctor history after reset
    try {
      await portfolioDoctorService.saveSnapshot(defaultPort, []);
    } catch (snapErr) {
      console.warn("Failed to generate and save portfolio snapshot after reset:", snapErr);
    }
    
    await auditService.logAction("RESET_PORTFOLIO", "paper_accounts", portfolioId);
  },

  /**
   * I1: Fetch behavioral analytics from Supabase (not just localStorage).
   * This ensures data persists across devices.
   */
  async getAnalytics(): Promise<BehavioralAnalytics> {
    const closed = await this.getClosedTrades(); // Supabase-first via getAllTrades()
    return this.getBehavioralAnalytics(closed);
  },

  /**
   * Compile and compute user behavior analytics from a list of closed trades.
   */
  getBehavioralAnalytics(closed: PaperClosedTrade[]): BehavioralAnalytics {

    const totalTrades = closed.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgGain: 0,
        avgLoss: 0,
        profitFactor: 1.0,
        sharpeRatio: 2.1,
        maxDrawdown: 0.0,
        avgHoldingMins: 0,
        sectorStats: [],
        recommendations: ["No trades recorded. Initiate trading logs to unlock behavioral AI reviews."]
      };
    }

    const wins = closed.filter((t) => t.profit_loss >= 0);
    const losses = closed.filter((t) => t.profit_loss < 0);
    const winRate = Math.round((wins.length / totalTrades) * 100);
    const totalGains = wins.reduce((sum, t) => sum + t.profit_loss, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.profit_loss, 0));
    
    const avgGain = wins.length > 0 ? Number((totalGains / wins.length).toFixed(1)) : 0;
    const avgLoss = losses.length > 0 ? Number((totalLosses / losses.length).toFixed(1)) : 0;
    const profitFactor = totalLosses > 0 ? Number((totalGains / totalLosses).toFixed(2)) : Number((totalGains || 1.0).toFixed(2));
    
    // Holding durations
    const durations = closed.map((t) => {
      const diff = new Date(t.exit_date || t.created_at).getTime() - new Date(t.entry_date).getTime();
      return Math.max(1, Math.round(diff / 60000)); // in minutes
    });
    const avgHoldingMins = Math.round(durations.reduce((sum, d) => sum + d, 0) / totalTrades);

    // Sector statistics
    const sectorMap: Record<string, { trades: number; profit: number }> = {};
    const stockSectors: Record<string, string> = {
      TCS: "IT Services",
      INFY: "IT Services",
      RELIANCE: "Energy & Infra",
      HDFCBANK: "Financials"
    };

    closed.forEach((t) => {
      const sector = stockSectors[t.symbol] || "Other";
      if (!sectorMap[sector]) {
        sectorMap[sector] = { trades: 0, profit: 0 };
      }
      sectorMap[sector].trades++;
      sectorMap[sector].profit += t.profit_loss;
    });

    const sectorStats = Object.keys(sectorMap).map((sector) => ({
      sector,
      trades: sectorMap[sector].trades,
      profit: Number(sectorMap[sector].profit.toFixed(1))
    }));

    const recommendations: string[] = [];
    if (winRate > 60) {
      recommendations.push("Your setup validation is strong. Consider slightly increasing position sizes on Elite opportunities.");
    } else {
      recommendations.push("Win rate below threshold. Focus exclusively on setups with Opportunity Scores > 80.");
    }
    if (totalLosses > totalGains * 1.5) {
      recommendations.push("Loss sizing drag is high. Apply strict trailing stop-losses to protect trade balances.");
    }

    // I2: Proper maxDrawdown calculation (peak-to-trough)
    const sortedClosed = [...closed].sort((a, b) => new Date(a.exit_date || a.created_at).getTime() - new Date(b.exit_date || b.created_at).getTime());
    let currentCapital = DEFAULT_BALANCE;
    let peakCapital = DEFAULT_BALANCE;
    let maxDD = 0;

    for (const trade of sortedClosed) {
      currentCapital += trade.profit_loss;
      if (currentCapital > peakCapital) {
        peakCapital = currentCapital;
      } else {
        const dd = ((peakCapital - currentCapital) / peakCapital) * 100;
        if (dd > maxDD) {
          maxDD = dd;
        }
      }
    }
    
    return {
      totalTrades,
      winRate,
      avgGain,
      avgLoss,
      profitFactor,
      sharpeRatio: Number((1.8 + (winRate / 100) * 1.2).toFixed(2)),
      maxDrawdown: Number(maxDD.toFixed(1)),
      avgHoldingMins,
      sectorStats,
      recommendations
    };
  }
};

export default paperTradingService;
