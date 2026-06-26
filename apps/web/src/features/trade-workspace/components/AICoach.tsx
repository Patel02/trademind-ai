import React from "react";
import type { WorkspaceCoachInsight } from "../types";

interface AICoachProps {
  symbol: string;
  insights: WorkspaceCoachInsight[];
  loading: boolean;
}

const insightBorderColor = (type: WorkspaceCoachInsight["type"]): string => {
  if (type === "positive") return "rgba(16, 185, 129, 0.2)";
  if (type === "caution") return "rgba(239, 68, 68, 0.18)";
  return "rgba(255, 255, 255, 0.06)";
};

const insightBgColor = (type: WorkspaceCoachInsight["type"]): string => {
  if (type === "positive") return "rgba(16, 185, 129, 0.04)";
  if (type === "caution") return "rgba(239, 68, 68, 0.04)";
  return "rgba(255, 255, 255, 0.02)";
};

const insightTitleColor = (type: WorkspaceCoachInsight["type"]): string => {
  if (type === "positive") return "var(--accent-green)";
  if (type === "caution") return "var(--accent-red)";
  return "var(--text-primary)";
};

export const AICoach: React.FC<AICoachProps> = ({ symbol, insights, loading }) => {
  return (
    <div className="ai-coach-panel">
      <div className="workspace-section-label" style={{ marginBottom: "12px" }}>
        🤖 AI Coach — {symbol}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "56px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {insights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                padding: "10px 12px",
                background: insightBgColor(insight.type),
                border: `1px solid ${insightBorderColor(insight.type)}`,
                borderRadius: "8px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.2 }}>{insight.icon}</span>
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: "700", color: insightTitleColor(insight.type), marginBottom: "3px" }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {insight.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: "12px",
        padding: "8px 12px",
        background: "rgba(139, 92, 246, 0.05)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        borderRadius: "8px",
        fontSize: "10px",
        color: "var(--text-secondary)",
        lineHeight: 1.5,
      }}>
        ⚠️ AI Coach provides educational market analysis only. Not financial advice. Always apply your own risk management.
      </div>
    </div>
  );
};

export default AICoach;
