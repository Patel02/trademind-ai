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
  RotateCcw
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import Button from "../../components/ui/Button";
import { paperTradingService, type PaperPortfolio, type PaperPosition } from "../../features/paper-trading/paper-trading.service";
import { 
  portfolioDoctorService, 
  type PortfolioDiagnosis,
  type StressTestResult
} from "../../features/portfolio-doctor/portfolio-doctor.service";
import RebalanceSimulator from "../../features/portfolio-doctor/RebalanceSimulator";

export const PortfolioDoctorPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Simulation & Stress Test States
  const [simulatedDiag, setSimulatedDiag] = useState<PortfolioDiagnosis | null>(null);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);

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
      
    } catch (err) {
      console.error("Failed to load portfolio doctor details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Get current active diagnostics
  const currentDiag = portfolioDoctorService.diagnosePortfolio(portfolio, positions);
  
  // Use simulated calculations if simulation is active
  const activeDiag = simulatedDiag || currentDiag;
  const isSimulationActive = simulatedDiag !== null;
  const isStressTestActive = stressResult !== null;

  const {
    healthScore,
    diversificationScore,
    riskScore,
    sectorBalanceScore,
    cashAllocationScore,
    diversificationLevel,
    diversificationBadge,
    volatilityDrag,
    riskIndex,
    sectorAllocations,
    stockAllocations,
    suggestions
  } = activeDiag;

  const strokeDashoffset = 251.2 - (251.2 * healthScore) / 100;
  
  // Calculate difference if simulating
  const healthDelta = isSimulationActive ? healthScore - currentDiag.healthScore : 0;

  const handleRunStressTest = (testType: string) => {
    // Deactivate manual slider simulation when running stress test
    setSimulatedDiag(null);
    
    const result = portfolioDoctorService.simulateStressTest(portfolio, positions, testType);
    setStressResult(result);
  };

  const handleResetStressTest = () => {
    setStressResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--accent-green)";
    if (score >= 55) return "var(--accent-yellow)";
    return "var(--accent-red)";
  };

  return (
    <div style={{ position: "relative" }} className="portfolio-doctor-page-wrapper">
      
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            Portfolio Doctor Pro
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            Hedge-fund risk analytics, stress testing, and allocation simulators
          </p>
        </div>
        
        {isSimulationActive && (
          <Badge 
            variant="warning" 
            style={{ 
              fontWeight: "800", 
              fontSize: "11px", 
              boxShadow: "0 0 10px rgba(245, 158, 11, 0.15)"
            }}
          >
            SIMULATION MODE ACTIVE
          </Badge>
        )}

        {isStressTestActive && (
          <Badge 
            variant="danger" 
            style={{ 
              fontWeight: "800", 
              fontSize: "11px", 
              boxShadow: "0 0 10px rgba(239, 68, 68, 0.15)",
              animation: "pulse 2s infinite"
            }}
          >
            STRESS TEST LAB ACTIVE
          </Badge>
        )}
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
                You are modeling a proposed reallocation structure. Real-time scores and suggestions are simulated.
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

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.7fr", gap: "2rem" }} className="responsive-split-row">
          
          {/* LEFT COLUMN: Diagnostics Summary, Sector Allocation, Stock Concentration */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Health Score Gauge */}
            <Card 
              title={isSimulationActive ? "Simulated Health Summary" : "Current Diagnostics Summary"} 
              subtitle="Overview of structural allocations and drag"
              extra={<Compass size={18} color="var(--accent-blue)" />}
            >
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
                    <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "750", display: "block", marginTop: "2px" }}>
                      Health
                    </span>
                  </div>
                </div>

                {/* Score Stats Summary Grid */}
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Diversification Score</span>
                    <Badge variant={diversificationBadge}>{diversificationLevel}</Badge>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Risk Index</span>
                    <Badge variant={riskIndex === "High" ? "danger" : riskIndex === "Medium" ? "warning" : "success"}>
                      {riskIndex} Risk
                    </Badge>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Volatility Drag</span>
                    <span style={{ fontWeight: "750", color: volatilityDrag > 5 ? "var(--accent-red)" : "var(--accent-green)" }}>
                      {volatilityDrag}%
                    </span>
                  </div>
                </div>

              </div>
            </Card>

            {/* Health Score Breakdown Widgets */}
            <Card title="Structural Diagnostics Breakdown" subtitle="Detailed audit scores across core metrics">
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Diversification */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600" }}>Diversification Index</span>
                    <strong style={{ color: getScoreColor(diversificationScore) }}>{diversificationScore}/100</strong>
                  </div>
                  <div className="progress-bar-container" style={{ height: "5px" }}>
                    <div className="progress-bar-fill" style={{ width: `${diversificationScore}%`, backgroundColor: getScoreColor(diversificationScore) }} />
                  </div>
                </div>

                {/* Risk */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600" }}>Risk Auditing Score</span>
                    <strong style={{ color: getScoreColor(riskScore) }}>{riskScore}/100</strong>
                  </div>
                  <div className="progress-bar-container" style={{ height: "5px" }}>
                    <div className="progress-bar-fill" style={{ width: `${riskScore}%`, backgroundColor: getScoreColor(riskScore) }} />
                  </div>
                </div>

                {/* Sector Balance */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600" }}>Sector Balance Score</span>
                    <strong style={{ color: getScoreColor(sectorBalanceScore) }}>{sectorBalanceScore}/100</strong>
                  </div>
                  <div className="progress-bar-container" style={{ height: "5px" }}>
                    <div className="progress-bar-fill" style={{ width: `${sectorBalanceScore}%`, backgroundColor: getScoreColor(sectorBalanceScore) }} />
                  </div>
                </div>

                {/* Cash Allocation */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600" }}>Cash Allocation Score</span>
                    <strong style={{ color: getScoreColor(cashAllocationScore) }}>{cashAllocationScore}/100</strong>
                  </div>
                  <div className="progress-bar-container" style={{ height: "5px" }}>
                    <div className="progress-bar-fill" style={{ width: `${cashAllocationScore}%`, backgroundColor: getScoreColor(cashAllocationScore) }} />
                  </div>
                </div>

              </div>
            </Card>

            {/* Sector Exposure list */}
            <Card title="Sector Allocation Index" subtitle="Concentration bounds across sectors">
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {sectorAllocations.length > 0 ? (
                  sectorAllocations.map((sec) => (
                    <div key={sec.sector}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "650" }}>{sec.sector}</span>
                        <strong style={{ color: sec.allocationPct > 40 ? "var(--accent-yellow)" : "#fff" }}>
                          {sec.allocationPct}% {sec.allocationPct > 40 ? "(Overweight)" : ""}
                        </strong>
                      </div>
                      <div className="progress-bar-container" style={{ height: "6px" }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${sec.allocationPct}%`, 
                            backgroundColor: sec.color 
                          }} 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                    Portfolio is empty. Sector allocations are not available.
                  </div>
                )}
              </div>
            </Card>

            {/* Individual Stock Concentrations */}
            <Card title="Stock Concentration" subtitle="Allocation percentages per security">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "10px", fontWeight: "700" }}>
                      <th style={{ padding: "8px" }}>Symbol</th>
                      <th style={{ padding: "8px" }}>Valuation</th>
                      <th style={{ padding: "8px" }}>Current Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockAllocations.length > 0 ? (
                      stockAllocations.map((stock) => (
                        <tr key={stock.symbol} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 8px", fontWeight: "750", color: "#fff" }}>{stock.symbol}</td>
                          <td style={{ padding: "10px 8px" }}>₹{stock.value.toLocaleString()}</td>
                          <td style={{ padding: "10px 8px", fontWeight: "700", color: stock.allocationPct > 30 ? "var(--accent-yellow)" : "var(--accent-green)" }}>
                            {stock.allocationPct}% {stock.allocationPct > 30 ? "(Overweight)" : ""}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                          No assets held.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: Rebalancing Simulator & Stress Tests */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Interactive Simulation Sliders */}
            <RebalanceSimulator 
              portfolio={portfolio}
              positions={positions}
              onSimulationUpdate={setSimulatedDiag}
              stockPrices={stockPrices}
            />

            {/* Stress Test Lab */}
            <Card title="Portfolio Stress Test Lab" subtitle="Simulate macro events to calculate expected NAV drawdowns" extra={<Zap size={18} color="var(--accent-red)" />}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  Trigger systematic or sector-specific drops to model your portfolio's stress bounds and view rebalancing recommendations.
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
              </div>
            </Card>

            {/* AI Diagnostics suggestions */}
            <Card 
              title="AI Rebalancing Journal" 
              subtitle="Audit guidance derived from structural models"
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
                    {item.type === "warning" ? (
                      <AlertTriangle size={15} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    ) : item.type === "success" ? (
                      <CheckCircle size={15} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    ) : (
                      <Activity size={15} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    )}
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PortfolioDoctorPage;
