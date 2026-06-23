import React, { useEffect, useState, useCallback } from "react";
import { Briefcase, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, XCircle, Loader2 } from "lucide-react";
import { paperTradingService, type PaperPortfolio, type PaperPosition } from "../../features/paper-trading/paper-trading.service";
import Card from "../../components/ui/Card";

export const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof paperTradingService.getPortfolioMetrics>> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sellLoading, setSellLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await paperTradingService.refreshPortfolioValue(); // C1: refresh values first
      const [portData, posData, metricsData] = await Promise.all([
        paperTradingService.getPortfolio(),
        paperTradingService.getPositions(),
        paperTradingService.getPortfolioMetrics() // C2: fetch metrics
      ]);
      setPortfolio(portData);
      setPositions(posData);
      setMetrics(metricsData);
    } catch (err) {
      console.error("Error loading portfolio data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // C1: 60-second auto-refresh interval
    const interval = setInterval(async () => {
      try {
        await paperTradingService.refreshPortfolioValue();
        const [portData, posData, metricsData] = await Promise.all([
          paperTradingService.getPortfolio(),
          paperTradingService.getPositions(),
          paperTradingService.getPortfolioMetrics()
        ]);
        setPortfolio(portData);
        setPositions(posData);
        setMetrics(metricsData);
      } catch (err) {
        console.warn("Silent portfolio auto-refresh failed:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleClosePosition = async (symbol: string, quantity: number) => {
    if (!window.confirm(`Are you sure you want to close your entire position of ${quantity} shares in ${symbol}?`)) {
      return;
    }
    setSellLoading(symbol);
    setMessage(null);
    try {
      const result = await paperTradingService.placeOrder(symbol, "SELL", quantity);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        await loadData();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to close position." });
    } finally {
      setSellLoading(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to RESET your virtual portfolio? This will delete all open positions, orders, and closed trade logs.")) {
      return;
    }
    setLoading(true);
    try {
      await paperTradingService.resetPortfolio();
      setMessage({ type: "success", text: "Portfolio reset successfully." });
      await loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to reset portfolio." });
    } finally {
      setLoading(false);
    }
  };

  // Calculations (C2: Rich metrics calculation)
  const startBalance = portfolio?.start_balance ?? 1000000.00;
  const currentTotalVal = metrics?.totalPortfolioValue ?? portfolio?.total_value ?? startBalance;
  const balance = metrics?.cashBalance ?? portfolio?.balance ?? startBalance;
  
  const totalUnrealizedPnL = metrics?.unrealizedPnL ?? positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);
  const realizedPnL = metrics?.realizedPnL ?? 0;
  const totalReturnAmt = currentTotalVal - startBalance;
  const totalReturnPct = metrics?.totalReturnPct ?? (totalReturnAmt / startBalance) * 100;

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", color: "var(--text-primary)" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>Portfolio Dashboard</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Track virtual assets, cash holdings, and unrealized returns
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
            Refresh
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.05)",
              color: "var(--accent-red)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <XCircle size={14} />
            Reset Capital
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            background: message.type === "success" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
            color: message.type === "success" ? "var(--accent-green)" : "var(--accent-red)",
            fontSize: "13px"
          }}
        >
          {message.text}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {/* Metric 1: Portfolio Value */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>Portfolio Value</span>
            <h3 style={{ fontSize: "24px", fontWeight: "800", margin: "8px 0 0", fontFamily: "monospace" }}>
              ₹{currentTotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(170,59,255,0.08)" }}>
            <Briefcase size={20} style={{ color: "var(--accent-purple)" }} />
          </div>
        </div>

        {/* Metric 2: Cash Balance */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>Cash Balance</span>
            <h3 style={{ fontSize: "24px", fontWeight: "800", margin: "8px 0 0", fontFamily: "monospace" }}>
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(16,185,129,0.08)" }}>
            <Wallet size={20} style={{ color: "var(--accent-green)" }} />
          </div>
        </div>

        {/* Metric 3: Unrealized Return */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>Unrealized Return</span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "800",
                margin: "8px 0 0",
                fontFamily: "monospace",
                color: totalUnrealizedPnL >= 0 ? "var(--accent-green)" : "var(--accent-red)"
              }}
            >
              {totalUnrealizedPnL >= 0 ? "+" : ""}
              ₹{totalUnrealizedPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={{ padding: "10px", borderRadius: "8px", background: totalUnrealizedPnL >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" }}>
            {totalUnrealizedPnL >= 0 ? <ArrowUpRight size={20} color="var(--accent-green)" /> : <ArrowDownRight size={20} color="var(--accent-red)" />}
          </div>
        </div>

        {/* Metric 4: Realized Return */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>Realized Return</span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "800",
                margin: "8px 0 0",
                fontFamily: "monospace",
                color: realizedPnL >= 0 ? "var(--accent-green)" : "var(--accent-red)"
              }}
            >
              {realizedPnL >= 0 ? "+" : ""}
              ₹{realizedPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={{ padding: "10px", borderRadius: "8px", background: realizedPnL >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" }}>
            {realizedPnL >= 0 ? <ArrowUpRight size={20} color="var(--accent-green)" /> : <ArrowDownRight size={20} color="var(--accent-red)" />}
          </div>
        </div>

        {/* Metric 5: Total Return */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>Total Return</span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "800",
                margin: "8px 0 0",
                fontFamily: "monospace",
                color: totalReturnAmt >= 0 ? "var(--accent-green)" : "var(--accent-red)"
              }}
            >
              {totalReturnAmt >= 0 ? "+" : ""}{totalReturnPct.toFixed(2)}%
            </h3>
          </div>
          <div style={{ padding: "10px", borderRadius: "8px", background: totalReturnAmt >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" }}>
            {totalReturnAmt >= 0 ? <ArrowUpRight size={20} color="var(--accent-green)" /> : <ArrowDownRight size={20} color="var(--accent-red)" />}
          </div>
        </div>
      </div>

      {/* Position Table Card */}
      <Card title="Open Positions" subtitle="Active holdings currently valuation tracking">
        {loading ? (
          <div style={{ padding: "40px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
            <Loader2 className="spin-animation" style={{ color: "var(--accent-purple)" }} />
            <span>Loading positions...</span>
          </div>
        ) : positions.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
            No open positions. Use the Trade Workspace to purchase assets.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontWeight: "600" }}>
                  <th style={{ padding: "12px 8px" }}>Symbol</th>
                  <th style={{ padding: "12px 8px" }}>Quantity</th>
                  <th style={{ padding: "12px 8px" }}>Avg Cost</th>
                  <th style={{ padding: "12px 8px" }}>Market Price</th>
                  <th style={{ padding: "12px 8px" }}>Unrealized Return</th>
                  <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const pnl = pos.unrealized_pnl;
                  const cost = pos.quantity * pos.avg_price;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                  const isPositive = pnl >= 0;

                  return (
                    <tr key={pos.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} className="hover-row">
                      <td style={{ padding: "16px 8px", fontWeight: "700" }}>{pos.symbol}</td>
                      <td style={{ padding: "16px 8px", fontFamily: "monospace" }}>{pos.quantity}</td>
                      <td style={{ padding: "16px 8px", fontFamily: "monospace" }}>₹{pos.avg_price.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</td>
                      <td style={{ padding: "16px 8px", fontFamily: "monospace" }}>₹{pos.current_price.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</td>
                      <td style={{ padding: "16px 8px", fontFamily: "monospace", color: isPositive ? "var(--accent-green)" : "var(--accent-red)", fontWeight: "600" }}>
                        {isPositive ? "+" : ""}₹{pnl.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                        <span style={{ fontSize: "11.5px", marginLeft: "6px" }}>
                          ({isPositive ? "+" : ""}{pnlPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ padding: "16px 8px", textAlign: "right" }}>
                        <button
                          onClick={() => handleClosePosition(pos.symbol, pos.quantity)}
                          disabled={sellLoading === pos.symbol}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            color: "var(--accent-red)",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
                        >
                          {sellLoading === pos.symbol ? "Closing..." : "Close Position"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Portfolio;
