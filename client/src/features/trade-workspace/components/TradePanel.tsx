import React, { useState } from "react";
import { ShoppingCart, TrendingDown, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { paperTradingService } from "../../../features/paper-trading/paper-trading.service";
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
    </div>
  );
};

export default TradePanel;
