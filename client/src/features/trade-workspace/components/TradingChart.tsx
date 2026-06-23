import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { generateMockCandles } from "../../../mock/candles";
import { markerService, type ChartMarker } from "../../paper-trading/services/marker.service";

interface TradingChartProps {
  symbol: string;
  theme?: "dark" | "light";
  onMarkerClick?: (marker: ChartMarker) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  theme = "dark",
  onMarkerClick,
}) => {
  const containerRef   = useRef<HTMLDivElement>(null);
  const chartRef       = useRef<IChartApi | null>(null);
  const markerLinesRef = useRef<ISeriesApi<"Line">[]>([]);
  const markersRef     = useRef<ChartMarker[]>([]);
  const candleDataRef  = useRef<{ time: Time; open: number; high: number; low: number; close: number }[]>([]);
  const isLoadingRef   = useRef(false);

  // G1: Track the *current* symbol — prevents stale async loads from drawing on wrong chart
  const activeSymbolRef = useRef(symbol);
  useEffect(() => { activeSymbolRef.current = symbol; }, [symbol]);

  // ── Helper: convert ISO string to Unix seconds ────────────────────────────
  const toUnixSec = (iso: string): number =>
    Math.floor(new Date(iso).getTime() / 1000);

  // ── Draw markers as horizontal price lines ────────────────────────────────
  const drawMarkers = useCallback(
    (markers: ChartMarker[]) => {
      const chart = chartRef.current;
      if (!chart) return;

      // Remove old marker series
      markerLinesRef.current.forEach((s) => {
        try { chart.removeSeries(s); } catch { /* already removed */ }
      });
      markerLinesRef.current = [];

      const candleData = candleDataRef.current;
      if (candleData.length === 0) return;

      const firstTime = candleData[0].time as number;
      const lastTime  = candleData[candleData.length - 1].time as number;

      markers.forEach((m) => {
        const ts = toUnixSec(m.created_at);
        const clampedTs = Math.min(Math.max(ts, firstTime), lastTime) as Time;

        const color = m.marker_type === "BUY" ? "#10b981" : "#ef4444";
        const title = `${m.marker_type} ₹${m.price.toLocaleString("en-IN")} ×${m.quantity}`;

        // Add a short horizontal line at the trade price
        const lineSeries = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle: 2, // Dashed
          priceLineVisible: true,
          lastValueVisible: true,
          title,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
          crosshairMarkerBorderColor: color,
          crosshairMarkerBackgroundColor: color,
        });

        // Plot a 3-candle-wide horizontal segment at the marker price
        const candleStep = candleData.length > 1
          ? (candleData[1].time as number) - (candleData[0].time as number)
          : 86400;

        lineSeries.setData([
          { time: Math.max(firstTime, (clampedTs as number) - candleStep) as Time, value: m.price },
          { time: clampedTs, value: m.price },
          { time: Math.min(lastTime, (clampedTs as number) + candleStep) as Time, value: m.price },
        ]);

        markerLinesRef.current.push(lineSeries);
      });

      markersRef.current = markers;
    },
    []
  );

  // ── Load markers from DB / localStorage and draw ─────────────────────────
  const loadAndDrawMarkers = useCallback(async (requestedSymbol?: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const cleanSymbol = (requestedSymbol ?? symbol)
        .includes(":") ? (requestedSymbol ?? symbol).split(":")[1] : (requestedSymbol ?? symbol);

      const markers = await markerService.getMarkersForSymbol(cleanSymbol);

      // G1: Stale-check — discard if symbol changed while we were fetching
      const activeClean = activeSymbolRef.current.includes(":")
        ? activeSymbolRef.current.split(":")[1]
        : activeSymbolRef.current;
      if (cleanSymbol.toUpperCase() !== activeClean.toUpperCase()) {
        console.debug(`[TradingChart] Discarding stale markers for ${cleanSymbol} (active: ${activeClean})`);
        return;
      }

      drawMarkers(markers);
    } catch (err) {
      console.warn("[TradingChart] Failed to load markers:", err);
    } finally {
      isLoadingRef.current = false;
    }
  }, [symbol, drawMarkers]);


  // ── Main chart setup effect ───────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    markerLinesRef.current = [];
    markersRef.current = [];
    candleDataRef.current = [];

    const cleanSymbol = symbol.includes(":") ? symbol.split(":")[1] : symbol;
    const isDark = theme === "dark";

    const chart = createChart(container, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDark ? "rgba(13, 13, 23, 1)" : "#ffffff",
        },
        textColor: isDark ? "#a0aec0" : "#4a5568",
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(170,59,255,0.4)", style: 2 },
        horzLine: { color: "rgba(170,59,255,0.4)", style: 2 },
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        visible: true,
      },
      timeScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: container.clientHeight || 450,
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "rgba(16,185,129,1)",
      downColor: "rgba(239,68,68,1)",
      borderUpColor: "rgba(16,185,129,1)",
      borderDownColor: "rgba(239,68,68,1)",
      wickUpColor: "rgba(16,185,129,1)",
      wickDownColor: "rgba(239,68,68,1)",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });

    const mockData = generateMockCandles(cleanSymbol, 120);

    const candleData = mockData.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleDataRef.current = candleData;

    const volumeData = mockData.map((d) => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
    }));

    candlestickSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    // Load persistent markers after chart data is set
    loadAndDrawMarkers();

    // ── Chart click handler → find closest marker ─────────────────────────
    if (onMarkerClick) {
      chart.subscribeClick((param) => {
        if (!param.time) return;
        const clickedTime = param.time as number;
        const ONE_DAY = 86400;
        const closest = markersRef.current.find(
          (m) => Math.abs(toUnixSec(m.created_at) - clickedTime) <= ONE_DAY
        );
        if (closest) onMarkerClick(closest);
      });
    }

    // ── DOM event listener for live marker updates ────────────────────────
    const handleMarkersUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ symbol: string }>).detail;
      const incomingSymbol = detail?.symbol?.toUpperCase();
      const thisSymbol = cleanSymbol.toUpperCase();
      if (incomingSymbol === thisSymbol) {
        loadAndDrawMarkers();
      }
    };
    window.addEventListener("trademind:markers-updated", handleMarkersUpdated);

    // ── Resize observer ───────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height: height || 450 });
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("trademind:markers-updated", handleMarkersUpdated);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      markerLinesRef.current = [];
    };
  }, [symbol, theme, loadAndDrawMarkers, onMarkerClick]);

  return (
    <div
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "350px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      />

      {/* Symbol label overlay */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(13,13,23,0.75)",
          backdropFilter: "blur(4px)",
          padding: "4px 10px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          fontSize: "11px",
          fontWeight: "600",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#10b981",
          }}
        />
        {symbol} • Daily (Lightweight Chart)
      </div>

      {/* Marker legend */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "rgba(13,13,23,0.75)",
          backdropFilter: "blur(4px)",
          padding: "4px 10px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          fontSize: "10px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <span style={{ color: "#10b981", fontWeight: 700 }}>— BUY</span>
        <span style={{ color: "#ef4444", fontWeight: 700 }}>— SELL</span>
        <span style={{ opacity: 0.6 }}>click to view</span>
      </div>
    </div>
  );
};

export default TradingChart;
