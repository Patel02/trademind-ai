import React from "react";
import { Target, Clock, ShieldAlert, Zap } from "lucide-react";
import type { WorkspaceAIData, WorkspaceMarketContext } from "../types";
import MarketContext from "./MarketContext";

interface AIAnalysisPanelProps {
  symbol: string;
  ai: WorkspaceAIData;
  market: WorkspaceMarketContext;
  loading: boolean;
}

const ScoreGauge: React.FC<{ label: string; value: number; color: string; icon?: React.ReactNode }> = ({
  label,
  value,
  color,
  icon,
}) => (
  <div className="score-gauge">
    <div className="score-gauge-header">
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      <span className="score-gauge-label">{label}</span>
      <span className="score-gauge-value" style={{ color }}>{value}</span>
    </div>
    <div className="score-gauge-track">
      <div
        className="score-gauge-fill"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  </div>
);

const DNABar: React.FC<{ label: string; value: number; weight: string }> = ({ label, value, weight }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
      <span style={{ color: "var(--text-secondary)" }}>
        {label} <span style={{ color: "var(--text-secondary)", opacity: 0.6 }}>({weight})</span>
      </span>
      <strong style={{ color: value >= 80 ? "var(--accent-green)" : value >= 60 ? "var(--accent-purple)" : "var(--accent-yellow)", fontSize: "10.5px" }}>
        {value}
      </strong>
    </div>
    <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: value >= 80 ? "var(--accent-green)" : value >= 60 ? "var(--accent-purple)" : "#f59e0b",
          borderRadius: "2px",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  </div>
);

const opportunityColor = (status: WorkspaceAIData["opportunityStatus"]): string => {
  if (status === "Elite Opportunity") return "var(--accent-green)";
  if (status === "Strong Opportunity") return "var(--accent-purple)";
  if (status === "Watch Closely") return "#f59e0b";
  return "var(--accent-red)";
};

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ symbol, ai, market, loading }) => {
  if (loading) {
    return (
      <div className="ai-analysis-panel">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-analysis-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div>
          <div className="workspace-section-label">AI Intelligence</div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#fff", marginTop: "2px" }}>{symbol}</div>
        </div>
        <div
          className="opportunity-badge"
          style={{ background: `${opportunityColor(ai.opportunityStatus)}22`, border: `1px solid ${opportunityColor(ai.opportunityStatus)}44`, color: opportunityColor(ai.opportunityStatus) }}
        >
          {ai.opportunityStatus}
        </div>
      </div>

      {/* 4 Core Scores */}
      <div className="ai-panel-scores">
        <ScoreGauge
          label="Opportunity"
          value={ai.opportunityScore}
          color="var(--accent-green)"
          icon={<Target size={11} color="var(--accent-green)" />}
        />
        <ScoreGauge
          label="Timing"
          value={ai.timingScore}
          color="var(--accent-purple)"
          icon={<Clock size={11} color="var(--accent-purple)" />}
        />
        <ScoreGauge
          label="Confidence"
          value={ai.confidenceScore}
          color="#38bdf8"
          icon={<Zap size={11} color="#38bdf8" />}
        />
        <ScoreGauge
          label="Risk"
          value={ai.riskScore}
          color={ai.riskScore > 60 ? "var(--accent-red)" : ai.riskScore > 40 ? "#f59e0b" : "var(--accent-green)"}
          icon={<ShieldAlert size={11} color={ai.riskScore > 60 ? "var(--accent-red)" : "#f59e0b"} />}
        />
      </div>

      {/* Signal Levels */}
      <div className="ai-panel-section">
        <div className="workspace-section-label" style={{ marginBottom: "10px" }}>Signal Levels</div>
        <div className="signal-levels-grid">
          <div className="signal-level-item entry">
            <span className="signal-level-label">Entry Zone</span>
            <span className="signal-level-value">₹{ai.entryZoneLow.toLocaleString()} – ₹{ai.entryZoneHigh.toLocaleString()}</span>
          </div>
          <div className="signal-level-item sl">
            <span className="signal-level-label">Stop Loss</span>
            <span className="signal-level-value" style={{ color: "var(--accent-red)" }}>₹{ai.stopLoss.toLocaleString()}</span>
          </div>
          <div className="signal-levels-targets">
            <div className="signal-level-item target">
              <span className="signal-level-label">T1</span>
              <span className="signal-level-value" style={{ color: "var(--accent-green)" }}>₹{ai.target1.toLocaleString()}</span>
            </div>
            <div className="signal-level-item target">
              <span className="signal-level-label">T2</span>
              <span className="signal-level-value" style={{ color: "var(--accent-green)" }}>₹{ai.target2.toLocaleString()}</span>
            </div>
            <div className="signal-level-item target">
              <span className="signal-level-label">T3</span>
              <span className="signal-level-value" style={{ color: "var(--accent-green)" }}>₹{ai.target3.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signal DNA */}
      <div className="ai-panel-section">
        <div className="workspace-section-label" style={{ marginBottom: "10px" }}>Signal DNA</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <DNABar label="Technical" value={ai.technicalScore} weight="30%" />
          <DNABar label="News Sentiment" value={ai.newsScore} weight="20%" />
          <DNABar label="Sector Strength" value={ai.sectorScore} weight="15%" />
          <DNABar label="Trend Strength" value={ai.trendScore} weight="15%" />
          <DNABar label="Volume Quality" value={ai.volumeScore} weight="10%" />
        </div>
      </div>

      {/* Market Context */}
      <div className="ai-panel-section">
        <MarketContext market={market} />
      </div>

      {/* Scenario */}
      <div className="ai-panel-section">
        <div className="workspace-section-label" style={{ marginBottom: "8px" }}>Scenario Analysis</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ padding: "10px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--accent-green)", textTransform: "uppercase", marginBottom: "4px" }}>🐂 Bullish</div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{ai.bullishScenario}</p>
          </div>
          <div style={{ padding: "10px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--accent-red)", textTransform: "uppercase", marginBottom: "4px" }}>🐻 Bearish</div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{ai.bearishScenario}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
