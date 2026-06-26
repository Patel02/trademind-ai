import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import { paperTradingService } from "../paper-trading/paper-trading.service";
import { portfolioDoctorService, type PortfolioDiagnosis } from "../portfolio-doctor/portfolio-doctor.service";

export const PortfolioDoctor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<PortfolioDiagnosis | null>(null);

  useEffect(() => {
    let active = true;
    const loadDiagnostics = async () => {
      try {
        const port = await paperTradingService.getPortfolio();
        const pos = await paperTradingService.getPositions();
        const diag = portfolioDoctorService.diagnosePortfolio(port, pos);
        if (active) {
          setDiagnosis(diag);
        }
      } catch (err) {
        console.error("Failed to load doctor diagnostics", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDiagnostics();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !diagnosis) {
    return <Loader type="card" count={1} height="320px" />;
  }

  const {
    healthScore,
    diversificationLevel,
    diversificationBadge,
    volatilityDrag,
    riskIndex,
    sectorAllocations,
    suggestions
  } = diagnosis;

  const strokeDashoffset = 251.2 - (251.2 * healthScore) / 100;

  return (
    <Card 
      title="Portfolio Doctor Pro" 
      subtitle="Automated diversification & risk diagnostics"
      extra={<ShieldCheck size={18} color="var(--accent-green)" />}
    >
      <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Row 1: Circular Gauge & Overview */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }} className="responsive-split-row">
          
          {/* Circular SVG Gauge */}
          <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              {/* Background ring */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent" 
                stroke="var(--border)" 
                strokeWidth="8" 
              />
              {/* Foreground circle */}
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
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
                style={{ 
                  filter: `drop-shadow(0px 0px 4px ${healthScore > 80 ? "var(--accent-green)" : healthScore > 60 ? "var(--accent-yellow)" : "var(--accent-red)"})` 
                }}
              />
            </svg>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "20px", fontWeight: "850", color: "#fff", display: "block", lineHeight: "1" }}>
                {healthScore}
              </span>
              <span style={{ fontSize: "8px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", display: "block", marginTop: "2px" }}>
                Health
              </span>
            </div>
          </div>

          {/* Core metrics pills */}
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Diversification</span>
              <Badge variant={diversificationBadge}>{diversificationLevel}</Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Sector Risk Index</span>
              <Badge variant={riskIndex === "High" ? "danger" : riskIndex === "Medium" ? "warning" : "success"}>
                {riskIndex}
              </Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Volatility Drag</span>
              <span style={{ fontWeight: "700", color: volatilityDrag > 5 ? "var(--accent-red)" : "var(--accent-green)" }}>
                {volatilityDrag}%
              </span>
            </div>
          </div>

        </div>

        {/* Row 2: Sector Exposure distribution bars */}
        <div>
          <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
            Sector Allocations
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            
            {sectorAllocations.length > 0 ? (
              sectorAllocations.map((sec) => (
                <div key={sec.sector}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "3px" }}>
                    <span style={{ color: "#fff", fontWeight: "600" }}>{sec.sector}</span>
                    <span style={{ 
                      color: sec.allocationPct > 40 ? "var(--accent-yellow)" : "var(--text-secondary)", 
                      fontWeight: "700" 
                    }}>
                      {sec.allocationPct}% {sec.allocationPct > 40 ? "(High weight)" : ""}
                    </span>
                  </div>
                  <div className="progress-bar-container" style={{ height: "4px", background: "rgba(255,255,255,0.04)" }}>
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
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "4px 0" }}>
                No holdings value allocated. Portfolio is 100% Cash.
              </div>
            )}

          </div>
        </div>

        {/* Row 3: Actionable AI Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
              <Lightbulb size={12} color="var(--accent-yellow)" /> AI Rebalancing Recommendations
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {suggestions.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    background: "rgba(255,255,255,0.01)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "8px", 
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px"
                  }}
                >
                  {item.type === "warning" ? (
                    <AlertTriangle size={13} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  ) : item.type === "success" ? (
                    <CheckCircle size={13} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  ) : (
                    <Activity size={13} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  )}
                  <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};

export default PortfolioDoctor;
