import React, { useState } from "react";
import { mockStocksData, sectorStrengthRadar, opportunityRanking, type StockData } from "./mockData";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import Button from "../../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Flame, 
  HelpCircle, 
  GitCompare, 
  Clock, 
  Calendar,
  Layers,
  Zap,
  BookmarkPlus
} from "lucide-react";

export const Analysis: React.FC = () => {
  const [activeStock, setActiveStock] = useState<string>("TCS");
  const [activeData, setActiveData] = useState<StockData>(mockStocksData.TCS);
  const [isPageLoading, setIsPageLoading] = useState(false);
  
  // Modals & Panels State
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [compareTarget, setCompareTarget] = useState<string | null>(null);

  // Sync selected stock data with loader simulation
  const handleStockChange = (symbol: string) => {
    setIsPageLoading(true);
    setActiveStock(symbol);
    setTimeout(() => {
      setActiveData(mockStocksData[symbol]);
      setIsPageLoading(false);
    }, 450); // Fast loader for high-fidelity feel
  };

  // Generate SVG path for 30-day timeline chart
  const renderTimelineChart = (data: number[]) => {
    const width = 600;
    const height = 120;
    const padding = 10;
    
    const minVal = 50; // Assume min scale is 50 for better visual range
    const maxVal = 100;
    
    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);
      return { x, y };
    });

    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    
    // Area path for gradient background
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
      <div className="svg-chart-container" style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
          
          {/* Shaded Area */}
          <path d={areaD} fill="url(#chartGlow)" />
          
          {/* Animated Line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--accent-green)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {/* Dots on points */}
          {points.map((p, i) => (
            i === points.length - 1 && (
              <circle 
                key={i} 
                cx={p.x} 
                cy={p.y} 
                r="4.5" 
                fill="var(--accent-green)" 
                stroke="#fff" 
                strokeWidth="1.5" 
              />
            )
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ⚡ Quick Actions Bar (Sticky right panel) */}
      <div className="quick-actions-bar">
        <span className="quick-action-title">Actions</span>
        <Button variant="primary" icon={<Zap size={14} />} onClick={() => alert(`Starting Paper Trade for ${activeStock}`)}>
          Paper Trade
        </Button>
        <Button variant="secondary" icon={<BookmarkPlus size={14} />} onClick={() => alert(`Added ${activeStock} to watchlist`)}>
          Watchlist
        </Button>
        <Button 
          variant="ghost" 
          icon={<GitCompare size={14} />} 
          onClick={() => setCompareTarget(activeStock === "TCS" ? "INFY" : "TCS")}
        >
          Compare Stock
        </Button>
      </div>

      <div className="analysis-page-container" style={{ padding: "2rem", paddingRight: "100px" }}>
        
        {/* Search & Stock Toggle Section */}
        <div className="analysis-header-search-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>AI Analysis Center</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>Flagship screen for automated equity research and valuation.</p>
          </div>
          
          {/* Stock Search Toggle */}
          <div className="ticker-toggle-selector" style={{ display: "flex", background: "rgba(128,128,128,0.06)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px", gap: "4px" }}>
            {Object.keys(mockStocksData).map((symbol) => (
              <button
                key={symbol}
                className={`ticker-toggle-btn ${activeStock === symbol ? "active" : ""}`}
                style={{
                  background: activeStock === symbol ? "var(--accent-green)" : "transparent",
                  color: activeStock === symbol ? "#000" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "all 0.2s"
                }}
                onClick={() => handleStockChange(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {isPageLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Loader type="line" count={1} height="60px" />
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem" }}>
              <Loader type="card" count={1} height="280px" />
              <Loader type="card" count={1} height="280px" />
            </div>
            <Loader type="card" count={1} height="200px" />
          </div>
        ) : (
          <div className="analysis-grid-layout" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* 1. Hero Section Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {/* AI Score */}
              <Card title="AI Score" extra={<HelpCircle size={15} onClick={() => setShowExplainModal(true)} style={{ cursor: "pointer", color: "var(--text-secondary)" }} />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 className="ai-highlight-score" style={{ fontSize: "42px", fontWeight: "850", margin: 0, color: "var(--accent-green)" }}>
                      {activeData.aiScore}<span style={{ fontSize: "18px", color: "var(--text-secondary)" }}>/100</span>
                    </h2>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", display: "block", marginTop: "4px" }}>
                      Strong Opportunity
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowExplainModal(true)}
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      color: "var(--accent-green)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "750",
                      cursor: "pointer"
                    }}
                  >
                    Why {activeData.aiScore}?
                  </button>
                </div>
              </Card>

              {/* Trade Readiness */}
              <Card title="Trade Readiness">
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <h2 style={{ fontSize: "42px", fontWeight: "850", margin: 0 }}>
                    {activeData.readinessScore}%
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Score</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: "12px", marginBottom: "4px" }}>
                  <div className="progress-bar-fill" style={{ width: `${activeData.readinessScore}%`, backgroundColor: "var(--accent-blue)" }}></div>
                </div>
              </Card>

              {/* Risk Meter */}
              <Card title="Risk Rating">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "0.25rem" }}>
                  <h2 style={{ fontSize: "32px", fontWeight: "800", margin: 0 }}>
                    {activeData.riskLevel}
                  </h2>
                  <Badge variant={activeData.riskLevel === "Low" ? "success" : activeData.riskLevel === "Medium" ? "warning" : "danger"}>
                    {activeData.riskLevel} Risk
                  </Badge>
                </div>
                <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", display: "block", marginTop: "12px" }}>
                  Based on multiple asset volatilities
                </span>
              </Card>

              {/* Market Regime */}
              <Card title="Market Regime">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "0.25rem" }}>
                  <h2 style={{ fontSize: "32px", fontWeight: "800", margin: 0 }}>
                    {activeData.marketRegime}
                  </h2>
                  <Badge sentiment={activeData.marketRegime === "Bullish" ? "bullish" : activeData.marketRegime === "Bearish" ? "bearish" : "neutral"}>
                    {activeData.marketRegime}
                  </Badge>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "14px" }}>
                  Updated {activeData.lastUpdated}
                </span>
              </Card>
            </div>

            {/* 2. Hero Verdict & Radar Brain */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
              {/* AI Verdict */}
              <Card 
                title="AI Verdict & Valuation" 
                subtitle="Synthesized recommendations"
                className="verdict-gradient-card"
                extra={<Badge sentiment={activeData.marketRegime === "Bullish" ? "bullish" : "neutral"}>{activeData.confidence}% Confidence</Badge>}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--text-primary)" }}>
                    {activeData.verdict}
                  </p>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                    <div style={{ background: "rgba(128,128,128,0.04)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", flex: 1, minWidth: "120px" }}>
                      <span style={{ fontStyle: "italic", fontSize: "11px", color: "var(--text-secondary)" }}>Recommendation</span>
                      <strong style={{ display: "block", fontSize: "15px", color: "var(--accent-green)", marginTop: "4px" }}>
                        {activeData.aiScore >= 80 ? "ACCUMULATE (LONG)" : "HOLD / WATCH"}
                      </strong>
                    </div>
                    <div style={{ background: "rgba(128,128,128,0.04)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", flex: 1, minWidth: "120px" }}>
                      <span style={{ fontStyle: "italic", fontSize: "11px", color: "var(--text-secondary)" }}>Horizon</span>
                      <strong style={{ display: "block", fontSize: "15px", color: "#fff", marginTop: "4px" }}>
                        1 - 3 Months
                      </strong>
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI Brain Radar Breakdown */}
              <Card title="AI Brain" subtitle="Where the scores come from">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Object.entries(activeData.brain).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        <span>{key}</span>
                        <span style={{ color: "#fff" }}>{val}/100</span>
                      </div>
                      <div className="progress-bar-container" style={{ height: "5px" }}>
                        <motion.div 
                          className="progress-bar-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          style={{
                            backgroundColor: key === "risk" ? "var(--accent-yellow)" : key === "technicals" ? "var(--accent-green)" : "var(--accent-blue)"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 3. AI Debate Mode */}
            <Card title="AI Debate Mode" subtitle="Comparing opposing model viewpoints" extra={<Scale size={18} color="var(--accent-yellow)" />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }} className="responsive-split-row">
                {/* Bull Case */}
                <div style={{ background: "rgba(16, 185, 129, 0.02)", border: "1px solid rgba(16, 185, 129, 0.12)", borderRadius: "10px", padding: "1.5rem" }}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-green)", margin: "0 0 1rem" }}>
                    <TrendingUp size={16} /> Bull Case (Model A)
                  </h4>
                  <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "10px", color: "var(--text-secondary)", fontSize: "13.5px" }}>
                    {activeData.debate.bullCase.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Bear Case */}
                <div style={{ background: "rgba(239, 68, 68, 0.02)", border: "1px solid rgba(239, 68, 68, 0.12)", borderRadius: "10px", padding: "1.5rem" }}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-red)", margin: "0 0 1rem" }}>
                    <TrendingDown size={16} /> Bear Case (Model B)
                  </h4>
                  <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "10px", color: "var(--text-secondary)", fontSize: "13.5px" }}>
                    {activeData.debate.bearCase.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Debate Conclusion */}
              <div style={{ background: "rgba(128,128,128,0.03)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Synthesized Consensus
                </span>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.5", color: "var(--text-primary)" }}>
                  {activeData.debate.conclusion}
                </p>
              </div>
            </Card>

            {/* 4. Timeline & Opportunities Ranking */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
              {/* 30-Day Confidence Timeline */}
              <Card title="Confidence History" subtitle="AI score trajectory over the last 30 days" extra={<Calendar size={16} />}>
                <div style={{ padding: "1rem 0 0" }}>
                  {renderTimelineChart(activeData.timeline)}
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "11px", marginTop: "10px", fontWeight: "600" }}>
                    <span>30 Days Ago</span>
                    <span>15 Days Ago</span>
                    <span>Today ({activeData.aiScore})</span>
                  </div>
                </div>
              </Card>

              {/* Opportunity Rankings */}
              <Card title="Opportunity Rankings" subtitle="Active model scoring leaderboard">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {opportunityRanking.map((opp) => (
                    <div 
                      key={opp.symbol}
                      onClick={() => handleStockChange(opp.symbol)}
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "10px", 
                        border: "1px solid var(--border)", 
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: activeStock === opp.symbol ? "rgba(16, 185, 129, 0.04)" : "transparent",
                        borderColor: activeStock === opp.symbol ? "var(--accent-green)" : "var(--border)",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-secondary)" }}>{opp.rank}</span>
                        <div>
                          <strong style={{ fontSize: "14px", color: "#fff" }}>{opp.symbol}</strong>
                          <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>
                            Trend: {opp.trend}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "14px", fontWeight: "750" }}>{opp.score}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>
                            {opp.prevScore} → {opp.score}
                          </span>
                        </div>
                        <Badge variant={opp.trend === "improving" ? "success" : opp.trend === "stable" ? "primary" : "danger"}>
                          {opp.trend === "improving" ? "+8" : opp.trend === "stable" ? "0" : "-3"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 5. Sector Strength & News Impact Engine */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "1.5rem" }} className="responsive-split-row">
              {/* Sector Radar Strength */}
              <Card title="Sector Strength Radar" subtitle="Visual heat of sector inflows" extra={<Flame size={18} color="var(--accent-red)" />}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {sectorStrengthRadar.map((sec) => (
                    <div key={sec.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "600" }}>{sec.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700" }}>{sec.score}</span>
                          <span style={{ color: sec.trend === "up" ? "var(--accent-green)" : "var(--text-secondary)", fontSize: "10px" }}>
                            {sec.trend === "up" ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>
                      <div className="progress-bar-container" style={{ height: "4px" }}>
                        <div className="progress-bar-fill" style={{ width: `${sec.score}%`, backgroundColor: sec.score > 80 ? "var(--accent-green)" : "var(--border)" }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* News Impact Engine */}
              <Card title="News Impact Engine" subtitle="Quantifying sentiment weight" extra={<Layers size={18} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {activeData.newsImpacts.map((news, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        border: "1px solid var(--border)", 
                        borderRadius: "10px", 
                        padding: "1rem", 
                        background: "rgba(128,128,128,0.02)" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "650", flexGrow: 1, paddingRight: "10px", lineHeight: "1.4" }}>
                          {news.title}
                        </h4>
                        <Badge variant={news.impact === "Bullish" ? "success" : "warning"}>
                          {news.impact}
                        </Badge>
                      </div>
                      <p style={{ margin: "8px 0", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {news.summary}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> {news.time}</span>
                        <span>Impact Strength: <strong style={{ color: "var(--accent-green)" }}>{news.score}/100</strong></span>
                        <span>Duration: <strong>{news.duration}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
          </div>
        )}
      </div>

      {/* 5. Explainability Modal Popup */}
      <AnimatePresence>
        {showExplainModal && (
          <div className="command-palette-backdrop">
            <div className="palette-overlay" onClick={() => setShowExplainModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="command-palette-modal"
              style={{ maxWidth: "480px", padding: "2rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Explainable AI (Why {activeData.aiScore}?)</h3>
                <span className="palette-esc-badge" onClick={() => setShowExplainModal(false)}>ESC</span>
              </div>
              
              <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                Our model maps technical, fundamental, and sentiment weightings. Here is the points breakdown for <strong style={{ color: "#fff" }}>{activeStock}</strong>:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "13.5px" }}>📈 Technical Indicators</span>
                  <span style={{ color: "var(--accent-green)", fontWeight: "700" }}>+{activeData.explain.technicals} pts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "13.5px" }}>📰 News & Sentiment</span>
                  <span style={{ color: "var(--accent-green)", fontWeight: "700" }}>+{activeData.explain.news} pts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "13.5px" }}>🚀 Trend Momentum</span>
                  <span style={{ color: "var(--accent-green)", fontWeight: "700" }}>+{activeData.explain.trend} pts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "13.5px" }}>📊 Volume Expansion</span>
                  <span style={{ color: "var(--accent-green)", fontWeight: "700" }}>+{activeData.explain.volume} pts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "13.5px" }}>⚠️ Risk Adjustment</span>
                  <span style={{ color: "var(--accent-red)", fontWeight: "700" }}>{activeData.explain.risk} pts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", fontWeight: "750", fontSize: "16px" }}>
                  <span>Final AI Score</span>
                  <span style={{ color: "var(--accent-green)" }}>{activeData.aiScore}/100</span>
                </div>
              </div>

              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={() => setShowExplainModal(false)}>Close Explainability</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Stock Comparison Overlay Tool */}
      <AnimatePresence>
        {compareTarget && (
          <div className="command-palette-backdrop">
            <div className="palette-overlay" onClick={() => setCompareTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="command-palette-modal"
              style={{ maxWidth: "680px", padding: "2rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>AI Compare Tool</h3>
                <span className="palette-esc-badge" onClick={() => setCompareTarget(null)}>ESC</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "12px", textAlign: "center", fontWeight: "700", fontSize: "14px" }}>
                <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>Metric</span>
                <span style={{ color: "var(--accent-green)" }}>{activeStock} (Selected)</span>
                <span style={{ color: "var(--accent-blue)" }}>{compareTarget} (Target)</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px" }}>
                {/* AI Score comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", paddingBottom: "8px", textAlign: "center" }}>
                  <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>AI Score</span>
                  <strong style={{ color: "var(--accent-green)" }}>{activeData.aiScore}/100</strong>
                  <strong style={{ color: "var(--accent-blue)" }}>{mockStocksData[compareTarget].aiScore}/100</strong>
                </div>

                {/* Trend Sentiment comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", paddingBottom: "8px", textAlign: "center" }}>
                  <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>Market Regime</span>
                  <span>{activeData.marketRegime}</span>
                  <span>{mockStocksData[compareTarget].marketRegime}</span>
                </div>

                {/* Readiness comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", paddingBottom: "8px", textAlign: "center" }}>
                  <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>Trade Readiness</span>
                  <span>{activeData.readinessScore}%</span>
                  <span>{mockStocksData[compareTarget].readinessScore}%</span>
                </div>

                {/* Risk comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", paddingBottom: "8px", textAlign: "center" }}>
                  <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>Risk Level</span>
                  <span>{activeData.riskLevel}</span>
                  <span>{mockStocksData[compareTarget].riskLevel}</span>
                </div>

                {/* Technical Index comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", paddingBottom: "8px", textAlign: "center" }}>
                  <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>Technicals Brain</span>
                  <span>{activeData.brain.technicals}/100</span>
                  <span>{mockStocksData[compareTarget].brain.technicals}/100</span>
                </div>

                {/* News Sentiment comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", paddingBottom: "8px", textAlign: "center" }}>
                  <span style={{ textAlign: "left", color: "var(--text-secondary)" }}>News Brain</span>
                  <span>{activeData.brain.news}/100</span>
                  <span>{mockStocksData[compareTarget].brain.news}/100</span>
                </div>
              </div>

              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={() => setCompareTarget(null)}>Close Comparison</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analysis;
