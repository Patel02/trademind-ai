import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, ListFilter } from "lucide-react";
import { WORKSPACE_SYMBOLS } from "../services/workspace.service";
import type { WorkspaceSymbol } from "../types";

interface WatchlistSidebarProps {
  currentSymbol: string;
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({ currentSymbol }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ListFilter size={16} style={{ color: "var(--accent-purple)" }} />
          <span style={{ fontSize: "13px", fontWeight: "750", color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Workspace Watchlist
          </span>
        </div>
        <span style={{ fontSize: "10px", background: "rgba(170, 59, 255, 0.1)", color: "var(--accent-purple)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
          NSE
        </span>
      </div>

      <div
        className="workspace-watchlist-list"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {WORKSPACE_SYMBOLS.map((sym: WorkspaceSymbol) => {
          const isActive = sym.id === currentSymbol;
          const isPositive = sym.changePct >= 0;
          const TrendIcon = isPositive ? TrendingUp : sym.changePct < -0.1 ? TrendingDown : Minus;

          return (
            <button
              key={sym.id}
              className={`workspace-watchlist-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(`/trade/${sym.id}`)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "12px 10px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? "rgba(170, 59, 255, 0.25)" : "transparent",
                background: isActive ? "rgba(170, 59, 255, 0.06)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                outline: "none",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "700",
                    color: isActive ? "var(--accent-purple)" : "#fff",
                  }}
                >
                  {sym.displayName}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  {sym.sector}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "monospace" }}>
                  ₹{sym.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: isPositive ? "var(--accent-green)" : "var(--accent-red)",
                  }}
                >
                  <TrendIcon size={10} />
                  {isPositive ? "+" : ""}
                  {sym.changePct.toFixed(2)}%
                </span>
              </div>

              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    height: "60%",
                    width: "3px",
                    background: "var(--accent-purple)",
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WatchlistSidebar;
