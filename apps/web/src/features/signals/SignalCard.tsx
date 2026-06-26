import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  Calendar,
  Sparkles,
  Clock,
  Compass,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import type { AIScore, AIScoreBreakdown } from "./types";
import { signalsService } from "./signals.service";
import { mockStocksData } from "../../pages/analysis/mockData";

interface SignalCardProps {
  aiScore: AIScore;
  isInitiallyExpanded?: boolean;
}

const symbolNames: Record<string, string> = {
  TCS: "Tata Consultancy Services Ltd",
  RELIANCE: "Reliance Industries Ltd",
  INFY: "Infosys Ltd",
  HDFCBANK: "HDFC Bank Ltd",
};

export const SignalCard: React.FC<SignalCardProps> = ({ aiScore, isInitiallyExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [breakdown, setBreakdown] = useState<AIScoreBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  useEffect(() => {
    if (isExpanded && !breakdown) {
      setLoadingBreakdown(true);
      signalsService.getBreakdown(aiScore.symbol)
        .then((data) => {
          setBreakdown(data);
        })
        .finally(() => {
          setLoadingBreakdown(false);
        });
    }
  }, [isExpanded, aiScore.symbol, breakdown]);

  const stockDetails = mockStocksData[aiScore.symbol];

  const getOpportunityColor = (status: string) => {
    switch (status) {
      case "Elite Opportunity":
        return {
          color: "var(--accent-yellow)",
          bg: "rgba(245, 158, 11, 0.08)",
          border: "rgba(245, 158, 11, 0.3)",
          variant: "warning" as const
        };
      case "Strong Opportunity":
        return {
          color: "var(--accent-green)",
          bg: "rgba(16, 185, 129, 0.08)",
          border: "rgba(16, 185, 129, 0.3)",
          variant: "success" as const
        };
      case "Watch Closely":
        return {
          color: "var(--accent-blue)",
          bg: "rgba(37, 99, 235, 0.08)",
          border: "rgba(37, 99, 235, 0.3)",
          variant: "info" as const
        };
      default: // Avoid
        return {
          color: "var(--accent-red)",
          bg: "rgba(239, 68, 68, 0.08)",
          border: "rgba(239, 68, 68, 0.3)",
          variant: "danger" as const
        };
    }
  };

  const getResultBadge = () => {
    if (aiScore.result_status === "Target Hit") {
      return (
        <Badge variant="success" style={{ fontWeight: "750", letterSpacing: "0.2px" }}>
          Target Hit ✅ +{aiScore.result_pct}%
        </Badge>
      );
    }
    if (aiScore.result_status === "Stop Loss Hit") {
      return (
        <Badge variant="danger" style={{ fontWeight: "750", letterSpacing: "0.2px" }}>
          SL Triggered ❌ {aiScore.result_pct}%
        </Badge>
      );
    }
    return (
      <Badge variant="info" style={{ fontWeight: "750" }}>
        Active Signal
      </Badge>
    );
  };

  const optConfig = getOpportunityColor(aiScore.opportunity_status);

  // Generate SVG path for 30-day timeline chart
  const renderTimelineChart = (data: number[]) => {
    const width = 500;
    const height = 90;
    const padding = 10;
    
    const minVal = 50; 
    const maxVal = 100;
    
    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);
      return { x, y };
    });

    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const gradId = `glow-${aiScore.symbol}`;

    return (
      <div className="svg-chart-container" style={{ width: "100%", overflowX: "hidden" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
          <path d={areaD} fill={`url(#${gradId})`} />
          
          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--accent-green)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />

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
    <Card 
      className={`signal-card-v3 ${isExpanded ? "expanded" : ""}`}
      style={{
        border: isExpanded ? `1px solid ${optConfig.color}` : "1px solid var(--border)",
        background: "var(--bg-card)",
        overflow: "hidden",
        position: "relative",
        boxShadow: isExpanded ? `0 8px 30px rgba(0,0,0,0.4), 0 0 15px ${optConfig.color}15` : "var(--shadow)"
      }}
    >
      {/* Expired/Outcome Stripe background overlay */}
      {aiScore.result_status !== "Active" && (
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          backgroundColor: aiScore.result_status === "Target Hit" ? "var(--accent-green)" : "var(--accent-red)"
        }} />
      )}

      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer", padding: "1.25rem" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          
          {/* Stock Symbol and Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#fff", letterSpacing: "-0.3px" }}>
                {aiScore.symbol}
              </span>
              <Badge variant={optConfig.variant} style={{ fontSize: "11px" }}>
                {aiScore.opportunity_status}
              </Badge>
              {getResultBadge()}
            </div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {symbolNames[aiScore.symbol] || "Equities Market Ticker"}
            </span>
          </div>

          {/* Quick Metrics (AI Score, Readiness, Price Zone) */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }} className="signal-quick-metrics">
            
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>
                AI Score
              </span>
              <strong style={{ fontSize: "20px", fontWeight: "850", color: "var(--accent-green)" }}>
                {aiScore.score}<span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>/100</span>
              </strong>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>
                Readiness
              </span>
              <strong style={{ fontSize: "20px", fontWeight: "850", color: "var(--accent-blue)" }}>
                {aiScore.trade_readiness}%
              </strong>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>
                Current Rate
              </span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "#fff" }}>
                ₹{aiScore.current_price.toFixed(1)}
              </strong>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "3px" }}>
                Preferred Zone
              </span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>
                ₹{aiScore.entry_zone_low} - {aiScore.entry_zone_high}
              </span>
            </div>

            <div>
              {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
            </div>

          </div>

        </div>
      </div>

      {/* Expanded Details section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ borderTop: "1px solid var(--border)", background: "rgba(0, 0, 0, 0.15)" }}
          >
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Part 1: Visual Target Levels & Zones */}
              <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.25rem" }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 1rem", fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <Compass size={14} color="var(--accent-blue)" /> Entry Zones & Targets Engine
                </h4>

                {/* Horizontal price scale */}
                <div style={{ position: "relative", padding: "15px 0 25px 0", width: "100%" }}>
                  {/* Background scale bar */}
                  <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", width: "100%", position: "relative" }}>
                    
                    {/* Entry zone highlighted range */}
                    <div style={{
                      position: "absolute",
                      left: "30%",
                      width: "20%",
                      top: 0,
                      bottom: 0,
                      background: "rgba(37, 99, 235, 0.35)",
                      borderLeft: "2px solid var(--accent-blue)",
                      borderRight: "2px solid var(--accent-blue)"
                    }} />

                    {/* Current Price Dot */}
                    <div style={{
                      position: "absolute",
                      left: "48%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "var(--text-primary)",
                      border: "2.5px solid var(--accent-blue)",
                      boxShadow: "0 0 8px rgba(37,99,235,0.8)",
                      zIndex: 3
                    }} />

                  </div>

                  {/* Tick Marks & Text labels */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "11px", fontWeight: "700" }}>
                    
                    {/* Stop Loss */}
                    <div style={{ textAlign: "left" }}>
                      <span style={{ color: "var(--accent-red)", display: "block" }}>SL</span>
                      <strong style={{ color: "var(--text-secondary)" }}>₹{aiScore.stop_loss}</strong>
                    </div>

                    {/* Entry Zone */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ color: "var(--accent-blue)", display: "block" }}>Entry Zone</span>
                      <strong style={{ color: "#fff" }}>₹{aiScore.entry_zone_low} - {aiScore.entry_zone_high}</strong>
                    </div>

                    {/* Current Price */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ color: "var(--text-secondary)", display: "block" }}>Current</span>
                      <strong style={{ color: "var(--accent-green)", fontSize: "12px" }}>₹{aiScore.current_price}</strong>
                    </div>

                    {/* Target 1 */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ color: "var(--accent-green)", display: "block" }}>Target 1</span>
                      <strong style={{ color: "var(--text-secondary)" }}>₹{aiScore.target_1}</strong>
                    </div>

                    {/* Target 2 */}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ color: "var(--accent-green)", display: "block" }}>Target 2</span>
                      <strong style={{ color: "var(--text-secondary)" }}>₹{aiScore.target_2}</strong>
                    </div>

                    {/* Target 3 */}
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: "var(--accent-green)", display: "block" }}>Target 3</span>
                      <strong style={{ color: "var(--text-secondary)" }}>₹{aiScore.target_3}</strong>
                    </div>

                  </div>
                </div>
              </div>

              {/* Part 2: Explainable AI & Scenario Engine split */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
                
                {/* Explainable AI */}
                <div>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 1rem", fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <Scale size={14} color="var(--accent-green)" /> Explainable AI Breakdown
                  </h4>

                  {loadingBreakdown ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", width: "100%", position: "relative", overflow: "hidden" }}>
                        <div className="skeleton-line-load" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "35%", background: "var(--border)" }} />
                      </div>
                    </div>
                  ) : breakdown ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Technicals */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Technical Indicators (35%)</span>
                          <span style={{ fontWeight: "700", color: "var(--accent-green)" }}>
                            {breakdown.technical_score}% ({Math.round(breakdown.technical_score * 0.35)} pts)
                          </span>
                        </div>
                        <div className="progress-bar-container" style={{ height: "4px" }}>
                          <div className="progress-bar-fill" style={{ width: `${breakdown.technical_score}%`, backgroundColor: "var(--accent-green)" }} />
                        </div>
                      </div>

                      {/* News */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>News Sentiment (20%)</span>
                          <span style={{ fontWeight: "700", color: "var(--accent-green)" }}>
                            {breakdown.news_score}% ({Math.round(breakdown.news_score * 0.20)} pts)
                          </span>
                        </div>
                        <div className="progress-bar-container" style={{ height: "4px" }}>
                          <div className="progress-bar-fill" style={{ width: `${breakdown.news_score}%`, backgroundColor: "var(--accent-blue)" }} />
                        </div>
                      </div>

                      {/* Sector */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Sector Strength (15%)</span>
                          <span style={{ fontWeight: "700", color: "var(--accent-green)" }}>
                            {breakdown.sector_score}% ({Math.round(breakdown.sector_score * 0.15)} pts)
                          </span>
                        </div>
                        <div className="progress-bar-container" style={{ height: "4px" }}>
                          <div className="progress-bar-fill" style={{ width: `${breakdown.sector_score}%`, backgroundColor: "var(--accent-purple)" }} />
                        </div>
                      </div>

                      {/* Trend */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Trend Momentum (15%)</span>
                          <span style={{ fontWeight: "700", color: "var(--accent-green)" }}>
                            {breakdown.trend_score}% ({Math.round(breakdown.trend_score * 0.15)} pts)
                          </span>
                        </div>
                        <div className="progress-bar-container" style={{ height: "4px" }}>
                          <div className="progress-bar-fill" style={{ width: `${breakdown.trend_score}%`, backgroundColor: "var(--accent-yellow)" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Metrics unavailable.</span>
                  )}
                </div>

                {/* AI Scenario Engine */}
                <div>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 1rem", fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <ShieldAlert size={14} color="var(--accent-yellow)" /> AI Scenario Engine
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ background: "rgba(16,185,129,0.015)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px", padding: "10px" }}>
                      <span style={{ color: "var(--accent-green)", fontWeight: "700", fontSize: "11px", display: "block", marginBottom: "2px" }}>Bullish Continuation Setup</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                        {aiScore.bullish_scenario}
                      </p>
                    </div>

                    <div style={{ background: "rgba(239,68,68,0.015)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "10px" }}>
                      <span style={{ color: "var(--accent-red)", fontWeight: "700", fontSize: "11px", display: "block", marginBottom: "2px" }}>Bearish Breakdown Risk</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                        {aiScore.bearish_scenario}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Part 3: Confidence Timeline, Action Plan, & Verdict */}
              {stockDetails && (
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
                  
                  {/* Timeline Chart */}
                  <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.01)" }}>
                    <h5 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 10px 0", fontSize: "12px", color: "var(--text-primary)" }}>
                      <Calendar size={13} color="var(--accent-blue)" /> 30-Day Confidence Trajectory
                    </h5>
                    {renderTimelineChart(stockDetails.timeline)}
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "9px", marginTop: "8px", fontWeight: "600" }}>
                      <span>30 Days Ago</span>
                      <span>15 Days Ago</span>
                      <span>Today ({aiScore.confidence}%)</span>
                    </div>
                  </div>

                  {/* Suggested Approach & Verdict */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.01)" }}>
                      <h5 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 6px 0", fontSize: "12px", color: "var(--text-primary)" }}>
                        <ArrowUpRight size={13} color="var(--accent-green)" /> AI Action Plan / Suggested Approach
                      </h5>
                      <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.45", color: "var(--text-secondary)" }}>
                        {aiScore.suggested_approach}
                      </p>
                    </div>

                    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.01)" }}>
                      <h5 style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 6px 0", fontSize: "12px", color: "var(--text-primary)" }}>
                        <Sparkles size={13} color="var(--accent-yellow)" /> AI Synthesized Verdict
                      </h5>
                      <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.45", color: "var(--text-secondary)" }}>
                        {stockDetails.verdict}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* Timing Footer Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} /> Generated: <strong>{aiScore.generated_time}</strong> | Valid Until: <strong>{aiScore.valid_until}</strong>
                </span>
                <span>
                  Scoring Engine: <strong style={{ color: "var(--accent-green)" }}>Live</strong>
                </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </Card>
  );
};

export default SignalCard;
