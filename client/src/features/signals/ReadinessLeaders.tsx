import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Award,
  ArrowRight
} from "lucide-react";
import Card from "../../components/ui/Card";
import type { AIScore } from "./types";
import { signalsService } from "./signals.service";


interface ReadinessLeadersProps {
  activeSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}

const symbolNames: Record<string, string> = {
  TCS: "Tata Consultancy Services",
  RELIANCE: "Reliance Industries",
  INFY: "Infosys Ltd",
  HDFCBANK: "HDFC Bank",
};

export const ReadinessLeaders: React.FC<ReadinessLeadersProps> = ({ 
  activeSymbol, 
  onSelectSymbol 
}) => {
  const [scores, setScores] = useState<AIScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signalsService.getSignals()
      .then((data) => {
        // Sort by trade readiness descending
        const sorted = [...data].sort((a, b) => b.trade_readiness - a.trade_readiness);
        setScores(sorted);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card title="Trade Readiness Leaders" subtitle="Top opportunities by entry timing">
        <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Loading leaderboard...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Trade Readiness Leaders" 
      subtitle="Sorted by short-term entry timing"
      extra={<Award size={18} color="var(--accent-yellow)" />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "0.5rem" }}>
        {scores.map((item, index) => {
          const isActive = activeSymbol === item.symbol;
          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                background: isActive ? "rgba(37, 99, 235, 0.04)" : "rgba(255, 255, 255, 0.01)",
                borderColor: isActive ? "var(--accent-blue)" : "var(--border)",
                cursor: onSelectSymbol ? "pointer" : "default",
                transition: "all 0.2s ease-in-out",
                transform: isActive ? "translateX(4px)" : "none"
              }}
              className="readiness-leader-row"
            >
              {/* Leader Rank & Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ 
                  fontWeight: "800", 
                  fontSize: "14px", 
                  color: index === 0 ? "var(--accent-yellow)" : index === 1 ? "var(--text-primary)" : "var(--text-secondary)",
                  background: index === 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 255, 255, 0.05)",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {index + 1}
                </span>
                <div>
                  <strong style={{ fontSize: "14px", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                    {item.symbol}
                    {item.trend === "Bullish" && <TrendingUp size={12} color="var(--accent-green)" />}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>
                    {symbolNames[item.symbol] || "Equities stock"}
                  </span>
                </div>
              </div>

              {/* Timing Readiness vs Overall AI Score */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>
                    Readiness
                  </span>
                  <strong style={{ fontSize: "14px", color: "var(--accent-blue)" }}>
                    {item.trade_readiness}%
                  </strong>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>
                    AI Score
                  </span>
                  <strong style={{ fontSize: "14px", color: "var(--accent-green)" }}>
                    {item.score}
                  </strong>
                </div>

                {onSelectSymbol && (
                  <ArrowRight 
                    size={14} 
                    color="var(--text-secondary)" 
                    style={{ 
                      opacity: isActive ? 1 : 0.3,
                      transform: isActive ? "translateX(2px)" : "none",
                      transition: "all 0.2s" 
                    }} 
                  />
                )}
              </div>

            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ReadinessLeaders;
