import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Lock,
  Target,
  BarChart2,
  PieChart,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import Button from "../../components/ui/Button";
import { paperTradingService, type PaperPortfolio, type PaperPosition } from "../../features/paper-trading/paper-trading.service";
import { 
  portfolioDoctorService, 
  type PortfolioDiagnosis,
  type StressTestResult,
  stockSectors
} from "../../features/portfolio-doctor/portfolio-doctor.service";
import RebalanceSimulator from "../../features/portfolio-doctor/RebalanceSimulator";
import { auditService } from "../../security/audit.service";

export const PortfolioDoctorPage: React.FC = () => {
  const { profile } = useAuth();
  
  // 1. Developer Override State for Free vs Premium Demo
  const [overridePlan, setOverridePlan] = useState<string | null>(null);
  const rawRole = profile?.role || "FREE_USER";
  const plan = overridePlan || profile?.subscription_plan || "free";
  
  // Resolve user tier
  const isPremium = plan === "premium" || rawRole === "trader" || rawRole === "ADMIN" || rawRole === "SUPER_ADMIN";

  // 2. Goal State (Conservative, Balanced, Aggressive)
  const [goal, setGoal] = useState<"Conservative" | "Balanced" | "Aggressive">(
    (localStorage.getItem("trademind_portfolio_goal") as any) || "Balanced"
  );

  // Core Data States
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Simulation & Stress Test States
  const [simulatedDiag, setSimulatedDiag] = useState<PortfolioDiagnosis | null>(null);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [history, setHistory] = useState<{ id: string; health_score: number; risk_score: number; diversification_score: number; created_at: string }[]>([]);
  const [stressTestLogs, setStressTestLogs] = useState<{ id: string; scenario: string; expected_loss: number; created_at: string }[]>([]);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      const port = await paperTradingService.getPortfolio();
      const pos = await paperTradingService.getPositions();
      
      setPortfolio(port);
      setPositions(pos);

      // Fetch prices for all symbols
      const symbols = ["TCS", "RELIANCE", "INFY", "HDFCBANK"];
      const prices: Record<string, number> = {};
      await Promise.all(
        symbols.map(async (sym) => {
          prices[sym] = await paperTradingService.getStockPrice(sym);
        })
      );
      setStockPrices(prices);

      // Load historical snapshots
      let snaps = await portfolioDoctorService.getSnapshotHistory();
      if (snaps.length === 0 && port && pos) {
        await portfolioDoctorService.saveSnapshot(port, pos);
        snaps = await portfolioDoctorService.getSnapshotHistory();
      }
      setHistory(snaps);

      // Load stress test logs if premium
      if (isPremium) {
        const logs = await portfolioDoctorService.getStressTestLogs();
        setStressTestLogs(logs);
      }
      
    } catch (err) {
      console.error("Failed to load portfolio doctor details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [plan]); // Reload when override plan changes to refresh logs

  const handleGoalChange = async (newGoal: "Conservative" | "Balanced" | "Aggressive") => {
    setGoal(newGoal);
    localStorage.setItem("trademind_portfolio_goal", newGoal);
    setSimulatedDiag(null); // Reset manual simulation
    
    try {
      await auditService.logAction("UPDATE_PORTFOLIO_GOALS", "portfolio", newGoal, { goal: newGoal });
    } catch {
      // Fail silently
    }
  };

  if (loading || !portfolio) {
    return (
      <div style={{ padding: "2rem" }}>
        <Loader type="card" count={1} height="120px" />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "2rem", marginTop: "2rem" }}>
          <Loader type="card" count={2} height="280px" />
          <Loader type="card" count={1} height="400px" />
        </div>
      </div>
    );
  }

  // Get current diagnostics based on selected Goal
  const currentDiag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);
  
  // Use simulated calculations if simulation is active
  const activeDiag = simulatedDiag || currentDiag;
  const isSimulationActive = simulatedDiag !== null;
  const isStressTestActive = stressResult !== null;

  const {
    healthScore,
    diversificationScore,
    riskScore,
    riskHealthScore,
    sectorBalanceScore,
    cashAllocationScore,
    positionQualityScore,
    diversificationLevel,
    diversificationBadge,
    volatilityDrag,
    riskIndex,
    sectorAllocations,
    stockAllocations,
    suggestions,
    composition,
    concentrationRisk,
    behaviorAnalytics,
    cashPct
  } = activeDiag;

  const strokeDashoffset = 251.2 - (251.2 * healthScore) / 100;
  const healthDelta = isSimulationActive ? healthScore - currentDiag.healthScore : 0;

  const handleRunStressTest = async (testType: string) => {
    if (!isPremium) return;
    setSimulatedDiag(null); // Deactivate simulation
    
    const result = portfolioDoctorService.simulateStressTest(portfolio, positions, testType);
    setStressResult(result);

    // Refresh stress test logs
    const logs = await portfolioDoctorService.getStressTestLogs();
    setStressTestLogs(logs);
  };

  const handleResetStressTest = () => {
    setStressResult(null);
  };

  // Smart Alerts triggers (adapted based on active diagnostics and current goal limits)
  const isItOverweight = sectorAllocations.some((s) => s.sector === "IT Services" && s.allocationPct > (goal === "Conservative" ? 30 : goal === "Aggressive" ? 50 : 40));
  const isCashLow = cashPct < (goal === "Conservative" ? 20 : goal === "Aggressive" ? 5 : 10);
  const isRiskHigh = riskIndex === "High";
  const isDiversificationFalling = diversificationScore < 50;
  const hasAlerts = isItOverweight || isCashLow || isRiskHigh || isDiversificationFalling;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--accent-green)";
    if (score >= 55) return "var(--accent-yellow)";
    return "var(--accent-red)";
  };

  const renderHistoryChart = () => {
    if (history.length < 2) {
      return (
        <div style={{ 
          height: "150px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          border: "1px dashed var(--border)", 
          borderRadius: "8px", 
          color: "var(--text-secondary)", 
          fontSize: "13px",
          gap: "8px",
          padding: "16px",
          textAlign: "center"
        }}>
          <span>Not enough snapshot history to plot trend curve yet.</span>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>Execute paper trades to generate historical snapshots.</span>
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const padding = 20;

    const maxVal = 100;
    const minVal = 0;
    const valRange = maxVal - minVal;

    const points = history.map((item, idx) => {
      const score = item.health_score !== undefined ? item.health_score : (item as any).portfolio_score;
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((score - minVal) / valRange) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(" L ")}`;

    return (
      <div style={{ width: "100%", overflowX: "hidden", marginTop: "0.5rem" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.02)" strokeDasharray="3" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.02)" strokeDasharray="3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.04)" />

          <path 
            d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} 
            fill="url(#healthGrad)" 
          />

          <path 
            d={pathData} 
            fill="none" 
            stroke="var(--accent-green)" 
            strokeWidth="2.5" 
            style={{ filter: "drop-shadow(0px 2px 4px rgba(16, 185, 129, 0.3))" }}
          />

          {history.map((item, idx) => {
            const score = item.health_score !== undefined ? item.health_score : (item as any).portfolio_score;
            const coord = points[idx].split(",");
            const cx = parseFloat(coord[0]);
            const cy = parseFloat(coord[1]);
            return (
              <g key={item.id}>
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r="3.5" 
                  fill="#fff" 
                  stroke="var(--accent-green)" 
                  strokeWidth="1.5" 
                />
                <text 
                  x={cx} 
                  y={cy - 8} 
                  fill="#fff" 
                  fontSize="8.5" 
                  fontWeight="850" 
                  textAnchor="middle"
                >
                  {score}
                </text>
              </g>
            );
          })}

          <text x={padding} y={height - 4} fill="var(--text-secondary)" fontSize="9" fontWeight="600">
            Initial ({new Date(history[0].created_at).toLocaleDateString([], { month: "short", day: "numeric" })})
          </text>
          <text x={width - padding - 80} y={height - 4} fill="var(--accent-green)" fontSize="9" fontWeight="700" textAnchor="end">
            Latest Score Trend
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }} className="portfolio-doctor-page-wrapper">
      
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
              Portfolio Doctor Pro
            </h1>
            <Badge variant={isPremium ? "success" : "info"} style={{ textTransform: "uppercase", fontSize: "10px", fontWeight: "750" }}>
              {isPremium ? "Premium" : "Free Tier"}
            </Badge>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            AI-driven Wealth Health System, stress bounds, and goals audits
          </p>
        </div>

        {/* Demo switcher and goal selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          
          {/* Goal Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 10px" }}>
            <Target size={14} color="var(--accent-purple)" />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Goal:</span>
            <select 
              value={goal} 
              onChange={(e) => handleGoalChange(e.target.value as any)}
              style={{ background: "transparent", border: "none", color: "#fff", fontSize: "12px", fontWeight: "700", outline: "none", cursor: "pointer" }}
            >
              <option value="Conservative" style={{ background: "#0a0a0a" }}>Conservative</option>
              <option value="Balanced" style={{ background: "#0a0a0a" }}>Balanced</option>
              <option value="Aggressive" style={{ background: "#0a0a0a" }}>Aggressive</option>
            </select>
          </div>

          {/* Dev Plan Switcher Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 8px" }}>
            <UserCheck size={13} color="var(--accent-blue)" />
            <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Demo Tier:</span>
            <button 
              onClick={() => setOverridePlan(plan === "premium" ? "free" : "premium")}
              style={{ background: plan === "premium" ? "var(--accent-green)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "4px", padding: "2px 8px", color: "#fff", fontSize: "10px", fontWeight: "750", cursor: "pointer", transition: "all 0.2s" }}
            >
              {plan === "premium" ? "PREMIUM" : "FREE"}
            </button>
          </div>

        </div>
      </div>

      <div style={{ padding: "2rem" }}>
        
        {/* Simulation Banner Notification */}
        {isSimulationActive && (
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              background: "rgba(245,158,11,0.05)", 
              border: "1px dashed var(--accent-yellow)", 
              borderRadius: "10px", 
              padding: "12px 18px", 
              marginBottom: "1.5rem",
              fontSize: "13.5px" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={15} color="var(--accent-yellow)" />
              <span>
                You are modeling a proposed reallocation structure. Real-time scores are simulated.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Health Score Delta:</span>
              <strong style={{ color: currentDiag.healthScore === healthScore ? "#fff" : healthDelta > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                {currentDiag.healthScore} <ArrowRight size={12} style={{ display: "inline-block", verticalAlign: "middle" }} /> {healthScore}{" "}
                ({healthDelta >= 0 ? "+" : ""}{healthDelta})
              </strong>
            </div>
          </div>
        )}

        {/* Stress Test Banner Notification */}
        {isStressTestActive && stressResult && (
          <div 
            style={{ 
              background: "rgba(239, 68, 68, 0.05)", 
              border: "1px solid rgba(239, 68, 68, 0.25)", 
              borderRadius: "10px", 
              padding: "16px 20px", 
              marginBottom: "1.5rem",
              fontSize: "13.5px" 
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", paddingBottom: "10px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color="var(--accent-red)" />
                <span style={{ fontWeight: "750", fontSize: "14.5px", color: "var(--accent-red)" }}>
                  STRESS TEST SIMULATOR: {stressResult.title}
                </span>
              </div>
              <Button 
                variant="secondary" 
                onClick={handleResetStressTest}
                icon={<RotateCcw size={13} />}
                style={{ padding: "4px 10px", fontSize: "12px", borderColor: "rgba(239,68,68,0.3)", color: "var(--accent-red)" }}
              >
                Reset Stress Test
              </Button>
            </div>
            
            <p style={{ margin: "0 0 12px 0", color: "var(--text-secondary)", fontSize: "13px" }}>
              {stressResult.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "12px" }}>
              <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>EXPECTED PORTFOLIO DRAWDOWN</span>
                <strong style={{ fontSize: "18px", color: "var(--accent-red)" }}>-{stressResult.drawdownPct}%</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>SIMULATED NET ASSET VALUE (NAV)</span>
                <strong style={{ fontSize: "18px", color: "#fff" }}>₹{stressResult.simulatedNav.toLocaleString()}</strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>SIMULATED HEALTH SCORE</span>
                <strong style={{ fontSize: "18px", color: getScoreColor(stressResult.simulatedHealthScore) }}>
                  {stressResult.simulatedHealthScore}/100
                </strong>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "12px", color: "var(--accent-yellow)", display: "block", marginBottom: "6px" }}>AI Risk Protection Suggestions:</strong>
              {stressResult.recommendations.map((rec, idx) => (
                <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  <span style={{ color: "var(--accent-red)" }}>•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smart Alerts */}
        {hasAlerts && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "rgba(239, 68, 68, 0.03)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "1.5rem"
          }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "750", color: "var(--accent-red)", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={15} />
              <span>Smart Alerts</span>
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {isItOverweight && (
                <Badge variant="danger" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "11.5px" }}>
                  IT Exposure Above {goal === "Conservative" ? 30 : goal === "Aggressive" ? 50 : 40}%
                </Badge>
              )}
              {isCashLow && (
                <Badge variant="danger" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "11.5px" }}>
                  Cash Allocation Below {goal === "Conservative" ? 20 : goal === "Aggressive" ? 5 : 10}%
                </Badge>
              )}
              {isRiskHigh && (
                <Badge variant="danger" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "11.5px" }}>
                  Portfolio Risk Increased
                </Badge>
              )}
              {isDiversificationFalling && (
                <Badge variant="warning" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "11.5px" }}>
                  Diversification Falling
                </Badge>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.30fr 1.70fr", gap: "2rem" }} className="responsive-split-row">
          
          {/* LEFT COLUMN: Diagnostics Summary, X-Ray, Concentration, Diversification */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Section 1: Portfolio Health Score Hero Card */}
            <Card 
              title={isSimulationActive ? "Simulated Health Summary" : "Portfolio Health Summary"} 
              subtitle={`Audits adjusted for: ${goal} Goal`}
              extra={<Compass size={18} color="var(--accent-blue)" />}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.8rem" }} className="responsive-split-row">
                  
                  {/* Gauge SVG */}
                  <div style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="8" />
                      <motion.circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent" 
                        stroke={getScoreColor(healthScore)} 
                        strokeWidth="8" 
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.8 }}
                        strokeLinecap="round"
                        style={{ 
                          filter: `drop-shadow(0px 0px 5px ${getScoreColor(healthScore)})` 
                        }}
                      />
                    </svg>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                      <span style={{ fontSize: "24px", fontWeight: "900", color: "#fff", display: "block", lineHeight: "1" }}>
                        {healthScore}
                      </span>
                      <span style={{ fontSize: "8px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "750", display: "block", marginTop: "2px" }}>
                        Health
                      </span>
                    </div>
                  </div>

                  {/* Overview statistics */}
                  <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Health Class</span>
                      <Badge variant={healthScore >= 80 ? "success" : healthScore >= 55 ? "warning" : "danger"}>
                        {healthScore >= 80 ? "Excellent" : healthScore >= 55 ? "Moderate" : "Needs Review"}
                      </Badge>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Volatility Drag</span>
                      <span style={{ fontWeight: "750", color: volatilityDrag > 5 ? "var(--accent-red)" : "var(--accent-green)" }}>
                        {volatilityDrag}%
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Liquid Cash Buffer</span>
                      <span style={{ fontWeight: "700", color: "var(--accent-yellow)" }}>{cashPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: "750", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Health Breakdown Metrics
                  </h4>
                  
                  {/* Diversification Score */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>Diversification Health</span>
                      <strong style={{ color: getScoreColor(diversificationScore) }}>{diversificationScore}</strong>
                    </div>
                    <div className="progress-bar-container" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${diversificationScore}%`, backgroundColor: getScoreColor(diversificationScore) }} />
                    </div>
                  </div>

                  {/* Risk Health */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>Risk Health</span>
                      <strong style={{ color: getScoreColor(riskHealthScore) }}>{riskHealthScore}</strong>
                    </div>
                    <div className="progress-bar-container" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${riskHealthScore}%`, backgroundColor: getScoreColor(riskHealthScore) }} />
                    </div>
                  </div>

                  {/* Sector Health */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>Sector Health</span>
                      <strong style={{ color: getScoreColor(sectorBalanceScore) }}>{sectorBalanceScore}</strong>
                    </div>
                    <div className="progress-bar-container" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${sectorBalanceScore}%`, backgroundColor: getScoreColor(sectorBalanceScore) }} />
                    </div>
                  </div>

                  {/* Cash Health */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>Cash Health</span>
                      <strong style={{ color: getScoreColor(cashAllocationScore) }}>{cashAllocationScore}</strong>
                    </div>
                    <div className="progress-bar-container" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${cashAllocationScore}%`, backgroundColor: getScoreColor(cashAllocationScore) }} />
                    </div>
                  </div>

                  {/* Position Health */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>Position Health</span>
                      <strong style={{ color: getScoreColor(positionQualityScore) }}>{positionQualityScore}</strong>
                    </div>
                    <div className="progress-bar-container" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${positionQualityScore}%`, backgroundColor: getScoreColor(positionQualityScore) }} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 2: Portfolio X-Ray */}
            <Card 
              title="Portfolio X-Ray" 
              subtitle="Detailed sector composition and allocation state"
              extra={<PieChart size={18} color="var(--accent-purple)" />}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {composition.map((comp) => (
                  <div key={comp.sector} style={{ borderBottom: "1px solid rgba(255,255,255,0.015)", paddingBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", marginBottom: "4px" }}>
                      <div>
                        <strong style={{ color: "#fff" }}>{comp.sector}</strong>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginLeft: "6px" }}>
                          {comp.pct}%
                        </span>
                      </div>
                      <Badge variant={comp.state === "Overexposed" ? "danger" : comp.state === "Balanced" ? "success" : "warning"}>
                        {comp.state}
                      </Badge>
                    </div>
                    <div className="progress-bar-container" style={{ height: "6px" }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${comp.pct}%`, 
                          backgroundColor: comp.pct > 0 ? (stockSectors[Object.keys(stockSectors).find(k => stockSectors[k].sector === comp.sector) || ""]?.color || "var(--accent-purple)") : "transparent"
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Section 3: Concentration Risk Engine */}
            <Card title="Concentration Risk Engine" subtitle="Single position allocation boundaries check">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>TOP HOLDING POSITION</span>
                    <strong style={{ fontSize: "16px", color: "#fff" }}>{concentrationRisk.topHoldingSymbol}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>CURRENT WEIGHT / LIMIT</span>
                    <strong style={{ fontSize: "16px", color: concentrationRisk.isHighRisk ? "var(--accent-red)" : "var(--accent-green)" }}>
                      {concentrationRisk.topHoldingPct}% <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>/ {concentrationRisk.limit}%</span>
                    </strong>
                  </div>
                </div>

                {concentrationRisk.isHighRisk ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "10px 14px", color: "var(--accent-red)", fontSize: "12.5px" }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>High Concentration Risk!</strong> Single position size of {concentrationRisk.topHoldingPct}% exceeds the safe boundary for {goal} risk management.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", padding: "10px 14px", color: "var(--accent-green)", fontSize: "12.5px" }}>
                    <CheckCircle size={15} style={{ flexShrink: 0 }} />
                    <div>
                      Concentration limits are balanced. Positions conform to the {goal} goal limit of {concentrationRisk.limit}%.
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Section 4: Diversification Engine */}
            <Card title="Diversification Engine" subtitle="Audits stocks count, weights, and mix">
              <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }} className="responsive-split-row">
                
                {/* Score block */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 20px", textAlign: "center", width: "110px", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block", textTransform: "uppercase" }}>DIVERSIFY</span>
                  <strong style={{ fontSize: "28px", color: getScoreColor(diversificationScore), display: "block", margin: "4px 0" }}>
                    {diversificationScore}
                  </strong>
                  <span style={{ fontSize: "8px", display: "block", color: "var(--text-secondary)" }}>/ 100 SCORE</span>
                </div>

                {/* Statistics list */}
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Number of Stocks:</span>
                    <strong style={{ color: "#fff" }}>{stockAllocations.length} Active</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Sector Mix:</span>
                    <strong style={{ color: "#fff" }}>{sectorAllocations.length} Sectors</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Weight Distribution:</span>
                    <span style={{ fontWeight: "700", color: diversificationBadge === "success" || diversificationBadge === "info" ? "var(--accent-green)" : "var(--accent-yellow)" }}>
                      {diversificationLevel}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: Goals selector, Risk Engine, Stress test, Recommendations, Timeline, Behavior */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Section 9: Portfolio Goals adapt card */}
            <Card title="Portfolio Risk & Goals Config" subtitle="Targets adapting model logic">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  Adapting your portfolio target changes recommendations and warnings:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "4px" }}>
                  <button 
                    onClick={() => handleGoalChange("Conservative")}
                    style={{ background: goal === "Conservative" ? "rgba(16,185,129,0.15)" : "transparent", border: `1px solid ${goal === "Conservative" ? "var(--accent-green)" : "var(--border)"}`, borderRadius: "8px", padding: "10px", color: goal === "Conservative" ? "var(--accent-green)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}
                  >
                    <strong style={{ display: "block", fontSize: "12px" }}>Conservative</strong>
                    <span style={{ fontSize: "9px", opacity: 0.8 }}>Max Stock: 15%</span>
                  </button>
                  <button 
                    onClick={() => handleGoalChange("Balanced")}
                    style={{ background: goal === "Balanced" ? "rgba(168,85,247,0.15)" : "transparent", border: `1px solid ${goal === "Balanced" ? "var(--accent-purple)" : "var(--border)"}`, borderRadius: "8px", padding: "10px", color: goal === "Balanced" ? "var(--accent-purple)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}
                  >
                    <strong style={{ display: "block", fontSize: "12px" }}>Balanced</strong>
                    <span style={{ fontSize: "9px", opacity: 0.8 }}>Max Stock: 25%</span>
                  </button>
                  <button 
                    onClick={() => handleGoalChange("Aggressive")}
                    style={{ background: goal === "Aggressive" ? "rgba(239,68,68,0.15)" : "transparent", border: `1px solid ${goal === "Aggressive" ? "var(--accent-red)" : "var(--border)"}`, borderRadius: "8px", padding: "10px", color: goal === "Aggressive" ? "var(--accent-red)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}
                  >
                    <strong style={{ display: "block", fontSize: "12px" }}>Aggressive</strong>
                    <span style={{ fontSize: "9px", opacity: 0.8 }}>Max Stock: 40%</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Section 5: Risk Engine */}
            <Card title="Risk Engine" subtitle="Audits systematic & structural risks" extra={<Zap size={18} color="var(--accent-red)" />}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }} className="responsive-split-row">
                
                {/* Risk score circle */}
                <div style={{ background: "rgba(255,255,255,0.015)", border: `2px solid ${getScoreColor(100 - riskScore)}`, borderRadius: "50%", width: "80px", height: "80px", display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <strong style={{ fontSize: "24px", color: "#fff", display: "block", lineHeight: "1" }}>{riskScore}</strong>
                  <span style={{ fontSize: "8px", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "2px" }}>Risk Index</span>
                </div>

                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Risk Level:</span>
                    <strong style={{ color: riskScore > 65 ? "var(--accent-red)" : riskScore > 35 ? "var(--accent-yellow)" : "var(--accent-green)" }}>
                      {riskIndex} Risk
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Market Regime:</span>
                    <span style={{ fontWeight: "700", color: "#fff" }}>Bull Market (81% confidence)</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.3" }}>
                    Factors assessed: Sector concentration, volatility drag, regime beta, size metrics.
                  </p>
                </div>

              </div>
            </Card>

            {/* Section 6: Portfolio Stress Test (Premium Lock) */}
            <Card 
              title="Portfolio Stress Test Lab" 
              subtitle="Simulate drawdowns and expected net asset value drops"
              extra={<BarChart2 size={18} color="var(--accent-red)" />}
            >
              <div style={{ position: "relative" }}>
                
                {/* Card Contents */}
                <div style={{ filter: isPremium ? "none" : "blur(3.5px)", pointerEvents: isPremium ? "auto" : "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Trigger systematic corrections to calculate drawdowns, NAV drops, and rebalancing suggestions.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <Button 
                      variant="secondary"
                      onClick={() => handleRunStressTest("MARKET_CRASH_5")}
                      style={{ borderColor: "rgba(239,68,68,0.2)", fontSize: "12.5px", padding: "8px" }}
                    >
                      Nifty Drop -5%
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleRunStressTest("MARKET_CRASH_10")}
                      style={{ borderColor: "rgba(239,68,68,0.3)", fontSize: "12.5px", padding: "8px" }}
                    >
                      Nifty Drop -10%
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleRunStressTest("IT_CRASH_20")}
                      style={{ borderColor: "rgba(239,68,68,0.25)", fontSize: "12.5px", padding: "8px" }}
                    >
                      IT Crash -20%
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleRunStressTest("VOLATILITY_SPIKE")}
                      style={{ borderColor: "rgba(168,85,247,0.2)", fontSize: "12.5px", padding: "8px" }}
                    >
                      Volatility Spike
                    </Button>
                  </div>

                  {/* Stress test log history */}
                  {stressTestLogs.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "6px" }}>
                      <strong style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                        Recent Stress Test Runs Log
                      </strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
                        {stressTestLogs.slice(0, 3).map((log) => (
                          <div key={log.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", background: "rgba(0,0,0,0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                            <span style={{ color: "var(--text-secondary)" }}>{log.scenario}</span>
                            <span style={{ color: "var(--accent-red)", fontWeight: "700" }}>-{log.expected_loss}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Premium Overlay Gate */}
                {!isPremium && (
                  <div style={{
                    position: "absolute",
                    top: -10,
                    left: -10,
                    right: -10,
                    bottom: -10,
                    background: "rgba(10, 10, 10, 0.70)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.03)",
                    zIndex: 2
                  }}>
                    <Lock size={22} color="var(--accent-yellow)" style={{ marginBottom: "8px" }} />
                    <strong style={{ fontSize: "14px", color: "#fff", display: "block" }}>Unlock Portfolio Stress Lab</strong>
                    <p style={{ margin: "4px 0 12px 0", fontSize: "11px", color: "var(--text-secondary)", maxWidth: "220px", lineHeight: "1.4" }}>
                      Simulate market corrections & sector drops with hedge-fund drawdown engines.
                    </p>
                    <button 
                      onClick={() => setOverridePlan("premium")}
                      style={{ background: "var(--accent-purple)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", fontWeight: "750", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Section 7: AI Recommendations */}
            <Card 
              title="AI Recommendations Plan" 
              subtitle="Dynamic advisory checklist generated in real-time"
              extra={<Lightbulb size={18} color="var(--accent-yellow)" />}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {suggestions.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      background: "rgba(255,255,255,0.015)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "8px", 
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      borderColor: item.type === "warning" ? "rgba(239, 68, 68, 0.15)" : item.type === "success" ? "rgba(16, 185, 129, 0.15)" : "var(--border)"
                    }}
                  >
                    <Badge variant={item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "success"} style={{ fontSize: "8.5px", padding: "2px 4px", flexShrink: 0, textTransform: "uppercase" }}>
                      {item.priority}
                    </Badge>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Section 8: Portfolio Timeline SVG Chart */}
            <Card 
              title="Portfolio Timeline (30 Days)" 
              subtitle="Progress tracking of structural audit scores"
              extra={<Activity size={18} color="var(--accent-purple)" />}
            >
              {renderHistoryChart()}
            </Card>

            {/* Section 10: Behavior Analytics (Premium Lock) */}
            <Card 
              title="Behavior Analytics Audit" 
              subtitle="Tracks overtrading, cutting losses & sector bias"
              extra={<Sparkles size={18} color="var(--accent-purple)" />}
            >
              <div style={{ position: "relative" }}>
                
                {/* Card Contents */}
                <div style={{ filter: isPremium ? "none" : "blur(3.5px)", pointerEvents: isPremium ? "auto" : "none", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>OVERTRADING INDEX</span>
                      <strong style={{ fontSize: "18px", color: behaviorAnalytics.overtradingScore > 50 ? "var(--accent-yellow)" : "var(--accent-green)" }}>
                        {behaviorAnalytics.overtradingScore}%
                      </strong>
                      <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                        {behaviorAnalytics.overtradingScore > 50 ? "Slightly Active" : "Optimal trading pace"}
                      </span>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>SECTOR BIAS</span>
                      <strong style={{ fontSize: "16px", color: "var(--accent-purple)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {behaviorAnalytics.sectorBias}
                      </strong>
                      <span style={{ fontSize: "9.5px", color: "var(--text-secondary)", display: "block", marginTop: "2.5px" }}>
                        Frequent allocations
                      </span>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>WINNER EFFICIENCY</span>
                      <strong style={{ fontSize: "18px", color: "var(--accent-green)" }}>
                        {behaviorAnalytics.holdingWinnersRatio}%
                      </strong>
                      <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                        Holding strength ratio
                      </span>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block" }}>LOSS DISCIPLINE</span>
                      <strong style={{ fontSize: "18px", color: behaviorAnalytics.cuttingLossesRatio > 60 ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {behaviorAnalytics.cuttingLossesRatio}%
                      </strong>
                      <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                        Loss cutting compliance
                      </span>
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                    <strong style={{ color: "#fff", display: "block", marginBottom: "4px" }}>AI Coach Insights:</strong>
                    {behaviorAnalytics.feedback}
                  </div>
                </div>

                {/* Premium Overlay Gate */}
                {!isPremium && (
                  <div style={{
                    position: "absolute",
                    top: -10,
                    left: -10,
                    right: -10,
                    bottom: -10,
                    background: "rgba(10, 10, 10, 0.70)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.03)",
                    zIndex: 2
                  }}>
                    <Lock size={22} color="var(--accent-yellow)" style={{ marginBottom: "8px" }} />
                    <strong style={{ fontSize: "14px", color: "#fff", display: "block" }}>Unlock Behavior Analytics</strong>
                    <p style={{ margin: "4px 0 12px 0", fontSize: "11px", color: "var(--text-secondary)", maxWidth: "225px", lineHeight: "1.4" }}>
                      AI audits tracking winner-holding efficiency, loss-cutting speeds, and sector preference ratios.
                    </p>
                    <button 
                      onClick={() => setOverridePlan("premium")}
                      style={{ background: "var(--accent-purple)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", fontWeight: "750", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Interactive Simulation Sliders */}
            <RebalanceSimulator 
              portfolio={portfolio}
              positions={positions}
              onSimulationUpdate={setSimulatedDiag}
              stockPrices={stockPrices}
              goal={goal}
            />

          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDoctorPage;
