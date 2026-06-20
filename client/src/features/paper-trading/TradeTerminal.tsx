import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, ShieldAlert, Cpu } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { paperTradingService, type PaperPosition } from "./paper-trading.service";

interface TradeTerminalProps {
  balance: number;
  positions: PaperPosition[];
  onOrderPlaced: () => void;
}

export const TradeTerminal: React.FC<TradeTerminalProps> = ({
  balance,
  positions,
  onOrderPlaced
}) => {
  const [symbol, setSymbol] = useState("TCS");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<number>(10);
  const [price, setPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch price when symbol changes
  const fetchPrice = async (ticker: string) => {
    setLoadingPrice(true);
    setErrorMsg(null);
    try {
      const p = await paperTradingService.getStockPrice(ticker);
      setPrice(p);
    } catch (err) {
      setErrorMsg("Failed to resolve current market price.");
    } finally {
      setLoadingPrice(false);
    }
  };

  useEffect(() => {
    fetchPrice(symbol);
  }, [symbol]);

  // 2. Validate trade details in real-time
  const totalCost = Number((price * quantity).toFixed(2));
  const currentHolding = positions.find((p) => p.symbol === symbol)?.quantity || 0;
  
  const hasInsufficientBalance = type === "BUY" && balance < totalCost;
  const hasInsufficientHoldings = type === "SELL" && currentHolding < quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    
    setErrorMsg(null);
    setExecuting(true);

    try {
      const res = await paperTradingService.placeOrder(symbol, type, quantity);
      if (res.success) {
        alert(res.message);
        onOrderPlaced();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during execution.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card 
      title="Trade Execution Terminal" 
      subtitle="Simulate instant market order fills"
      extra={<Cpu size={16} color="var(--accent-purple)" />}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* Toggle BUY/SELL */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(0,0,0,0.15)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setType("BUY")}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "none",
              background: type === "BUY" ? "var(--accent-green)" : "transparent",
              color: type === "BUY" ? "#000" : "var(--text-secondary)",
              fontWeight: "750",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all var(--transition-speed)"
            }}
          >
            <ArrowUpRight size={14} />
            <span>BUY SETUP</span>
          </button>
          <button
            type="button"
            onClick={() => setType("SELL")}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "none",
              background: type === "SELL" ? "var(--accent-red)" : "transparent",
              color: type === "SELL" ? "#fff" : "var(--text-secondary)",
              fontWeight: "750",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all var(--transition-speed)"
            }}
          >
            <ArrowDownRight size={14} />
            <span>SELL SETUP</span>
          </button>
        </div>

        {/* Stock Selector */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
            Select Asset Symbol
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px 10px", 
              background: "rgba(0,0,0,0.2)", 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              color: "#fff", 
              outline: "none" 
            }}
          >
            <option value="TCS">TCS (Tata Consultancy Services)</option>
            <option value="RELIANCE">RELIANCE (Reliance Industries)</option>
            <option value="INFY">INFY (Infosys)</option>
            <option value="HDFCBANK">HDFCBANK (HDFC Bank)</option>
          </select>
        </div>

        {/* Position Context Helper */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Your holdings:</span>
          <strong style={{ color: "#fff" }}>{currentHolding} shares owned</strong>
        </div>

        {/* Quantity and Price Display */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
              Order Quantity
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              style={{ 
                width: "100%", 
                padding: "8px 10px", 
                background: "rgba(0,0,0,0.2)", 
                border: "1px solid var(--border)", 
                borderRadius: "8px", 
                color: "#fff", 
                outline: "none",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
              Est. Price
            </label>
            <div style={{ 
              padding: "8px 10px", 
              background: "rgba(0,0,0,0.1)", 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              color: "#fff", 
              fontWeight: "700", 
              fontSize: "14px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box"
            }}>
              {loadingPrice ? "Loading..." : `₹${price.toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Warnings and Estimates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Estimated Trade Value:</span>
            <strong style={{ color: "#fff" }}>₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          {hasInsufficientBalance && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "8px 12px", color: "var(--accent-red)", fontSize: "11.5px" }}>
              <ShieldAlert size={14} style={{ flexShrink: 0 }} />
              <span>Insufficient buying power to execute this BUY order.</span>
            </div>
          )}

          {hasInsufficientHoldings && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "8px 12px", color: "var(--accent-red)", fontSize: "11.5px" }}>
              <ShieldAlert size={14} style={{ flexShrink: 0 }} />
              <span>Insufficient holdings. You cannot sell more shares than you hold.</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "8px 12px", color: "var(--accent-red)", fontSize: "11.5px" }}>
              <ShieldAlert size={14} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "6px" }}>
          <Button
            type="submit"
            variant="primary"
            disabled={executing || hasInsufficientBalance || hasInsufficientHoldings}
            style={{ 
              width: "100%", 
              background: type === "BUY" ? "var(--accent-green)" : "var(--accent-red)",
              color: type === "BUY" ? "#000" : "#fff",
              fontWeight: "800",
              boxShadow: type === "BUY" ? "0 0 10px rgba(16,185,129,0.15)" : "0 0 10px rgba(239,68,68,0.15)"
            }}
          >
            {executing ? "Processing..." : `EXECUTE ${type} ORDER`}
          </Button>
        </div>

      </form>
    </Card>
  );
};

export default TradeTerminal;
