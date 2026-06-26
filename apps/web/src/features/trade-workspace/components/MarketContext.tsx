import React from "react";
import { Info, TrendingUp, ShieldAlert, Award } from "lucide-react";
import type { WorkspaceMarketContext } from "../types";

interface MarketContextProps {
  market: WorkspaceMarketContext;
  loading?: boolean;
}

export const MarketContext: React.FC<MarketContextProps> = ({ market, loading }) => {
  if (loading) {
    return (
      <div className="skeleton" style={{ height: "130px", borderRadius: "10px" }} />
    );
  }

  const isBull = market.regime === "Bull Market";
  
  return (
    <div
      className="market-context-box"
      style={{
        background: "rgba(255, 255, 255, 0.01)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <Info size={13} style={{ color: "var(--accent-purple)" }} />
        <span className="workspace-section-label" style={{ margin: 0 }}>
          Market Context
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Market Regime</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              padding: "2px 8px",
              borderRadius: "4px",
              background: isBull ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: isBull ? "var(--accent-green)" : "var(--accent-red)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {isBull ? <TrendingUp size={10} /> : <ShieldAlert size={10} />}
            {market.regime}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Regime Confidence</span>
          <strong style={{ fontSize: "12px", color: "#fff", fontFamily: "monospace" }}>
            {market.regimeConfidence}%
          </strong>
        </div>

        <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sector</span>
          <strong style={{ fontSize: "12px", color: "#fff" }}>{market.sector}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sector Strength</span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: market.sectorStrength >= 80 ? "var(--accent-green)" : "var(--accent-yellow)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Award size={11} />
            {market.sectorStrength}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketContext;
