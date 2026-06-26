import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap
} from "lucide-react";
import Card from "../../components/ui/Card";
import type { MarketRegime } from "./types";
import { signalsService } from "./signals.service";


export const RegimeIndicator: React.FC = () => {
  const [regimeData, setRegimeData] = useState<MarketRegime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signalsService.getMarketRegime()
      .then((data) => {
        setRegimeData(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card title="Nifty Market Regime" subtitle="Current structural index trend">
        <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Loading market regime...</span>
        </div>
      </Card>
    );
  }

  if (!regimeData) return null;

  const getRegimeStyles = (reg: string) => {
    switch (reg) {
      case "Bull Market":
        return {
          color: "var(--accent-green)",
          bg: "rgba(16, 185, 129, 0.04)",
          border: "rgba(16, 185, 129, 0.2)",
          sentiment: "bullish" as const,
          description: "Structural uptrend confirmed. Long momentum equity plays are highly favored.",
          actionText: "Risk-on Allocation Active"
        };
      case "Bear Market":
        return {
          color: "var(--accent-red)",
          bg: "rgba(239, 68, 68, 0.04)",
          border: "rgba(239, 68, 68, 0.2)",
          sentiment: "bearish" as const,
          description: "Downward momentum active. Accumulate protective hedges and hold cash buffers.",
          actionText: "Capital Protection Active"
        };
      case "Sideways Market":
        return {
          color: "var(--accent-yellow)",
          bg: "rgba(245, 158, 11, 0.04)",
          border: "rgba(245, 158, 11, 0.2)",
          sentiment: "neutral" as const,
          description: "Rangebound index consolidations. Mean-reversion scalp trading works best.",
          actionText: "Rangebound Mean Reversion"
        };
      default: // High Volatility
        return {
          color: "var(--accent-purple)",
          bg: "rgba(170, 59, 255, 0.04)",
          border: "rgba(170, 59, 255, 0.2)",
          sentiment: "neutral" as const,
          description: "Wide price fluctuations detected. Reduce position sizes and expand stop losses.",
          actionText: "Volatility Protection Active"
        };
    }
  };

  const config = getRegimeStyles(regimeData.regime);
  const formattedTime = new Date(regimeData.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card 
      title="Nifty Market Regime" 
      subtitle="Structural index context"
      extra={<ShieldCheck size={18} color={config.color} />}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${config.border}`,
        position: "relative"
      }}
    >
      <div style={{ marginTop: "0.5rem" }}>
        
        {/* Main Regime Badge & Value */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>
              Current Regime State
            </span>
            <strong style={{ fontSize: "24px", fontWeight: "850", color: config.color, letterSpacing: "-0.5px" }}>
              {regimeData.regime}
            </strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>
              AI Confidence
            </span>
            <strong style={{ fontSize: "20px", fontWeight: "800", color: "#fff" }}>
              {regimeData.confidence}%
            </strong>
          </div>
        </div>

        {/* Meter Gauge */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="progress-bar-container" style={{ height: "6px", background: "rgba(255,255,255,0.05)" }}>
            <motion.div 
              className="progress-bar-fill" 
              style={{ width: `${regimeData.confidence}%`, backgroundColor: config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${regimeData.confidence}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Explanatory Box */}
        <div style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px"
        }}>
          <Zap size={15} color={config.color} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <span style={{ display: "block", fontSize: "12px", fontWeight: "750", color: "#fff", marginBottom: "2px" }}>
              {config.actionText}
            </span>
            <p style={{ margin: 0, fontSize: "11.5px", lineHeight: "1.45", color: "var(--text-secondary)" }}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Warning Indicator */}
        <div style={{
          background: "rgba(245, 158, 11, 0.02)",
          border: "1px solid rgba(245, 158, 11, 0.08)",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px"
        }}>
          <AlertTriangle size={15} color="var(--accent-yellow)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ margin: 0, fontSize: "11px", lineHeight: "1.4", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Regime Alert:</strong> Institutional index volumes have risen 12% above average. Sudden trend shifts could activate safety volatility adjustments.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={12} /> Updated at {formattedTime}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            Engine Status: <strong style={{ color: "var(--accent-green)" }}>Live</strong>
          </span>
        </div>

      </div>
    </Card>
  );
};

export default RegimeIndicator;
