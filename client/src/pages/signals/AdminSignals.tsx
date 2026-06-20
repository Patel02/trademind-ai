import React, { useState, useEffect } from "react";
import { 
  Send,
  XCircle,
  FileSpreadsheet,
  Cpu,
  Clock
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import { signalsService, type Signal, type AuditLog, type AIInsightPattern } from "../../features/signals/signals.service";

const defaultTickerPrices: Record<string, number> = {
  TCS: 3845.20,
  RELIANCE: 2950.40,
  INFY: 1490.50,
  HDFCBANK: 1560.10
};

export const AdminSignals: React.FC = () => {
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [insights, setInsights] = useState<AIInsightPattern[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [symbol, setSymbol] = useState("TCS");
  const [opportunityStatus, setOpportunityStatus] = useState<'Elite Opportunity' | 'Strong Opportunity' | 'Watch Closely' | 'Avoid'>("Strong Opportunity");
  const [setupType, setSetupType] = useState<'Bullish Breakout' | 'Pullback Recovery' | 'Volatility Squeeze' | 'Support Bounce'>("Bullish Breakout");
  const [entryPrice, setEntryPrice] = useState(3845.20);
  const [stopLoss, setStopLoss] = useState(3740.00);
  const [target1, setTarget1] = useState(3910.00);
  const [target2, setTarget2] = useState(3960.00);
  const [target3, setTarget3] = useState(4020.00);
  const [validUntil, setValidUntil] = useState("03:30 PM");

  // DNA Sliders
  const [technical, setTechnical] = useState(85);
  const [news, setNews] = useState(80);
  const [sector, setSector] = useState(88);
  const [trend, setTrend] = useState(88);
  const [relative, setRelative] = useState(82);
  const [volume, setVolume] = useState(78);

  // Close Signal Form Modal/State
  const [closingSignalId, setClosingSignalId] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [closeOutcome, setCloseOutcome] = useState<'Target Hit' | 'Stop Loss Hit' | 'Expired'>("Target Hit");

  const loadData = () => {
    Promise.all([
      signalsService.getActiveSignals(),
      signalsService.getAuditLogs()
    ]).then(([active, logs]) => {
      setActiveSignals(active);
      setAuditLogs(logs);
      setInsights(signalsService.getLearningInsights());
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default pricing parameters when symbol changes
  useEffect(() => {
    const base = defaultTickerPrices[symbol] || 1000;
    setEntryPrice(base);
    setStopLoss(Number((base * 0.98).toFixed(1)));
    setTarget1(Number((base * 1.015).toFixed(1)));
    setTarget2(Number((base * 1.03).toFixed(1)));
    setTarget3(Number((base * 1.05).toFixed(1)));
  }, [symbol]);

  // Calculate dynamic Signal Quality Score based on TIC formula
  const computedQuality = Math.round(
    technical * 0.30 +
    news * 0.20 +
    sector * 0.15 +
    trend * 0.15 +
    relative * 0.10 +
    volume * 0.10
  );

  const handleCreateSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stopLoss >= entryPrice) {
      alert("Validation Error: Stop Loss must be lower than Entry Price.");
      return;
    }
    if (target1 <= entryPrice || target2 <= target1 || target3 <= target2) {
      alert("Validation Error: Targets must satisfy Entry < Target 1 < Target 2 < Target 3.");
      return;
    }

    const newSignal = {
      symbol,
      opportunity_status: opportunityStatus,
      setup_type: setupType,
      entry_price: entryPrice,
      entry_zone_low: Number((entryPrice * 0.995).toFixed(1)),
      entry_zone_high: Number((entryPrice * 1.005).toFixed(1)),
      stop_loss: stopLoss,
      target_1: target1,
      target_2: target2,
      target_3: target3,
      confidence: Math.round((technical + news + trend) / 3),
      signal_quality_score: computedQuality,
      generated_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      valid_until: validUntil,
      bullish_scenario: `If price sustains above ₹${entryPrice}, high probability of breakout toward ₹${target1}.`,
      bearish_scenario: `If price breaks below ₹${entryPrice * 0.99}, risk increases; check support at ₹${stopLoss}.`,
      suggested_approach: `Accumulate near entry zones. Setup strategy: ${setupType}.`
    };

    const dna = {
      market_regime: "Bull Market",
      sector_strength: sector,
      news_score: news,
      technical_score: technical,
      timing_score: Math.round((technical + volume) / 2),
      risk_score: Math.round(100 - computedQuality),
      confidence_score: newSignal.confidence
    };

    setLoading(true);
    await signalsService.createSignal(newSignal, dna);
    loadData();
    alert(`Signal published successfully for ${symbol}!`);
  };

  const handleCloseSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingSignalId) return;

    setLoading(true);
    await signalsService.closeSignal(closingSignalId, exitPrice, closeOutcome);
    setClosingSignalId(null);
    loadData();
    alert("Signal closed and performance audited.");
  };

  const openCloseForm = (sig: Signal) => {
    setClosingSignalId(sig.id);
    setExitPrice(sig.current_price);
    setCloseOutcome("Target Hit");
  };

  return (
    <div style={{ position: "relative" }} className="admin-signals-wrapper">
      
      {/* Page Header */}
      <div className="admin-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            SIOS Lifecycle Console
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            Publish setups, close active positions, and monitor AI pattern analysis (Admin Only)
          </p>
        </div>
      </div>

      <div style={{ padding: "2rem" }}>
        {loading && activeSignals.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "2rem" }}>
            <Loader type="card" count={1} height="500px" />
            <Loader type="card" count={2} height="240px" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.7fr", gap: "2rem" }} className="responsive-split-row">
            
            {/* LEFT COLUMN: Create Signal Form */}
            <div className="admin-left-col">
              <Card title="Publish Research Signal" subtitle="Input strategy details and map setup DNA">
                <form onSubmit={handleCreateSignal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Symbol & Strategy */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Symbol</label>
                      <select 
                        value={symbol} 
                        onChange={(e) => setSymbol(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                      >
                        <option value="TCS">TCS</option>
                        <option value="RELIANCE">RELIANCE</option>
                        <option value="INFY">INFY</option>
                        <option value="HDFCBANK">HDFCBANK</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Setup Type</label>
                      <select 
                        value={setupType} 
                        onChange={(e) => setSetupType(e.target.value as any)}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                      >
                        <option value="Bullish Breakout">Bullish Breakout</option>
                        <option value="Pullback Recovery">Pullback Recovery</option>
                        <option value="Volatility Squeeze">Volatility Squeeze</option>
                        <option value="Support Bounce">Support Bounce</option>
                      </select>
                    </div>
                  </div>

                  {/* Status & Validity */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Opportunity Classification</label>
                      <select 
                        value={opportunityStatus} 
                        onChange={(e) => setOpportunityStatus(e.target.value as any)}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                      >
                        <option value="Elite Opportunity">Elite Opportunity</option>
                        <option value="Strong Opportunity">Strong Opportunity</option>
                        <option value="Watch Closely">Watch Closely</option>
                        <option value="Avoid">Avoid</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Valid Until</label>
                      <input 
                        type="text" 
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* Price Targets Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Entry Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={entryPrice} 
                        onChange={(e) => setEntryPrice(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Stop Loss (₹)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={stopLoss} 
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* Target 1, 2, 3 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Target 1 (₹)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={target1} 
                        onChange={(e) => setTarget1(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Target 2 (₹)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={target2} 
                        onChange={(e) => setTarget2(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Target 3 (₹)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={target3} 
                        onChange={(e) => setTarget3(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* DNA SLIDERS */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Setup Score DNA (Weights)</span>
                      <Badge variant="success" style={{ fontWeight: "800" }}>Quality Score: {computedQuality}</Badge>
                    </div>

                    {/* Tech & News */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          <span>Technicals</span>
                          <strong>{technical}%</strong>
                        </div>
                        <input type="range" min="0" max="100" value={technical} onChange={(e) => setTechnical(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          <span>News Sentiment</span>
                          <strong>{news}%</strong>
                        </div>
                        <input type="range" min="0" max="100" value={news} onChange={(e) => setNews(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>
                    </div>

                    {/* Sector & Trend */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          <span>Sector Inflows</span>
                          <strong>{sector}%</strong>
                        </div>
                        <input type="range" min="0" max="100" value={sector} onChange={(e) => setSector(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          <span>Trend Strength</span>
                          <strong>{trend}%</strong>
                        </div>
                        <input type="range" min="0" max="100" value={trend} onChange={(e) => setTrend(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>
                    </div>

                    {/* Relative & Volume */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          <span>Relative Strength</span>
                          <strong>{relative}%</strong>
                        </div>
                        <input type="range" min="0" max="100" value={relative} onChange={(e) => setRelative(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          <span>Volume Quality</span>
                          <strong>{volume}%</strong>
                        </div>
                        <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <Button variant="primary" icon={<Send size={14} />} style={{ width: "100%" }}>
                      Publish Signal & Track DNA
                    </Button>
                  </div>

                </form>
              </Card>
            </div>

            {/* RIGHT COLUMN: Active List, Audits & Insights */}
            <div className="admin-right-col" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* Active Signals List */}
              <Card title="Active Audited Signals" subtitle="Live index tracking positions">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeSignals.length > 0 ? (
                    activeSignals.map((sig) => (
                      <div 
                        key={sig.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          border: "1px solid var(--border)", 
                          borderRadius: "10px", 
                          padding: "12px",
                          background: "rgba(255,255,255,0.01)" 
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ color: "#fff", fontSize: "14.5px" }}>{sig.symbol}</strong>
                            <Badge variant={sig.opportunity_status === "Elite Opportunity" ? "warning" : "success"} style={{ fontSize: "10px" }}>
                              {sig.opportunity_status}
                            </Badge>
                          </div>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {sig.setup_type} | Entry: ₹{sig.entry_price} | SL: ₹{sig.stop_loss}
                          </span>
                        </div>
                        
                        <Button 
                          variant="secondary" 
                          icon={<XCircle size={14} color="var(--accent-red)" />}
                          onClick={() => openCloseForm(sig)}
                          style={{ padding: "6px 12px" }}
                        >
                          Close Setup
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                      No active setups published by administration.
                    </div>
                  )}
                </div>
              </Card>

              {/* AI Learning Insights */}
              <Card title="AI Setup Learning Insights" subtitle="Pattern recognition win rate models" extra={<Cpu size={18} color="var(--accent-green)" />}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {insights.map((ins, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        border: "1px solid var(--border)", 
                        borderRadius: "8px", 
                        padding: "10px",
                        background: "rgba(16, 185, 129, 0.015)",
                        borderColor: "rgba(16, 185, 129, 0.15)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "12.5px", color: "#fff" }}>{ins.setup} Setup</strong>
                        <Badge variant="success" style={{ fontWeight: "800" }}>{ins.win_rate}% Win Rate</Badge>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "block" }}>
                        Conditions: {ins.conditions}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block", marginTop: "4px", fontStyle: "italic" }}>
                        Sample size: {ins.occurrences} setups | Avg Profit: +{ins.avg_return}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Audit Logs */}
              <Card title="Administration Audit Trail" subtitle="Chronological tracking of system changes" extra={<FileSpreadsheet size={16} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto", paddingRight: "4px" }}>
                  {auditLogs.map((log) => (
                    <div key={log.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "11.5px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                      <Clock size={11} color="var(--text-secondary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <div>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        </span>{" "}
                        <span style={{ color: "var(--text-primary)" }}>{log.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

          </div>
        )}
      </div>

      {/* Inline Close Signal Popup Form Overlay */}
      {closingSignalId && (
        <div className="command-palette-backdrop">
          <div className="palette-overlay" onClick={() => setClosingSignalId(null)} />
          <div className="command-palette-modal" style={{ maxWidth: "420px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Close Active Setup</h3>
              <span className="palette-esc-badge" onClick={() => setClosingSignalId(null)}>ESC</span>
            </div>

            <form onSubmit={handleCloseSignal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Exit Rate (₹)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={exitPrice} 
                  onChange={(e) => setExitPrice(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Audited Outcome</label>
                <select 
                  value={closeOutcome} 
                  onChange={(e) => setCloseOutcome(e.target.value as any)}
                  style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                >
                  <option value="Target Hit">Target Hit</option>
                  <option value="Stop Loss Hit">Stop Loss Hit</option>
                  <option value="Expired">Expired / Range Limit</option>
                </select>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button variant="secondary" onClick={() => setClosingSignalId(null)}>Cancel</Button>
                <Button variant="primary">Confirm Closure</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSignals;
