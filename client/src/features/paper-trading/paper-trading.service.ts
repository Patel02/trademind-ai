import { supabase } from "../../services/supabase";
import { signalsService } from "../signals/signals.service";

export interface PaperPortfolio {
  id: string;
  user_id: string;
  balance: number;
  start_balance: number;
  created_at: string;
  updated_at: string;
}

export interface SignalDNASnapshot {
  opportunityScore: number;
  timingScore: number;
  riskScore: number;
  confidenceScore: number;
  marketRegime: string;
  sectorStrength: number;
  newsScore: number;
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
  avg_entry_price: number;
  current_price: number;
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
  type: "BUY" | "SELL";
  quantity: number;
  execution_price: number;
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
  profit_loss: number;
  profit_loss_percent: number;
  entry_date: string;
  exit_date: string;
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

// Local storage helpers
const getLocalPortfolio = (): PaperPortfolio => {
  const stored = localStorage.getItem("trademind_paper_portfolio");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  const defaultPort: PaperPortfolio = {
    id: "port-mock",
    user_id: "mock-user-id",
    balance: DEFAULT_BALANCE,
    start_balance: DEFAULT_BALANCE,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem("trademind_paper_portfolio", JSON.stringify(defaultPort));
  return defaultPort;
};

const saveLocalPortfolio = (portfolio: PaperPortfolio) => {
  localStorage.setItem("trademind_paper_portfolio", JSON.stringify(portfolio));
};

const getLocalPositions = (): PaperPosition[] => {
  const stored = localStorage.getItem("trademind_paper_positions");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  localStorage.setItem("trademind_paper_positions", JSON.stringify([]));
  return [];
};

const saveLocalPositions = (positions: PaperPosition[]) => {
  localStorage.setItem("trademind_paper_positions", JSON.stringify(positions));
};

const getLocalOrders = (): PaperOrder[] => {
  const stored = localStorage.getItem("trademind_paper_orders");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  localStorage.setItem("trademind_paper_orders", JSON.stringify([]));
  return [];
};

const saveLocalOrders = (orders: PaperOrder[]) => {
  localStorage.setItem("trademind_paper_orders", JSON.stringify(orders));
};

const getLocalClosedTrades = (): PaperClosedTrade[] => {
  const stored = localStorage.getItem("trademind_paper_closed_trades");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  localStorage.setItem("trademind_paper_closed_trades", JSON.stringify([]));
  return [];
};

const saveLocalClosedTrades = (closed: PaperClosedTrade[]) => {
  localStorage.setItem("trademind_paper_closed_trades", JSON.stringify(closed));
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
   * Get virtual portfolio details
   */
  async getPortfolio(): Promise<PaperPortfolio> {
    try {
      const { data, error } = await supabase
        .from("paper_portfolios")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) return data as PaperPortfolio;
    } catch (err) {
      console.warn("Supabase paper_portfolios fetch failed; using local storage.", err);
    }
    return getLocalPortfolio();
  },

  /**
   * Get open positions. Automatically updates the positions' current price.
   */
  async getPositions(): Promise<PaperPosition[]> {
    let positions: PaperPosition[] = [];
    try {
      const { data, error } = await supabase
        .from("paper_positions")
        .select("*");

      if (error) throw error;
      if (data) positions = data as PaperPosition[];
    } catch (err) {
      console.warn("Supabase paper_positions fetch failed; using local storage.", err);
      positions = getLocalPositions();
    }

    // Hydrate current price for positions dynamically
    const updated = await Promise.all(
      positions.map(async (pos) => {
        const price = await this.getStockPrice(pos.symbol);
        return {
          ...pos,
          current_price: price
        };
      })
    );

    saveLocalPositions(updated);
    return updated;
  },

  /**
   * Get transaction orders journal
   */
  async getOrders(): Promise<PaperOrder[]> {
    try {
      const { data, error } = await supabase
        .from("paper_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) return data as PaperOrder[];
    } catch (err) {
      console.warn("Supabase paper_orders fetch failed; using local storage.", err);
    }
    return getLocalOrders();
  },

  /**
   * Fetch closed trades history
   */
  async getClosedTrades(): Promise<PaperClosedTrade[]> {
    try {
      const { data, error } = await supabase
        .from("paper_closed_trades")
        .select("*")
        .order("exit_date", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) return data as PaperClosedTrade[];
    } catch (err) {
      console.warn("Supabase paper_closed_trades fetch failed; using local storage.", err);
    }
    return getLocalClosedTrades();
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
          .from("paper_closed_trades")
          .update({ journal: closed[idx].journal })
          .eq("id", tradeId);
      } catch (err) {
        console.warn("Supabase journal update failed; saved locally.", err);
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
    
    // Calculate AI Score (Base 6, adjusts up for profits, entry support alignment, etc.)
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

    return {
      score,
      analysis,
      strengths,
      weaknesses,
      lessons
    };
  },

  /**
   * Execute BUY or SELL order simulation
   */
  async placeOrder(symbol: string, type: "BUY" | "SELL", quantity: number): Promise<{ success: boolean; message: string }> {
    if (quantity <= 0) {
      return { success: false, message: "Quantity must be greater than zero." };
    }

    const price = await this.getStockPrice(symbol);
    const totalCost = price * quantity;

    // Fetch current portfolio
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
        newsScore: 75
      };

      try {
        const activeSigs = await signalsService.getSignals();
        const match = activeSigs.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
        const regimeObj = await signalsService.getMarketRegime();
        
        if (match) {
          dna = {
            opportunityScore: match.score,
            timingScore: match.trade_readiness,
            riskScore: match.risk === "High" ? 70 : match.risk === "Medium" ? 45 : 25,
            confidenceScore: match.confidence,
            marketRegime: regimeObj.regime,
            sectorStrength: symbol === "TCS" || symbol === "INFY" ? 92 : symbol === "RELIANCE" ? 82 : 78,
            newsScore: match.score > 80 ? 85 : 70
          };
        }
      } catch {
        // Fall back to default
      }

      const journalBefore = {
        reason: `Technical breakout entry targeting support level parameters for ${symbol}.`,
        expectations: "Expecting price stabilization and progression towards target 1 and target 2.",
        riskPlan: "Establish strict trailing stop-losses to contain negative volatility drag."
      };

      // Try Supabase operations
      try {
        const { error: portErr } = await supabase
          .from("paper_portfolios")
          .update({ balance: updatedBalance, updated_at: new Date().toISOString() })
          .eq("id", portfolio.id);

        if (portErr) throw portErr;

        const existing = positions.find((p) => p.symbol === symbol);
        if (existing) {
          const newQty = existing.quantity + quantity;
          const newAvgPrice = Number(((existing.quantity * existing.avg_entry_price + totalCost) / newQty).toFixed(2));
          await supabase
            .from("paper_positions")
            .update({ 
              quantity: newQty, 
              avg_entry_price: newAvgPrice, 
              current_price: price, 
              updated_at: new Date().toISOString(),
              entry_date: existing.entry_date || new Date().toISOString(),
              signal_dna: dna as any,
              journal_before: journalBefore as any
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("paper_positions")
            .insert({
              symbol,
              quantity,
              avg_entry_price: price,
              current_price: price,
              entry_date: new Date().toISOString(),
              signal_dna: dna as any,
              journal_before: journalBefore as any
            });
        }

        await supabase
          .from("paper_orders")
          .insert({
            symbol,
            type: "BUY",
            quantity,
            execution_price: price
          });

      } catch (dbErr) {
        console.warn("Supabase transactions failed; falling back to local database synchronization.", dbErr);
      }

      // Sync Local Storage
      const localPort = getLocalPortfolio();
      localPort.balance = updatedBalance;
      localPort.updated_at = new Date().toISOString();
      saveLocalPortfolio(localPort);

      const localPositions = getLocalPositions();
      const localIdx = localPositions.findIndex((p) => p.symbol === symbol);
      if (localIdx !== -1) {
        const existing = localPositions[localIdx];
        const newQty = existing.quantity + quantity;
        existing.avg_entry_price = Number(((existing.quantity * existing.avg_entry_price + totalCost) / newQty).toFixed(2));
        existing.quantity = newQty;
        existing.current_price = price;
        existing.updated_at = new Date().toISOString();
        if (!existing.signal_dna) existing.signal_dna = dna;
        if (!existing.journal_before) existing.journal_before = journalBefore;
      } else {
        localPositions.push({
          id: `pos-${Math.random().toString(36).substr(2, 9)}`,
          user_id: "mock-user-id",
          symbol,
          quantity,
          avg_entry_price: price,
          current_price: price,
          updated_at: new Date().toISOString(),
          entry_date: new Date().toISOString(),
          signal_dna: dna,
          journal_before: journalBefore
        });
      }
      saveLocalPositions(localPositions);

      const localOrders = getLocalOrders();
      localOrders.unshift({
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        user_id: "mock-user-id",
        symbol,
        type: "BUY",
        quantity,
        execution_price: price,
        status: "Executed",
        created_at: new Date().toISOString()
      });
      saveLocalOrders(localOrders);

      return { success: true, message: `Successfully bought ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}.` };

    } else {
      // SELL Transaction
      const existing = positions.find((p) => p.symbol === symbol);
      if (!existing || existing.quantity < quantity) {
        return {
          success: false,
          message: `Insufficient holdings. You own ${existing ? existing.quantity : 0} shares of ${symbol}, requested to sell ${quantity}`
        };
      }

      const updatedBalance = Number((portfolio.balance + totalCost).toFixed(2));
      const remainingQty = existing.quantity - quantity;

      // Extract details for Closed Trade records
      const entryDate = existing.entry_date || new Date(Date.now() - 3600000).toISOString(); // Default 1 hour ago
      const entryPrice = existing.avg_entry_price;
      const profitLoss = Number(((price - entryPrice) * quantity).toFixed(2));
      const profitLossPercent = Number((((price - entryPrice) / entryPrice) * 100).toFixed(2));
      
      const dna = existing.signal_dna || {
        opportunityScore: 75,
        timingScore: 70,
        riskScore: 35,
        confidenceScore: 80,
        marketRegime: "Bull Market",
        sectorStrength: 80,
        newsScore: 75
      };

      const journal: TradeJournal = {
        beforeEntry: existing.journal_before || {
          reason: "Technical entry based on signal metrics.",
          expectations: "Expect normal upward target progress.",
          riskPlan: "Controlled under defined support criteria."
        },
        afterExit: {
          whatHappened: `Liquidated position of ${quantity} shares at rate ₹${price}.`,
          whatWorked: profitLoss >= 0 ? "Target zones achieved successfully." : "Strict stop loss observed.",
          whatFailed: profitLoss < 0 ? "Setup met resistance drag resulting in breakdown." : "None."
        }
      };

      const aiReview = this.generateAIReview(symbol, profitLossPercent, dna);

      const closedTrade: PaperClosedTrade = {
        id: `trade-${Math.random().toString(36).substr(2, 9)}`,
        user_id: portfolio.user_id,
        symbol,
        quantity,
        entry_price: entryPrice,
        exit_price: price,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent,
        entry_date: entryDate,
        exit_date: new Date().toISOString(),
        signal_dna: dna,
        journal,
        ai_review: aiReview,
        created_at: new Date().toISOString()
      };

      // Try Supabase operations
      try {
        await supabase
          .from("paper_portfolios")
          .update({ balance: updatedBalance, updated_at: new Date().toISOString() })
          .eq("id", portfolio.id);

        if (remainingQty === 0) {
          await supabase.from("paper_positions").delete().eq("id", existing.id);
        } else {
          await supabase
            .from("paper_positions")
            .update({ quantity: remainingQty, current_price: price, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        }

        await supabase
          .from("paper_orders")
          .insert({
            symbol,
            type: "SELL",
            quantity,
            execution_price: price
          });

        await supabase
          .from("paper_closed_trades")
          .insert({
            symbol,
            quantity,
            entry_price: entryPrice,
            exit_price: price,
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent,
            entry_date: entryDate,
            exit_date: new Date().toISOString(),
            signal_dna: dna,
            journal,
            ai_review: aiReview
          });

      } catch (dbErr) {
        console.warn("Supabase transactions failed; falling back to local database synchronization.", dbErr);
      }

      // Sync Local Storage
      const localPort = getLocalPortfolio();
      localPort.balance = updatedBalance;
      localPort.updated_at = new Date().toISOString();
      saveLocalPortfolio(localPort);

      const localPositions = getLocalPositions();
      const localIdx = localPositions.findIndex((p) => p.symbol === symbol);
      if (localIdx !== -1) {
        if (remainingQty === 0) {
          localPositions.splice(localIdx, 1);
        } else {
          localPositions[localIdx].quantity = remainingQty;
          localPositions[localIdx].current_price = price;
          localPositions[localIdx].updated_at = new Date().toISOString();
        }
      }
      saveLocalPositions(localPositions);

      const localOrders = getLocalOrders();
      localOrders.unshift({
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        user_id: "mock-user-id",
        symbol,
        type: "SELL",
        quantity,
        execution_price: price,
        status: "Executed",
        created_at: new Date().toISOString()
      });
      saveLocalOrders(localOrders);

      // Save to closed trades
      const localClosed = getLocalClosedTrades();
      localClosed.unshift(closedTrade);
      saveLocalClosedTrades(localClosed);

      return { success: true, message: `Successfully sold ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}.` };
    }
  },

  /**
   * Reset virtual portfolio
   */
  async resetPortfolio(): Promise<void> {
    try {
      const portfolio = await this.getPortfolio();
      await supabase.from("paper_positions").delete().eq("user_id", portfolio.user_id);
      await supabase.from("paper_orders").delete().eq("user_id", portfolio.user_id);
      await supabase.from("paper_closed_trades").delete().eq("user_id", portfolio.user_id);
      await supabase
        .from("paper_portfolios")
        .update({ balance: DEFAULT_BALANCE, updated_at: new Date().toISOString() })
        .eq("id", portfolio.id);
    } catch (err) {
      console.warn("Supabase portfolio reset failed; syncing locally.", err);
    }

    const defaultPort: PaperPortfolio = {
      id: "port-mock",
      user_id: "mock-user-id",
      balance: DEFAULT_BALANCE,
      start_balance: DEFAULT_BALANCE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveLocalPortfolio(defaultPort);
    saveLocalPositions([]);
    saveLocalOrders([]);
    saveLocalClosedTrades([]);
  },

  /**
   * Compile and compute user behavior analytics
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
      const diff = new Date(t.exit_date).getTime() - new Date(t.entry_date).getTime();
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

    // Recommendations list compiled from performance
    const recommendations: string[] = [];
    if (winRate > 60) {
      recommendations.push("Your setup validation conforms to high-win criteria. Continue deploying current size limits.");
    } else {
      recommendations.push("Averaging under 50% win rate. Re-assess entry timing filters and avoid buying breakout extensions.");
    }

    const itStats = sectorStats.find((s) => s.sector === "IT Services");
    if (itStats && itStats.profit < 0) {
      recommendations.push("Systematic drawdowns located in IT Services trades. Reduce sector concentration to stabilize NAV.");
    } else if (itStats && itStats.profit > 0) {
      recommendations.push("IT Services setups show superior alpha. Capitalize on opportunities within IT sector bounces.");
    }

    if (avgHoldingMins > 1440) {
      recommendations.push("Longer holding periods (>1 day) are showing higher profit yield factor. Shift focus to swing trades.");
    } else {
      recommendations.push("Intraday exits are capping returns. Allow high-scoring setups to mature across 2-4 sessions.");
    }

    return {
      totalTrades,
      winRate,
      avgGain,
      avgLoss,
      profitFactor,
      sharpeRatio: winRate > 60 ? 2.85 : 1.75,
      maxDrawdown: Number((totalLosses > 0 ? (totalLosses / 1000000) * 100 : 0.0).toFixed(2)),
      avgHoldingMins,
      sectorStats,
      recommendations
    };
  }
};

export default paperTradingService;
