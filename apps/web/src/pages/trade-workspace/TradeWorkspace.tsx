import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Maximize2, RefreshCw } from "lucide-react";
import TradingChart from "../../features/trade-workspace/components/TradingChart";
import WatchlistSidebar from "../../features/trade-workspace/components/WatchlistSidebar";
import AIAnalysisPanel from "../../features/trade-workspace/components/AIAnalysisPanel";
import AICoach from "../../features/trade-workspace/components/AICoach";
import TradePanel from "../../features/trade-workspace/components/TradePanel";
import TradeJournal from "../../features/trade-workspace/components/TradeJournal";
import { workspaceService, WORKSPACE_SYMBOLS } from "../../features/trade-workspace/services/workspace.service";
import type { WorkspaceData } from "../../features/trade-workspace/types";

const VALID_SYMBOLS = WORKSPACE_SYMBOLS.map((s) => s.id);

export const TradeWorkspace: React.FC = () => {
  const { symbol = "TCS" } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const upperSymbol = symbol.toUpperCase();

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Redirect invalid symbols
  if (!VALID_SYMBOLS.includes(upperSymbol)) {
    return <Navigate to="/trade/TCS" replace />;
  }

  const symbolMeta = WORKSPACE_SYMBOLS.find((s) => s.id === upperSymbol)!;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await workspaceService.getWorkspaceData(upperSymbol);
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Workspace data load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [upperSymbol]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="trade-workspace-root">
      {/* Top Bar */}
      <div className="workspace-topbar">
        <div className="workspace-topbar-left">
          <div className="workspace-symbol-badge">
            <span className="workspace-symbol-name">{upperSymbol}</span>
            <span className="workspace-symbol-exchange">NSE</span>
          </div>
          <div className="workspace-price-block">
            <span className="workspace-ltp">
              ₹{(data?.symbol.currentPrice ?? symbolMeta.currentPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span
              className="workspace-change"
              style={{ color: (data?.symbol.changePct ?? symbolMeta.changePct) >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}
            >
              {(data?.symbol.changePct ?? symbolMeta.changePct) >= 0 ? "+" : ""}
              {(data?.symbol.changePct ?? symbolMeta.changePct).toFixed(2)}%
            </span>
          </div>
          <div className="workspace-sector-tag">
            {data?.market.sector ?? symbolMeta.sector}
          </div>
        </div>

        <div className="workspace-topbar-right">
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Updated: {lastUpdated || "—"}
          </span>
          <button
            className="workspace-icon-btn"
            onClick={loadData}
            title="Refresh AI Data"
          >
            <RefreshCw size={14} style={{ color: loading ? "var(--accent-purple)" : "var(--text-secondary)" }} />
          </button>
          <button
            className="workspace-icon-btn"
            onClick={() => navigate("/portfolio")}
            title="Open Portfolio"
          >
            <Maximize2 size={14} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* Main Workspace Grid - 2-Column layout for Sprint 6.2 */}
      <div className="workspace-grid-2col">
        {/* Left Column: Watchlist, AI Coach, Journal */}
        <div className="workspace-left-stack">
          <WatchlistSidebar currentSymbol={upperSymbol} />
          
          <AICoach
            symbol={upperSymbol}
            insights={data?.insights ?? []}
            loading={loading}
          />
          
          <TradeJournal symbol={upperSymbol} />
        </div>

        {/* Right Column: Chart, Analysis Panel, Trade Panel */}
        <div className="workspace-right-stack">
          <div className="workspace-chart-wrapper">
            <TradingChart symbol={symbolMeta.tvSymbol} />
          </div>
          
          <AIAnalysisPanel
            symbol={upperSymbol}
            ai={data?.ai ?? {
              opportunityScore: 0, timingScore: 0, riskScore: 0, confidenceScore: 0,
              trend: "Neutral", opportunityStatus: "Watch Closely",
              technicalScore: 0, newsScore: 0, sectorScore: 0, trendScore: 0, volumeScore: 0,
              entryZoneLow: 0, entryZoneHigh: 0, stopLoss: 0, target1: 0, target2: 0, target3: 0,
              bullishScenario: "", bearishScenario: "", suggestedApproach: "",
            }}
            market={data?.market ?? {
              regime: "Bull Market", regimeConfidence: 0,
              sector: "", sectorStrength: 0, sectorTrend: "Neutral",
            }}
            loading={loading}
          />

          <TradePanel
            symbol={upperSymbol}
            currentPrice={data?.symbol.currentPrice ?? symbolMeta.currentPrice}
            ai={data?.ai ?? {
              opportunityScore: 0, timingScore: 0, riskScore: 0, confidenceScore: 0,
              trend: "Neutral", opportunityStatus: "Watch Closely",
              technicalScore: 0, newsScore: 0, sectorScore: 0, trendScore: 0, volumeScore: 0,
              entryZoneLow: symbolMeta.currentPrice * 0.993, entryZoneHigh: symbolMeta.currentPrice * 1.007,
              stopLoss: symbolMeta.currentPrice * 0.975, target1: symbolMeta.currentPrice * 1.018,
              target2: symbolMeta.currentPrice * 1.035, target3: symbolMeta.currentPrice * 1.055,
              bullishScenario: "", bearishScenario: "", suggestedApproach: "",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TradeWorkspace;
