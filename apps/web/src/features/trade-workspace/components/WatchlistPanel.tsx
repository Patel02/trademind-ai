import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WorkspaceSymbol } from "../types";
import { WORKSPACE_SYMBOLS } from "../services/workspace.service";

interface WatchlistPanelProps {
  currentSymbol: string;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ currentSymbol }) => {
  const navigate = useNavigate();

  return (
    <div className="workspace-watchlist">
      <div className="workspace-watchlist-header">
        <span className="workspace-section-label">Watchlist</span>
      </div>

      <div className="workspace-watchlist-list">
        {WORKSPACE_SYMBOLS.map((sym: WorkspaceSymbol) => {
          const isActive = sym.id === currentSymbol;
          const isPositive = sym.changePct >= 0;
          const TrendIcon = isPositive ? TrendingUp : sym.changePct < -0.1 ? TrendingDown : Minus;

          return (
            <button
              key={sym.id}
              className={`workspace-watchlist-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(`/trade/${sym.id}`)}
              title={sym.name}
            >
              <div className="watchlist-item-left">
                <div
                  className="watchlist-item-ticker"
                  style={{ color: isActive ? "var(--accent-purple)" : "#fff" }}
                >
                  {sym.displayName}
                </div>
                <div className="watchlist-item-sector">{sym.sector}</div>
              </div>

              <div className="watchlist-item-right">
                <div className="watchlist-item-price">
                  ₹{sym.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                </div>
                <div
                  className="watchlist-item-change"
                  style={{ color: isPositive ? "var(--accent-green)" : "var(--accent-red)" }}
                >
                  <TrendIcon size={10} style={{ marginRight: "2px" }} />
                  {isPositive ? "+" : ""}{sym.changePct.toFixed(2)}%
                </div>
              </div>

              {isActive && <div className="watchlist-active-bar" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WatchlistPanel;
