import React, { useState, useEffect } from "react";
import { 
  Circle, 
  FileText, 
  Activity, 
  Award, 
  Compass, 
  Layers, 
  Cpu, 
  Clock, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import Button from "../../components/ui/Button";
import { 
  paperTradingService, 
  type PaperPortfolio, 
  type PaperPosition, 
  type PaperOrder,
  type PaperClosedTrade,
  type BehavioralAnalytics
} from "../../features/paper-trading/paper-trading.service";
import PortfolioSummary from "../../features/paper-trading/PortfolioSummary";
import TradeTerminal from "../../features/paper-trading/TradeTerminal";

export const PaperTrading: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs state: 'desk' | 'performance' | 'journal' | 'behavior'
  const [activeTab, setActiveTab] = useState<"desk" | "performance" | "journal" | "behavior">("desk");
  
  // Expanded closed trades map
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [exitNotesInput, setExitNotesInput] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const port = await paperTradingService.getPortfolio();
      const pos = await paperTradingService.getPositions();
      const ords = await paperTradingService.getOrders();
      const closed = await paperTradingService.getClosedTrades();
      
      setPortfolio(port);
      setPositions(pos);
      setOrders(ords);
      setClosedTrades(closed);
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
    if (window.confirm("Are you sure you want to reset your virtual portfolio? All active holdings and history will be cleared.")) {
      setLoading(true);
      await paperTradingService.resetPortfolio();
      await loadData(true);
    }
  };

  const handleQuickLiquidate = async (pos: PaperPosition) => {
    setRefreshing(true);
    const res = await paperTradingService.placeOrder(pos.symbol, "SELL", pos.quantity);
    alert(res.message);
    await loadData(true);
  };

  const handleSaveExitNotes = async (tradeId: string) => {
    setSavingNotes(true);
    try {
      await paperTradingService.updateClosedTradeJournal(tradeId, {
        whatHappened: exitNotesInput
      });
      // Refresh local trades
      const closed = await paperTradingService.getClosedTrades();
      setClosedTrades(closed);
      alert("Trade journal updated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleExpandTrade = (trade: PaperClosedTrade) => {
    if (expandedTradeId === trade.id) {
      setExpandedTradeId(null);
    } else {
      setExpandedTradeId(trade.id);
      setExitNotesInput(trade.journal.afterExit.whatHappened);
    }
  };

  // Compile calculations
  const analytics: BehavioralAnalytics = paperTradingService.getBehavioralAnalytics(closedTrades);

  const cashValue = portfolio?.balance || 0;
  const holdingsValue = positions.reduce((sum, p) => sum + p.quantity * p.current_price, 0);
  const totalAssets = cashValue + holdingsValue;
  const cashPct = totalAssets > 0 ? Math.round((cashValue / totalAssets) * 100) : 100;
  const stockPct = totalAssets > 0 ? Math.round((holdingsValue / totalAssets) * 100) : 0;

  // Render SVG Equity Curve Line Chart
  const renderEquityCurve = () => {
    if (closedTrades.length === 0) {
      return (
        <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          No closed trades to plot equity curve.
        </div>
      );
    }

    // Sort closed trades oldest first to calculate equity trail
    const chronoTrades = [...closedTrades].reverse();
    let currentBal = portfolio?.start_balance || 1000000;
    const balanceTrail = [currentBal];

    chronoTrades.forEach((t) => {
      currentBal += t.profit_loss;
      balanceTrail.push(currentBal);
    });

    const maxVal = Math.max(...balanceTrail, 1000000) * 1.02;
    const minVal = Math.min(...balanceTrail, 1000000) * 0.98;
    const valRange = maxVal - minVal;

    const width = 500;
    const height = 180;
    const padding = 20;

    const points = balanceTrail.map((val, idx) => {
      const x = padding + (idx / (balanceTrail.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(" L ")}`;

    return (
      <div style={{ width: "100%", overflowX: "hidden", marginTop: "1rem" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />

          {/* Fill Area */}
          <path 
            d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} 
            fill="url(#equityGrad)" 
          />

          {/* Main Line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="var(--accent-purple)" 
            strokeWidth="2.5" 
            style={{ filter: "drop-shadow(0px 2px 4px rgba(168, 85, 247, 0.4))" }}
          />

          {/* Data Nodes */}
          {balanceTrail.map((_val, idx) => {
            const coord = points[idx].split(",");
            const cx = parseFloat(coord[0]);
            const cy = parseFloat(coord[1]);
            return (
              <circle 
                key={idx} 
                cx={cx} 
                cy={cy} 
                r="4" 
                fill="#fff" 
                stroke="var(--accent-purple)" 
                strokeWidth="1.5" 
              />
            );
          })}

          {/* Label coordinates */}
          <text x={padding} y={height - 4} fill="var(--text-secondary)" fontSize="9" fontWeight="600">Start Balance</text>
          <text x={width - padding - 60} y={height - 4} fill="var(--accent-purple)" fontSize="9" fontWeight="700">Current NAV</text>
        </svg>
      </div>
    );
  };

  // Render SVG Sector PnL bar chart
  const renderSectorPerformance = () => {
    if (analytics.sectorStats.length === 0) {
      return (
        <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          No sectors audited yet.
        </div>
      );
    }

    const height = 180;
    const width = 500;
    const barHeight = 25;
    const gap = 15;

    return (
      <div style={{ width: "100%", overflowX: "hidden", marginTop: "1rem" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
          {/* Base midline */}
          <line x1={width / 2} y1="10" x2={width / 2} y2={height - 10} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {analytics.sectorStats.map((item, idx) => {
            const isProfit = item.profit >= 0;
            const absoluteProfit = Math.abs(item.profit);
            
            // Map profit to width: max profit maps to 200px
            const maxProfitVal = Math.max(...analytics.sectorStats.map((s) => Math.abs(s.profit)), 1000);
            const w = Math.max(15, (absoluteProfit / maxProfitVal) * 180);
            
            const y = 20 + idx * (barHeight + gap);
            const x = isProfit ? (width / 2) : (width / 2 - w);

            return (
              <g key={item.sector}>
                {/* Sector Name */}
                <text 
                  x={isProfit ? (width / 2 - 10) : (width / 2 + 10)} 
                  y={y + 16} 
                  fill="var(--text-secondary)" 
                  fontSize="10.5" 
                  fontWeight="600" 
                  textAnchor={isProfit ? "end" : "start"}
                >
                  {item.sector}
                </text>
                
                {/* Bar */}
                <rect 
                  x={x} 
                  y={y} 
                  width={w} 
                  height={barHeight} 
                  rx="4" 
                  fill={isProfit ? "var(--accent-green)" : "var(--accent-red)"}
                  style={{ opacity: 0.85 }}
                />

                {/* Profit value label */}
                <text 
                  x={isProfit ? (x + w + 8) : (x - 8)} 
                  y={y + 16} 
                  fill={isProfit ? "var(--accent-green)" : "var(--accent-red)"} 
                  fontSize="10" 
                  fontWeight="700"
                  textAnchor={isProfit ? "start" : "end"}
                >
                  {isProfit ? "+" : ""}₹{item.profit.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }} className="paper-trading-page-wrapper">
      
      {/* Header Banner */}
      <div className="paper-trading-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            Paper Trading Pro
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            Simulate institutional executions, structured journals, and AI trade analytics
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)", gap: "4px" }}>
          <button 
            onClick={() => setActiveTab("desk")}
            style={{ padding: "6px 12px", border: "none", borderRadius: "6px", background: activeTab === "desk" ? "var(--accent-purple)" : "transparent", color: "#fff", fontSize: "12.5px", fontWeight: "650", cursor: "pointer", transition: "all 0.2s" }}
          >
            Trading Desk
          </button>
          <button 
            onClick={() => setActiveTab("performance")}
            style={{ padding: "6px 12px", border: "none", borderRadius: "6px", background: activeTab === "performance" ? "var(--accent-purple)" : "transparent", color: "#fff", fontSize: "12.5px", fontWeight: "650", cursor: "pointer", transition: "all 0.2s" }}
          >
            Performance Lab
          </button>
          <button 
            onClick={() => setActiveTab("journal")}
            style={{ padding: "6px 12px", border: "none", borderRadius: "6px", background: activeTab === "journal" ? "var(--accent-purple)" : "transparent", color: "#fff", fontSize: "12.5px", fontWeight: "650", cursor: "pointer", transition: "all 0.2s" }}
          >
            Trade Journal
          </button>
          <button 
            onClick={() => setActiveTab("behavior")}
            style={{ padding: "6px 12px", border: "none", borderRadius: "6px", background: activeTab === "behavior" ? "var(--accent-purple)" : "transparent", color: "#fff", fontSize: "12.5px", fontWeight: "650", cursor: "pointer", transition: "all 0.2s" }}
          >
            AI Behavior
          </button>
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

            {/* TAB CONTENT: TRADING DESK */}
            {activeTab === "desk" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "2rem" }} className="responsive-split-row">
                
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <TradeTerminal 
                    balance={portfolio.balance} 
                    positions={positions} 
                    onOrderPlaced={() => loadData(true)} 
                  />

                  {/* Asset Allocation */}
                  <Card title="Asset Allocation Breakdown" subtitle="Virtual capital weight distribution">
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                        <div style={{ width: `${stockPct}%`, background: "var(--accent-purple)" }} title={`Holdings: ${stockPct}%`} />
                        <div style={{ width: `${cashPct}%`, background: "var(--accent-yellow)" }} title={`Cash: ${cashPct}%`} />
                      </div>
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

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
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
                                  <td style={{ padding: "12px 8px", fontWeight: "700", color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span>{isProfit ? "+" : ""}₹{pnl.toLocaleString()}</span>
                                      <span style={{ fontSize: "10px", fontWeight: "500" }}>{isProfit ? "▲" : "▼"} {pnlPct}%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <Button 
                                      variant="secondary" 
                                      onClick={() => handleQuickLiquidate(pos)}
                                      style={{ padding: "4px 8px", fontSize: "11.5px", borderColor: "rgba(239, 68, 68, 0.25)", color: "var(--accent-red)", background: "rgba(239, 68, 68, 0.02)" }}
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

                  <Card title="Transaction Journal Logs" subtitle="Audit logs of all virtual trades executed" extra={<FileText size={16} />}>
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
            )}

            {/* TAB CONTENT: PERFORMANCE LAB */}
            {activeTab === "performance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Stats cards grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
                  <Card title="Total Closed Trades" extra={<Layers size={18} color="var(--accent-blue)" />}>
                    <h3 style={{ fontSize: "28px", fontWeight: "850", margin: 0, color: "#fff" }}>
                      {analytics.totalTrades}
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                      Completed cycles
                    </span>
                  </Card>

                  <Card title="Win Rate %" extra={<Award size={18} color="var(--accent-green)" />}>
                    <h3 style={{ fontSize: "28px", fontWeight: "850", margin: 0, color: "var(--accent-green)" }}>
                      {analytics.winRate}%
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                      Target hit ratio
                    </span>
                  </Card>

                  <Card title="Profit Factor" extra={<Activity size={18} color="var(--accent-yellow)" />}>
                    <h3 style={{ fontSize: "28px", fontWeight: "850", margin: 0, color: "#fff" }}>
                      {analytics.profitFactor}
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                      Gains vs Losses ratio
                    </span>
                  </Card>

                  <Card title="Sharpe Ratio" extra={<Cpu size={18} color="var(--accent-purple)" />}>
                    <h3 style={{ fontSize: "28px", fontWeight: "850", margin: 0, color: "var(--accent-purple)" }}>
                      {analytics.sharpeRatio}
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                      Risk-adjusted return ratio
                    </span>
                  </Card>
                </div>

                {/* Charts split row */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }} className="responsive-split-row">
                  <Card title="Portfolio Equity Curve" subtitle="Net asset value trend over chronological trade closures">
                    {renderEquityCurve()}
                  </Card>
                  
                  <Card title="Sector Performance Audits" subtitle="Yield returns categorized across active market sectors">
                    {renderSectorPerformance()}
                  </Card>
                </div>

                {/* Details analytics table */}
                <Card title="Key Stat Indices" subtitle="Advanced risk-reward tracking models">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", padding: "10px" }}>
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Average Win Gain</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "var(--accent-green)", marginTop: "4px" }}>₹{analytics.avgGain.toLocaleString()}</strong>
                    </div>
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Average Loss Draw</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "var(--accent-red)", marginTop: "4px" }}>₹{analytics.avgLoss.toLocaleString()}</strong>
                    </div>
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Maximum Drawdown</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "var(--accent-yellow)", marginTop: "4px" }}>{analytics.maxDrawdown}%</strong>
                    </div>
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Avg Holding Period</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "#fff", marginTop: "4px" }}>
                        <Clock size={14} style={{ display: "inline-block", marginRight: "4px", verticalAlign: "middle" }} />
                        {analytics.avgHoldingMins} mins
                      </strong>
                    </div>
                  </div>
                </Card>

              </div>
            )}

            {/* TAB CONTENT: TRADE JOURNAL & AI REVIEW */}
            {activeTab === "journal" && (
              <Card title="Audit Journal & AI Review Ledger" subtitle="Detailed audit logs, entry snapshots, and post-trade feedback">
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {closedTrades.length > 0 ? (
                    closedTrades.map((trade) => {
                      const isExpanded = expandedTradeId === trade.id;
                      const isProfit = trade.profit_loss >= 0;

                      return (
                        <div 
                          key={trade.id} 
                          style={{ 
                            border: "1px solid var(--border)", 
                            borderRadius: "10px", 
                            background: "rgba(255,255,255,0.01)", 
                            overflow: "hidden" 
                          }}
                        >
                          {/* Row Header */}
                          <div 
                            onClick={() => handleExpandTrade(trade)}
                            style={{ 
                              padding: "16px 20px", 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center", 
                              cursor: "pointer",
                              background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <strong style={{ fontSize: "16px", color: "#fff" }}>{trade.symbol}</strong>
                              <Badge variant={isProfit ? "success" : "danger"}>
                                {trade.quantity} Shares
                              </Badge>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                {new Date(trade.exit_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                              <div style={{ textAlign: "right" }}>
                                <strong style={{ display: "block", color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>
                                  {isProfit ? "+" : ""}₹{trade.profit_loss.toLocaleString()}
                                </strong>
                                <span style={{ fontSize: "11px", color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>
                                  {isProfit ? "▲" : "▼"} {trade.profit_loss_percent}%
                                </span>
                              </div>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div style={{ padding: "20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                              
                              {/* Summary Info */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "8px", fontSize: "12.5px" }}>
                                <div><span style={{ color: "var(--text-secondary)" }}>Avg Entry Price:</span> <strong style={{ color: "#fff" }}>₹{trade.entry_price}</strong></div>
                                <div><span style={{ color: "var(--text-secondary)" }}>Exit Price:</span> <strong style={{ color: "#fff" }}>₹{trade.exit_price}</strong></div>
                                <div><span style={{ color: "var(--text-secondary)" }}>Entry Date:</span> <span>{new Date(trade.entry_date).toLocaleDateString()}</span></div>
                                <div><span style={{ color: "var(--text-secondary)" }}>Exit Date:</span> <span>{new Date(trade.exit_date).toLocaleDateString()}</span></div>
                              </div>

                              {/* Signal DNA Snap & AI Score */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }} className="responsive-split-row">
                                
                                {/* Signal DNA */}
                                <div>
                                  <h4 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px", fontSize: "13.5px", color: "var(--accent-blue)" }}>
                                    <Compass size={14} />
                                    <span>Signal DNA Snapshot</span>
                                  </h4>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                                      <span style={{ color: "var(--text-secondary)" }}>Opportunity Score</span>
                                      <strong style={{ color: "#fff" }}>{trade.signal_dna.opportunityScore}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                                      <span style={{ color: "var(--text-secondary)" }}>Timing Score</span>
                                      <strong style={{ color: "#fff" }}>{trade.signal_dna.timingScore}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                                      <span style={{ color: "var(--text-secondary)" }}>Confidence Score</span>
                                      <strong style={{ color: "#fff" }}>{trade.signal_dna.confidenceScore}%</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                                      <span style={{ color: "var(--text-secondary)" }}>Market Regime</span>
                                      <strong style={{ color: "#fff" }}>{trade.signal_dna.marketRegime}</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* AI Review */}
                                <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "20px" }} className="no-left-border-on-responsive">
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <h4 style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "13.5px", color: "var(--accent-purple)" }}>
                                      <Cpu size={14} />
                                      <span>AI Performance Review</span>
                                    </h4>
                                    <Badge variant={trade.ai_review.score >= 7 ? "success" : trade.ai_review.score >= 5 ? "warning" : "danger"} style={{ fontSize: "12px", padding: "4px 8px" }}>
                                      Trade Score: {trade.ai_review.score}/10
                                    </Badge>
                                  </div>

                                  <p style={{ margin: "0 0 12px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                    {trade.ai_review.analysis}
                                  </p>

                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11.5px" }}>
                                    <div>
                                      <strong style={{ color: "var(--accent-green)", display: "block", marginBottom: "4px" }}>Strengths:</strong>
                                      {trade.ai_review.strengths.map((str, idx) => (
                                        <div key={idx} style={{ color: "var(--text-secondary)", marginBottom: "2px" }}>• {str}</div>
                                      ))}
                                    </div>
                                    <div>
                                      <strong style={{ color: "var(--accent-red)", display: "block", marginBottom: "4px" }}>Lessons:</strong>
                                      {trade.ai_review.lessons.map((les, idx) => (
                                        <div key={idx} style={{ color: "var(--text-secondary)", marginBottom: "2px" }}>• {les}</div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                              </div>

                              {/* Structured Journal Notes */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", borderTop: "1px solid var(--border)", paddingTop: "20px" }} className="responsive-split-row">
                                
                                {/* Before Entry Notes */}
                                <div>
                                  <h4 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 8px", fontSize: "13px", color: "var(--accent-yellow)" }}>
                                    <Lightbulb size={13} />
                                    <span>Before Entry Journal Notes</span>
                                  </h4>
                                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", background: "rgba(0,0,0,0.1)", padding: "10px", borderRadius: "8px", lineHeight: "1.4" }}>
                                    <strong>Entry Rationale:</strong> {trade.journal.beforeEntry.reason}
                                    <br />
                                    <strong style={{ display: "block", marginTop: "4px" }}>Risk Plan:</strong> {trade.journal.beforeEntry.riskPlan}
                                  </div>
                                </div>

                                {/* After Exit Notes */}
                                <div>
                                  <h4 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 8px", fontSize: "13px", color: "var(--accent-yellow)" }}>
                                    <FileText size={13} />
                                    <span>After Exit Learnings</span>
                                  </h4>
                                  <textarea 
                                    value={exitNotesInput}
                                    onChange={(e) => setExitNotesInput(e.target.value)}
                                    placeholder="Write exit observations, learnings or errors..."
                                    style={{ 
                                      width: "100%", 
                                      height: "60px", 
                                      background: "rgba(0,0,0,0.2)", 
                                      border: "1px solid var(--border)", 
                                      borderRadius: "8px", 
                                      color: "#fff", 
                                      padding: "8px", 
                                      fontSize: "12.5px", 
                                      outline: "none", 
                                      resize: "none",
                                      boxSizing: "border-box"
                                    }}
                                  />
                                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                                    <Button 
                                      variant="primary" 
                                      onClick={() => handleSaveExitNotes(trade.id)}
                                      disabled={savingNotes}
                                      style={{ padding: "4px 10px", fontSize: "12px", background: "var(--accent-yellow)", color: "#000" }}
                                    >
                                      {savingNotes ? "Saving..." : "Save Learnings"}
                                    </Button>
                                  </div>
                                </div>

                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "13.5px" }}>
                      No closed trades in journal. Exit a position in the Trading Desk tab to generate logs and reviews.
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* TAB CONTENT: AI BEHAVIOR */}
            {activeTab === "behavior" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", gap: "2rem" }} className="responsive-split-row">
                
                {/* Patterns discovered */}
                <Card title="Discovered Behavioral Patterns" subtitle="Automated correlation audits between execution styles and outcomes" extra={<Cpu size={18} color="var(--accent-purple)" />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    
                    {closedTrades.length > 0 ? (
                      <>
                        <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", background: "rgba(168, 85, 247, 0.02)" }}>
                          <h4 style={{ margin: "0 0 6px", fontSize: "13.5px", color: "var(--accent-purple)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Award size={14} />
                            <span>Optimal Setup Match</span>
                          </h4>
                          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                            Your swing positions targeting <strong>Support Bounce</strong> setups show a high win rate of <strong>{analytics.winRate}%</strong> when held across <strong>2+ market sessions</strong>.
                          </p>
                        </div>

                        <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", background: "rgba(245, 158, 11, 0.02)" }}>
                          <h4 style={{ margin: "0 0 6px", fontSize: "13.5px", color: "var(--accent-yellow)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <AlertTriangle size={14} />
                            <span>Risk Concentrator Warning</span>
                          </h4>
                          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                            IT Services setups bought near resistance extensions trigger <strong>{analytics.avgLoss > 0 ? "elevated drawdowns" : "moderate losses"}</strong> under sideways or bearish market regimes.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                        Waiting for closed trades to extract performance patterns.
                      </div>
                    )}

                  </div>
                </Card>

                {/* AI Recommendations */}
                <Card title="Personalized Action Plans" subtitle="Prescriptive adjustments for your trading desk" extra={<Lightbulb size={18} color="var(--accent-yellow)" />}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {analytics.recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: "flex", 
                          gap: "8px", 
                          alignItems: "flex-start", 
                          background: "rgba(255,255,255,0.01)", 
                          padding: "10px 12px", 
                          border: "1px solid var(--border)", 
                          borderRadius: "8px" 
                        }}
                      >
                        <CheckCircle size={14} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default PaperTrading;
