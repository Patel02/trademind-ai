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

export interface PaperPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_entry_price: number;
  current_price: number;
  updated_at: string;
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

export const paperTradingService = {
  /**
   * Helper to resolve the latest market price of a stock.
   * Pulls from live active signals in signalsService or defaults.
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

    // Save updated prices to local storage if running in fallback mode
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
   * Execute BUY or SELL order simulation
   */
  async placeOrder(symbol: string, type: "BUY" | "SELL", quantity: number): Promise<{ success: boolean; message: string }> {
    if (quantity <= 0) {
      return { success: false, message: "Quantity must be greater than zero." };
    }

    const price = await this.getStockPrice(symbol);
    const totalCost = price * quantity;

    // 1. Fetch current portfolio
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

      // Try Supabase operations
      try {
        // Update portfolio balance
        const { error: portErr } = await supabase
          .from("paper_portfolios")
          .update({ balance: updatedBalance, updated_at: new Date().toISOString() })
          .eq("id", portfolio.id);

        if (portErr) throw portErr;

        // Update positions table
        const existing = positions.find((p) => p.symbol === symbol);
        if (existing) {
          const newQty = existing.quantity + quantity;
          const newAvgPrice = Number(((existing.quantity * existing.avg_entry_price + totalCost) / newQty).toFixed(2));
          const { error: posErr } = await supabase
            .from("paper_positions")
            .update({ quantity: newQty, avg_entry_price: newAvgPrice, current_price: price, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (posErr) throw posErr;
        } else {
          const { error: posErr } = await supabase
            .from("paper_positions")
            .insert({
              symbol,
              quantity,
              avg_entry_price: price,
              current_price: price
            });
          if (posErr) throw posErr;
        }

        // Insert order log
        const { error: ordErr } = await supabase
          .from("paper_orders")
          .insert({
            symbol,
            type: "BUY",
            quantity,
            execution_price: price
          });
        if (ordErr) throw ordErr;

        // Insert admin audit trail log
        await supabase.from("audit_logs").insert({
          action: "PAPER_BUY",
          target_table: "paper_orders",
          target_id: symbol,
          details: `Executed virtual BUY of ${quantity} shares of ${symbol} at ₹${price}`
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
      } else {
        localPositions.push({
          id: `pos-${Math.random().toString(36).substr(2, 9)}`,
          user_id: "mock-user-id",
          symbol,
          quantity,
          avg_entry_price: price,
          current_price: price,
          updated_at: new Date().toISOString()
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

      // Save local audit
      const localAudits = JSON.parse(localStorage.getItem("trademind_audit_logs") || "[]");
      localAudits.unshift({
        id: `aud-${Math.random().toString(36).substr(2, 9)}`,
        admin_id: "Mock User",
        action: "PAPER_BUY",
        target_table: "paper_orders",
        target_id: symbol,
        details: `Executed virtual BUY of ${quantity} shares of ${symbol} at ₹${price}`,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("trademind_audit_logs", JSON.stringify(localAudits));

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

      // Try Supabase operations
      try {
        // Update portfolio balance
        const { error: portErr } = await supabase
          .from("paper_portfolios")
          .update({ balance: updatedBalance, updated_at: new Date().toISOString() })
          .eq("id", portfolio.id);

        if (portErr) throw portErr;

        // Update positions table
        if (remainingQty === 0) {
          const { error: posErr } = await supabase
            .from("paper_positions")
            .delete()
            .eq("id", existing.id);
          if (posErr) throw posErr;
        } else {
          const { error: posErr } = await supabase
            .from("paper_positions")
            .update({ quantity: remainingQty, current_price: price, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (posErr) throw posErr;
        }

        // Insert order log
        const { error: ordErr } = await supabase
          .from("paper_orders")
          .insert({
            symbol,
            type: "SELL",
            quantity,
            execution_price: price
          });
        if (ordErr) throw ordErr;

        // Insert audit
        await supabase.from("audit_logs").insert({
          action: "PAPER_SELL",
          target_table: "paper_orders",
          target_id: symbol,
          details: `Executed virtual SELL of ${quantity} shares of ${symbol} at ₹${price}`
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

      // Save local audit
      const localAudits = JSON.parse(localStorage.getItem("trademind_audit_logs") || "[]");
      localAudits.unshift({
        id: `aud-${Math.random().toString(36).substr(2, 9)}`,
        admin_id: "Mock User",
        action: "PAPER_SELL",
        target_table: "paper_orders",
        target_id: symbol,
        details: `Executed virtual SELL of ${quantity} shares of ${symbol} at ₹${price}`,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("trademind_audit_logs", JSON.stringify(localAudits));

      return { success: true, message: `Successfully sold ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}.` };
    }
  },

  /**
   * Reset virtual portfolio to starting balance and wipe transactions
   */
  async resetPortfolio(): Promise<void> {
    try {
      const portfolio = await this.getPortfolio();
      
      // Wipe positions
      await supabase.from("paper_positions").delete().eq("user_id", portfolio.user_id);
      
      // Wipe orders
      await supabase.from("paper_orders").delete().eq("user_id", portfolio.user_id);

      // Reset balance
      await supabase
        .from("paper_portfolios")
        .update({ balance: DEFAULT_BALANCE, updated_at: new Date().toISOString() })
        .eq("id", portfolio.id);

      // Log reset
      await supabase.from("audit_logs").insert({
        action: "RESET_PORTFOLIO",
        target_table: "paper_portfolios",
        target_id: portfolio.id,
        details: "Reset virtual paper trading portfolio balance to ₹1,000,000"
      });

    } catch (err) {
      console.warn("Supabase portfolio reset failed; syncing locally.", err);
    }

    // Sync Local
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

    // Save local audit reset
    const localAudits = JSON.parse(localStorage.getItem("trademind_audit_logs") || "[]");
    localAudits.unshift({
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      admin_id: "Mock User",
      action: "RESET_PORTFOLIO",
      target_table: "paper_portfolios",
      target_id: "port-mock",
      details: "Reset virtual paper trading portfolio balance to ₹1,000,000",
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("trademind_audit_logs", JSON.stringify(localAudits));
  }
};

export default paperTradingService;
