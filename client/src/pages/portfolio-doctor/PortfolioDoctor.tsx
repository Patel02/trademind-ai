import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Compass,
  ArrowRight
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import { paperTradingService, type PaperPortfolio, type PaperPosition } from "../../features/paper-trading/paper-trading.service";
import { 
  portfolioDoctorService, 
  type PortfolioDiagnosis 
} from "../../features/portfolio-doctor/portfolio-doctor.service";
import RebalanceSimulator from "../../features/portfolio-doctor/RebalanceSimulator";

export const PortfolioDoctorPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Simulation State
  const [simulatedDiag, setSimulatedDiag] = useState<PortfolioDiagnosis | null>(null);

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

  const {
    healthScore,
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

  return (
    <div style={{ position: "relative" }} className="portfolio-doctor-page-wrapper">
      
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            Portfolio Doctor Pro
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            Hedge-fund risk analytics, diversification auditing, and allocation simulations
          </p>
        </div>
        
        {isSimulationActive && (
          <Badge 
            variant="warning" 
            style={{ 
              fontWeight: "800", 
              fontSize: "11px", 
              boxShadow: "0 0 10px rgba(245, 158, 11, 0.15)",
              animation: "pulse 2s infinite"
            }}
          >
            SIMULATION MODE ACTIVE
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
                      stroke={healthScore > 80 ? "var(--accent-green)" : healthScore > 60 ? "var(--accent-yellow)" : "var(--accent-red)"} 
                      strokeWidth="8" 
                      strokeDasharray="251.2"
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 0.8 }}
                      strokeLinecap="round"
                      style={{ 
                        filter: `drop-shadow(0px 0px 5px ${healthScore > 80 ? "var(--accent-green)" : healthScore > 60 ? "var(--accent-yellow)" : "var(--accent-red)"})` 
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

            {/* Sector Exposure list */}
            <Card title="Sector Allocation index" subtitle="Concentration bounds across sectors">
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

          {/* RIGHT COLUMN: Rebalancing Simulator & AI Suggestions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Interactive Simulation Sliders */}
            <RebalanceSimulator 
              portfolio={portfolio}
              positions={positions}
              onSimulationUpdate={setSimulatedDiag}
              stockPrices={stockPrices}
            />

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
