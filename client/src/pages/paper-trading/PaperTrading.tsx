import React, { useState, useEffect } from "react";
import { Circle, FileText } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import Button from "../../components/ui/Button";
import { 
  paperTradingService, 
  type PaperPortfolio, 
  type PaperPosition, 
  type PaperOrder 
} from "../../features/paper-trading/paper-trading.service";
import PortfolioSummary from "../../features/paper-trading/PortfolioSummary";
import TradeTerminal from "../../features/paper-trading/TradeTerminal";

export const PaperTrading: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const port = await paperTradingService.getPortfolio();
      const pos = await paperTradingService.getPositions();
      const ords = await paperTradingService.getOrders();
      
      setPortfolio(port);
      setPositions(pos);
      setOrders(ords);
    } catch (err) {
      console.error("Failed to load paper trading data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = async () => {
    setLoading(true);
    await paperTradingService.resetPortfolio();
    await loadData(true);
  };

  const handleQuickLiquidate = async (pos: PaperPosition) => {
    if (window.confirm(`Are you sure you want to liquidate all ${pos.quantity} shares of ${pos.symbol}?`)) {
      setRefreshing(true);
      const res = await paperTradingService.placeOrder(pos.symbol, "SELL", pos.quantity);
      alert(res.message);
      await loadData(true);
    }
  };

  // Calculations for Allocation
  const cashValue = portfolio?.balance || 0;
  const holdingsValue = positions.reduce((sum, p) => sum + p.quantity * p.current_price, 0);
  const totalAssets = cashValue + holdingsValue;
  const cashPct = totalAssets > 0 ? Math.round((cashValue / totalAssets) * 100) : 100;
  const stockPct = totalAssets > 0 ? Math.round((holdingsValue / totalAssets) * 100) : 0;

  return (
    <div style={{ position: "relative" }} className="paper-trading-page-wrapper">
      
      {/* Header Banner */}
      <div className="paper-trading-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            Paper Trading Pro
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            Simulate advanced trading setups and stress test strategies in real-time
          </p>
        </div>
      </div>

      <div style={{ padding: "2rem" }}>
        {loading || !portfolio ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Loader type="card" count={4} height="120px" />
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "1.5rem" }}>
              <Loader type="card" count={1} height="350px" />
              <Loader type="card" count={2} height="180px" />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Top Portfolio Summary Indicators */}
            <PortfolioSummary 
              portfolio={portfolio} 
              positions={positions} 
              onReset={handleReset} 
              onRefresh={() => loadData(true)} 
              refreshing={refreshing}
            />

            {/* Split Grid Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "2rem" }} className="responsive-split-row">
              
              {/* Left Column: Trade Terminal & Asset Allocation */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Simulated Trade Terminal */}
                <TradeTerminal 
                  balance={portfolio.balance} 
                  positions={positions} 
                  onOrderPlaced={() => loadData(true)} 
                />

                {/* Asset Allocation Chart */}
                <Card title="Asset Allocation Breakdown" subtitle="Virtual capital weight distribution">
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    {/* Visual Progress Bar */}
                    <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                      <div style={{ width: `${stockPct}%`, background: "var(--accent-purple)", transition: "width var(--transition-speed)" }} title={`Holdings: ${stockPct}%`} />
                      <div style={{ width: `${cashPct}%`, background: "var(--accent-yellow)", transition: "width var(--transition-speed)" }} title={`Cash: ${cashPct}%`} />
                    </div>

                    {/* Progress indicators */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Circle size={10} fill="var(--accent-purple)" color="var(--accent-purple)" />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Holdings: <strong>{stockPct}%</strong></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                        <Circle size={10} fill="var(--accent-yellow)" color="var(--accent-yellow)" />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Cash: <strong>{cashPct}%</strong></span>
                      </div>
                    </div>

                    {/* Holdings values breakdown */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Holdings Value:</span>
                      <strong style={{ color: "#fff" }}>₹{holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Cash Power:</span>
                      <strong style={{ color: "#fff" }}>₹{cashValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>

                  </div>
                </Card>

              </div>

              {/* Right Column: Positions List & Transaction Logs Ledger */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Active holdings portfolio table */}
                <Card title="Active Virtual Positions" subtitle="Real-time open simulation positions">
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>
                          <th style={{ padding: "10px 8px" }}>Symbol</th>
                          <th style={{ padding: "10px 8px" }}>Qty</th>
                          <th style={{ padding: "10px 8px" }}>Avg Entry</th>
                          <th style={{ padding: "10px 8px" }}>Live Rate</th>
                          <th style={{ padding: "10px 8px" }}>Unrealized PnL</th>
                          <th style={{ padding: "10px 8px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.length > 0 ? (
                          positions.map((pos) => {
                            const cost = pos.quantity * pos.avg_entry_price;
                            const value = pos.quantity * pos.current_price;
                            const pnl = Number((value - cost).toFixed(2));
                            const pnlPct = Number(((pnl / cost) * 100).toFixed(2));
                            const isProfit = pnl >= 0;

                            return (
                              <tr key={pos.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "12px 8px", fontWeight: "750", color: "#fff" }}>{pos.symbol}</td>
                                <td style={{ padding: "12px 8px" }}>{pos.quantity}</td>
                                <td style={{ padding: "12px 8px" }}>₹{pos.avg_entry_price.toFixed(1)}</td>
                                <td style={{ padding: "12px 8px" }}>₹{pos.current_price.toFixed(1)}</td>
                                <td style={{ 
                                  padding: "12px 8px", 
                                  fontWeight: "700", 
                                  color: isProfit ? "var(--accent-green)" : "var(--accent-red)" 
                                }}>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span>{isProfit ? "+" : ""}₹{pnl.toLocaleString()}</span>
                                    <span style={{ fontSize: "10px", fontWeight: "500" }}>{isProfit ? "▲" : "▼"} {pnlPct}%</span>
                                  </div>
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                  <Button 
                                    variant="secondary" 
                                    onClick={() => handleQuickLiquidate(pos)}
                                    style={{ 
                                      padding: "4px 8px", 
                                      fontSize: "11.5px", 
                                      borderColor: "rgba(239, 68, 68, 0.25)",
                                      color: "var(--accent-red)",
                                      background: "rgba(239, 68, 68, 0.02)"
                                    }}
                                  >
                                    Liquidate
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                              No active open positions. Place an order in the terminal to begin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Simulated Order logs ledger */}
                <Card 
                  title="Transaction Journal Logs" 
                  subtitle="Audit logs of all virtual trades executed"
                  extra={<FileText size={16} />}
                >
                  <div style={{ maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "10px", fontWeight: "700" }}>
                          <th style={{ padding: "8px 6px" }}>Time</th>
                          <th style={{ padding: "8px 6px" }}>Symbol</th>
                          <th style={{ padding: "8px 6px" }}>Type</th>
                          <th style={{ padding: "8px 6px" }}>Qty</th>
                          <th style={{ padding: "8px 6px" }}>Rate</th>
                          <th style={{ padding: "8px 6px" }}>Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length > 0 ? (
                          orders.map((ord) => {
                            const val = ord.quantity * ord.execution_price;
                            const isBuy = ord.type === "BUY";
                            return (
                              <tr key={ord.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "10px 6px", color: "var(--text-secondary)", fontSize: "11px" }}>
                                  {new Date(ord.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                                  {new Date(ord.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td style={{ padding: "10px 6px", fontWeight: "700" }}>{ord.symbol}</td>
                                <td style={{ padding: "10px 6px" }}>
                                  <Badge variant={isBuy ? "success" : "danger"} style={{ fontSize: "9.5px", padding: "2px 6px" }}>
                                    {ord.type}
                                  </Badge>
                                </td>
                                <td style={{ padding: "10px 6px" }}>{ord.quantity}</td>
                                <td style={{ padding: "10px 6px" }}>₹{ord.execution_price.toFixed(1)}</td>
                                <td style={{ padding: "10px 6px", fontWeight: "650", color: "#fff" }}>
                                  ₹{val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                              No transactions recorded in log.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default PaperTrading;
