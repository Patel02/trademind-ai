import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Maximize2, RefreshCw } from "lucide-react";
import TradingChart from "../../../features/trade-workspace/components/TradingChart";
import WatchlistSidebar from "../../../features/trade-workspace/components/WatchlistSidebar";
import AIAnalysisPanel from "../../../features/trade-workspace/components/AIAnalysisPanel";
import AICoach from "../../../features/trade-workspace/components/AICoach";
import TradePanel from "../../../features/trade-workspace/components/TradePanel";
import TradeJournal from "../../../features/trade-workspace/components/TradeJournal";
import TradeDetailModal from "../../../features/trade-workspace/components/TradeDetailModal";
import { workspaceService, WORKSPACE_SYMBOLS } from "../../../features/trade-workspace/services/workspace.service";
import type { WorkspaceData } from "../../../features/trade-workspace/types";
import type { ChartMarker } from "../../../features/paper-trading/services/marker.service";
import { markerService } from "../../../features/paper-trading/services/marker.service";

const VALID_SYMBOLS = WORKSPACE_SYMBOLS.map((s) => s.id);

export default function TradePage({
  params: initialParams,
}: {
  params?: { symbol: string };
} = {}) {
  const routerParams = useParams<{ symbol: string }>();
  const symbol = (initialParams?.symbol || routerParams.symbol || "TCS").toUpperCase();
  const navigate = useNavigate();

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Trade Detail Modal state
  const [selectedMarker, setSelectedMarker] = useState<ChartMarker | null>(null);

  // Redirect invalid symbols
  useEffect(() => {
    if (!VALID_SYMBOLS.includes(symbol)) {
      navigate("/trade/TCS", { replace: true });
    }
  }, [symbol, navigate]);

  const symbolMeta = WORKSPACE_SYMBOLS.find((s) => s.id === symbol) || WORKSPACE_SYMBOLS[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await workspaceService.getWorkspaceData(symbol);
      setData(result);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (err) {
      console.error("Workspace data load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Preload markers on mount so chart gets them immediately ──────────────────
  useEffect(() => {
    markerService.getMarkersForSymbol(symbol).catch(() => {/* silent preload */});
  }, [symbol]);

  // ── Handler: TradePanel completed → emit marker update ───────────────────────
  const handleTradeComplete = useCallback(() => {
    markerService.emitMarkersUpdated(symbol);
  }, [symbol]);

  // ── Handler: chart marker clicked ───────────────────────────────────────────
  const handleMarkerClick = useCallback((marker: ChartMarker) => {
    setSelectedMarker(marker);
  }, []);

  if (!VALID_SYMBOLS.includes(symbol)) {
    return <Navigate to="/trade/TCS" replace />;
  }

  const currentPrice = data?.symbol.currentPrice ?? symbolMeta.currentPrice;

  const emptyAI = {
    opportunityScore: 0,
    timingScore: 0,
    riskScore: 0,
    confidenceScore: 0,
    trend: "Neutral" as const,
    opportunityStatus: "Watch Closely" as const,
    technicalScore: 0,
    newsScore: 0,
    sectorScore: 0,
    trendScore: 0,
    volumeScore: 0,
    entryZoneLow: symbolMeta.currentPrice * 0.993,
    entryZoneHigh: symbolMeta.currentPrice * 1.007,
    stopLoss: symbolMeta.currentPrice * 0.975,
    target1: symbolMeta.currentPrice * 1.018,
    target2: symbolMeta.currentPrice * 1.035,
    target3: symbolMeta.currentPrice * 1.055,
    bullishScenario: "",
    bearishScenario: "",
    suggestedApproach: "",
  };

  return (
    <div className="trade-workspace-root">
      {/* Trade Detail Modal */}
      <TradeDetailModal
        marker={selectedMarker}
        currentPrice={currentPrice}
        onClose={() => setSelectedMarker(null)}
      />

      {/* Top Bar */}
      <div className="workspace-topbar">
        <div className="workspace-topbar-left">
          <div className="workspace-symbol-badge">
            <span className="workspace-symbol-name">{symbol}</span>
            <span className="workspace-symbol-exchange">NSE</span>
          </div>
          <div className="workspace-price-block">
            <span className="workspace-ltp">
              ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span
              className="workspace-change"
              style={{
                color:
                  (data?.symbol.changePct ?? symbolMeta.changePct) >= 0
                    ? "var(--accent-green)"
                    : "var(--accent-red)",
              }}
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
            <RefreshCw
              size={14}
              style={{ color: loading ? "var(--accent-purple)" : "var(--text-secondary)" }}
              className={loading ? "spin-animation" : ""}
            />
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

      {/* Main Workspace Grid */}
      <div className="workspace-grid-2col">
        {/* Left Column: Watchlist, AI Coach, Journal */}
        <div className="workspace-left-stack">
          <WatchlistSidebar currentSymbol={symbol} />

          <AICoach
            symbol={symbol}
            insights={data?.insights ?? []}
            loading={loading}
          />

          <TradeJournal symbol={symbol} />
        </div>

        {/* Right Column: Chart, Analysis Panel, Trade Panel */}
        <div className="workspace-right-stack">
          <div className="workspace-chart-wrapper">
            <TradingChart
              symbol={symbolMeta.tvSymbol}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          <AIAnalysisPanel
            symbol={symbol}
            ai={data?.ai ?? emptyAI}
            market={data?.market ?? {
              regime: "Bull Market",
              regimeConfidence: 0,
              sector: "",
              sectorStrength: 0,
              sectorTrend: "Neutral",
            }}
            loading={loading}
          />

          <TradePanel
            symbol={symbol}
            currentPrice={currentPrice}
            ai={data?.ai ?? emptyAI}
            onTradeComplete={handleTradeComplete}
          />
        </div>
      </div>
    </div>
  );
}
