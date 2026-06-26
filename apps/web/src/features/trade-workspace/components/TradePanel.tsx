import React, { useState } from "react";
import { ShoppingCart, TrendingDown, Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { paperTradingService } from "../../../features/paper-trading/paper-trading.service";
import { portfolioDoctorService } from "../../portfolio-doctor/portfolio-doctor.service";
import type { WorkspaceAIData } from "../types";

interface TradePanelProps {
  symbol: string;
  currentPrice: number;
  ai: WorkspaceAIData;
  onTradeComplete?: () => void;
}

type OrderState = "idle" | "loading" | "success" | "error";

export const TradePanel: React.FC<TradePanelProps> = ({ symbol, currentPrice, ai, onTradeComplete }) => {
  const [quantity, setQuantity] = useState(1);
  const [orderNote, setOrderNote] = useState("");
  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [orderMsg, setOrderMsg] = useState("");

  // Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<"BUY" | "SELL">("BUY");
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  const handlePreviewImpact = async (action: "BUY" | "SELL") => {
    try {
      const port = await paperTradingService.getPortfolio();
      const pos = await paperTradingService.getPositions();
      const goal = (localStorage.getItem("trademind_portfolio_goal") as any) || "Balanced";
      const result = portfolioDoctorService.previewTradeImpact(port, pos, symbol, action, quantity, currentPrice, goal);
      setPreviewResult(result);
      setPreviewAction(action);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Failed to calculate trade impact preview:", err);
    }
  };

  const totalValue = (quantity * currentPrice).toFixed(2);

  const executeOrder = async (type: "BUY" | "SELL") => {
    if (quantity <= 0) {
      setOrderMsg("Quantity must be at least 1 share.");
      setOrderState("error");
      return;
    }
    setOrderState("loading");
    setOrderMsg("");

    try {
      const result = await paperTradingService.placeOrder(symbol, type, quantity, orderNote);
      if (result.success) {
        setOrderState("success");
        setOrderMsg(result.message);
        setQuantity(1);
        setOrderNote("");
        // Notify parent so chart can reload markers
        setTimeout(() => onTradeComplete?.(), 100);
      } else {
        setOrderState("error");
        setOrderMsg(result.message);
      }
    } catch (err: any) {
      setOrderState("error");
      setOrderMsg(err.message || "Order execution failed.");
    }

    // Auto-reset after 3s
    setTimeout(() => {
      setOrderState("idle");
      setOrderMsg("");
    }, 3000);
  };

  return (
    <div className="trade-panel">
      <div className="workspace-section-label" style={{ marginBottom: "12px" }}>
        📋 Paper Trade — {symbol}
      </div>

      {/* Current price */}
      <div className="trade-price-row">
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>LTP (Last Traded Price)</span>
        <span style={{ fontSize: "20px", fontWeight: "800", color: "#fff", letterSpacing: "-0.5px" }}>
          ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Entry zone hint */}
      <div style={{
        padding: "6px 10px",
        background: "rgba(139, 92, 246, 0.06)",
        border: "1px solid rgba(139, 92, 246, 0.18)",
        borderRadius: "6px",
        fontSize: "11px",
        color: "var(--text-secondary)",
        marginBottom: "12px"
      }}>
        AI Entry Zone: <strong style={{ color: "var(--accent-purple)" }}>₹{ai.entryZoneLow.toLocaleString()} – ₹{ai.entryZoneHigh.toLocaleString()}</strong>
      </div>

      {/* Quantity Input */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "5px" }}>
          Quantity (Shares)
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "#fff", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >−</button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            style={{ flex: 1, padding: "8px 10px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)", borderRadius: "6px", color: "#fff", outline: "none", textAlign: "center", fontSize: "15px", fontWeight: "700" }}
          />
          <button
            onClick={() => setQuantity((q) => q + 1)}
            style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "#fff", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >+</button>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "5px", textAlign: "right" }}>
          Total Value: <strong style={{ color: "#fff" }}>₹{Number(totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>
      </div>

      {/* Pre-trade note */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "5px" }}>
          Trade Note (Optional)
        </label>
        <textarea
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Reason for this trade..."
          rows={2}
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "#fff",
            outline: "none",
            fontSize: "12px",
            resize: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Order Status Banner */}
      {orderState !== "idle" && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          marginBottom: "12px",
          background: orderState === "success" ? "rgba(16,185,129,0.08)" : orderState === "error" ? "rgba(239,68,68,0.08)" : "rgba(139,92,246,0.08)",
          border: `1px solid ${orderState === "success" ? "rgba(16,185,129,0.25)" : orderState === "error" ? "rgba(239,68,68,0.25)" : "rgba(139,92,246,0.25)"}`,
          fontSize: "12px",
        }}>
          {orderState === "loading" && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} color="var(--accent-purple)" />}
          {orderState === "success" && <CheckCircle2 size={14} color="var(--accent-green)" />}
          {orderState === "error" && <XCircle size={14} color="var(--accent-red)" />}
          <span style={{ color: orderState === "success" ? "var(--accent-green)" : orderState === "error" ? "var(--accent-red)" : "var(--text-primary)" }}>
            {orderState === "loading" ? "Executing order..." : orderMsg}
          </span>
        </div>
      )}

      {/* Preview Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <button
          type="button"
          onClick={() => handlePreviewImpact("BUY")}
          disabled={orderState === "loading"}
          style={{
            padding: "8px",
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "750",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
          }}
        >
          <Sparkles size={11} color="var(--accent-purple)" />
          <span>Preview BUY</span>
        </button>
        <button
          type="button"
          onClick={() => handlePreviewImpact("SELL")}
          disabled={orderState === "loading"}
          style={{
            padding: "8px",
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "750",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.08)";
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
          }}
        >
          <Sparkles size={11} color="var(--accent-purple)" />
          <span>Preview SELL</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button
          className="trade-btn buy-btn"
          onClick={() => executeOrder("BUY")}
          disabled={orderState === "loading"}
        >
          <ShoppingCart size={14} />
          <span>Paper BUY</span>
        </button>
        <button
          className="trade-btn sell-btn"
          onClick={() => executeOrder("SELL")}
          disabled={orderState === "loading"}
        >
          <TrendingDown size={14} />
          <span>Paper SELL</span>
        </button>
      </div>

      {/* SL reminder */}
      <div style={{ marginTop: "10px", fontSize: "10.5px", color: "var(--text-secondary)", textAlign: "center" }}>
        AI Stop Loss: <strong style={{ color: "var(--accent-red)" }}>₹{ai.stopLoss.toLocaleString()}</strong>
        {" "}|{" "}
        T1: <strong style={{ color: "var(--accent-green)" }}>₹{ai.target1.toLocaleString()}</strong>
      </div>

      {/* Preview Modal Overlay */}
      {isPreviewOpen && previewResult && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(10, 10, 10, 0.80)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#0f0f0f",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            padding: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            textAlign: "left"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <strong style={{ fontSize: "14px", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} color="var(--accent-purple)" />
                Decision Impact Preview
              </strong>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "18px", cursor: "pointer" }}
              >×</button>
            </div>

            <div>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", display: "block" }}>Order Details</span>
              <strong style={{ fontSize: "13px", color: "#fff" }}>
                {previewAction} {quantity} Shares of {symbol} @ ₹{currentPrice.toLocaleString()}
              </strong>
            </div>

            {/* Simulated Score Comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block" }}>HEALTH SCORE</span>
                <strong style={{ fontSize: "15px", color: previewResult.simulated.healthScore >= previewResult.current.healthScore ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {previewResult.current.healthScore} → {previewResult.simulated.healthScore}
                </strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block" }}>CASH %</span>
                <strong style={{ fontSize: "15px", color: "#fff" }}>
                  {previewResult.current.cashPct.toFixed(1)}% → {previewResult.simulated.cashPct.toFixed(1)}%
                </strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block" }}>CONCENTRATION</span>
                <strong style={{ fontSize: "15px", color: "#fff" }}>
                  {previewResult.current.concentrationPct.toFixed(1)}% → {previewResult.simulated.concentrationPct.toFixed(1)}%
                </strong>
              </div>
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontSize: "9px", color: "var(--text-secondary)", display: "block" }}>IT EXPOSURE</span>
                <strong style={{ fontSize: "15px", color: "#fff" }}>
                  {previewResult.current.itExposurePct.toFixed(1)}% → {previewResult.simulated.itExposurePct.toFixed(1)}%
                </strong>
              </div>
            </div>

            {/* Warnings list */}
            {previewResult.warnings.length > 0 ? (
              <div style={{ background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "8px", padding: "10px 14px" }}>
                <strong style={{ fontSize: "11px", color: "var(--accent-red)", display: "block", marginBottom: "4px" }}>Hedge Warnings Flagged:</strong>
                {previewResult.warnings.map((w: string, idx: number) => (
                  <div key={idx} style={{ display: "flex", gap: "6px", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "3px" }}>
                    <span style={{ color: "var(--accent-red)" }}>•</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "8px", padding: "10px 14px", display: "flex", gap: "8px", alignItems: "center", fontSize: "11.5px", color: "var(--accent-green)" }}>
                <CheckCircle2 size={13} />
                <span>Trade matches target risk and allocation limits.</span>
              </div>
            )}

            {/* Modal Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setIsPreviewOpen(false)}
                style={{ padding: "8px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  executeOrder(previewAction);
                  setIsPreviewOpen(false);
                }}
                style={{ padding: "8px", background: "var(--accent-purple)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: "750", cursor: "pointer" }}
              >
                Execute {previewAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradePanel;
