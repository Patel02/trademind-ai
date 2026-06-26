import React, { useEffect, useRef } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Layers,
  FileText,
} from "lucide-react";
import type { ChartMarker } from "../../paper-trading/services/marker.service";

interface TradeDetailModalProps {
  marker: ChartMarker | null;
  currentPrice?: number;
  onClose: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  marker,
  currentPrice,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!marker) return null;

  const isBuy = marker.marker_type === "BUY";
  const tradeValue = marker.price * marker.quantity;

  // PnL calculation (only meaningful for BUY markers with live price)
  const livePnl =
    isBuy && currentPrice
      ? (currentPrice - marker.price) * marker.quantity
      : null;
  const livePnlPct =
    isBuy && currentPrice
      ? ((currentPrice - marker.price) / marker.price) * 100
      : null;

  const accentColor = isBuy ? "#10b981" : "#ef4444";
  const bgAccent = isBuy ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)";
  const borderAccent = isBuy ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #0f1120 0%, #13162a 100%)",
          border: `1px solid ${borderAccent}`,
          borderRadius: "18px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${borderAccent}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: `1px solid ${borderAccent}`,
            background: bgAccent,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: isBuy ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${accentColor}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              {isBuy ? <TrendingUp size={20} color={accentColor} /> : <TrendingDown size={20} color={accentColor} />}
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#fff",
                  letterSpacing: "-0.5px",
                }}
              >
                {marker.symbol}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: accentColor,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {marker.marker_type} Marker
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ padding: "20px 22px" }}>
          {/* Price + Qty */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div style={statCard}>
              <div style={statLabel}>
                <Tag size={11} /> {isBuy ? "Entry Price" : "Exit Price"}
              </div>
              <div style={{ ...statValue, color: accentColor }}>
                ₹{fmt(marker.price)}
              </div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>
                <Layers size={11} /> Quantity
              </div>
              <div style={statValue}>{marker.quantity.toLocaleString()} shares</div>
            </div>
          </div>

          {/* Trade Value */}
          <div
            style={{
              ...statCard,
              marginBottom: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={statLabel}>Trade Value</div>
              <div style={{ ...statValue, fontSize: "20px" }}>₹{fmt(tradeValue)}</div>
            </div>
            {livePnl !== null && livePnlPct !== null && (
              <div style={{ textAlign: "right" }}>
                <div style={statLabel}>Unrealized PnL</div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: livePnl >= 0 ? "#10b981" : "#ef4444",
                    letterSpacing: "-0.4px",
                  }}
                >
                  {livePnl >= 0 ? "+" : ""}₹{fmt(Math.abs(livePnl))}
                  <span style={{ fontSize: "11px", marginLeft: "4px", opacity: 0.8 }}>
                    ({livePnlPct >= 0 ? "+" : ""}{livePnlPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div
            style={{
              ...statCard,
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Calendar size={14} color="var(--text-secondary)" />
            <div>
              <div style={statLabel}>Trade Time</div>
              <div style={{ fontSize: "13px", color: "#fff", fontWeight: "600" }}>
                {fmtDate(marker.created_at)}
              </div>
            </div>
          </div>

          {/* Notes */}
          {marker.notes && (
            <div style={{ ...statCard, marginBottom: "14px" }}>
              <div style={{ ...statLabel, marginBottom: "6px" }}>
                <FileText size={11} /> Trade Notes
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  fontStyle: "italic",
                }}
              >
                "{marker.notes}"
              </div>
            </div>
          )}

          {/* Trade ID */}
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              textAlign: "center",
              opacity: 0.5,
              fontFamily: "monospace",
            }}
          >
            Trade ID: {marker.trade_id ?? marker.id}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: `1px solid ${borderAccent}`,
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              window.location.href = "/history";
            }}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}88)`,
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "700",
              fontFamily: "inherit",
            }}
          >
            View Full Trade History →
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const statCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "10px",
  padding: "10px 14px",
};

const statLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10px",
  fontWeight: "700",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "4px",
};

const statValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#fff",
  letterSpacing: "-0.4px",
};

export default TradeDetailModal;
