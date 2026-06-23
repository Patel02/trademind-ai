import React, { useState, useEffect } from "react";
import { Sliders, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { 
  portfolioDoctorService, 
  type PortfolioDiagnosis, 
  stockSectors 
} from "./portfolio-doctor.service";
import type { PaperPortfolio, PaperPosition } from "../paper-trading/paper-trading.service";

interface RebalanceSimulatorProps {
  portfolio: PaperPortfolio;
  positions: PaperPosition[];
  onSimulationUpdate: (simulatedDiag: PortfolioDiagnosis | null) => void;
  stockPrices: Record<string, number>;
  goal?: "Conservative" | "Balanced" | "Aggressive";
}

export const RebalanceSimulator: React.FC<RebalanceSimulatorProps> = ({
  portfolio,
  positions,
  onSimulationUpdate,
  stockPrices,
  goal = "Balanced"
}) => {
  const allSymbols = ["TCS", "RELIANCE", "INFY", "HDFCBANK"];
  const totalNAV = portfolio.balance + positions.reduce((sum, p) => sum + p.quantity * p.current_price, 0);

  // 1. Quantities State
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize quantities matching active positions
  const resetToActual = () => {
    const initialQtys: Record<string, number> = {};
    allSymbols.forEach((sym) => {
      const pos = positions.find((p) => p.symbol.toUpperCase() === sym);
      initialQtys[sym] = pos ? pos.quantity : 0;
    });
    setQuantities(initialQtys);
    onSimulationUpdate(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    resetToActual();
  }, [positions]);

  // 2. Perform Real-time simulations
  const handleQuantityChange = (sym: string, val: number) => {
    const updated = {
      ...quantities,
      [sym]: val
    };
    setQuantities(updated);

    // Calculate simulated cash and values
    let simulatedHoldingsValue = 0;
    allSymbols.forEach((s) => {
      const price = stockPrices[s] || 1000.00;
      simulatedHoldingsValue += updated[s] * price;
    });

    const simulatedCash = totalNAV - simulatedHoldingsValue;

    if (simulatedCash < 0) {
      setErrorMsg("Simulated allocation exceeds Net Asset Value (NAV).");
      onSimulationUpdate(null);
      return;
    } else {
      setErrorMsg(null);
    }

    // Build simulated models to diagnose
    const simulatedPortfolio: PaperPortfolio = {
      ...portfolio,
      balance: Number(simulatedCash.toFixed(2))
    };

    const simulatedPositions: PaperPosition[] = allSymbols
      .filter((s) => updated[s] > 0)
      .map((s) => {
        const price = stockPrices[s] || 1000.00;
        const actualPos = positions.find((p) => p.symbol === s);
        const avgPrice = actualPos?.avg_entry_price || price;
        return {
          id: actualPos?.id || `sim-pos-${s}`,
          user_id: portfolio.user_id,
          symbol: s,
          quantity: updated[s],
          avg_entry_price: avgPrice,
          avg_price: avgPrice,
          current_price: price,
          unrealized_pnl: (price - avgPrice) * updated[s],
          realized_pnl: actualPos?.realized_pnl || 0,
          created_at: actualPos?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: actualPos?.status || "open" // B3 status field fix
        };
      });

    const simulatedDiag = portfolioDoctorService.diagnosePortfolio(
      simulatedPortfolio,
      simulatedPositions,
      goal
    );

    onSimulationUpdate(simulatedDiag);
  };

  // Calculations for display
  let currentSimValue = 0;
  allSymbols.forEach((s) => {
    currentSimValue += (quantities[s] || 0) * (stockPrices[s] || 1000);
  });
  const currentSimCash = Math.max(0, totalNAV - currentSimValue);

  return (
    <Card 
      title="Asset Rebalancing Simulator" 
      subtitle="Model transaction allocations to optimize health"
      extra={<Sliders size={18} color="var(--accent-purple)" />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        
        {/* Helper Instructions */}
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          Drag the sliders below to simulate modifying your share count. The Doctor will dynamically recalculate the estimated Health Score.
        </p>

        {/* Quantities Sliders list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {allSymbols.map((sym) => {
            const qty = quantities[sym] || 0;
            const price = stockPrices[sym] || 1000;
            const value = qty * price;
            const pct = totalNAV > 0 ? ((value / totalNAV) * 100).toFixed(1) : "0.0";
            
            // Calculate max buyable for slider limit
            const currentActual = positions.find((p) => p.symbol === sym)?.quantity || 0;
            const maxBuyableLimit = Math.min(
              1000, 
              currentActual + Math.floor(currentSimCash / price)
            );

            const sectorInfo = stockSectors[sym];

            return (
              <div 
                key={sym} 
                style={{ 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px", 
                  padding: "10px",
                  background: "rgba(255,255,255,0.01)" 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div>
                    <strong style={{ color: "#fff", fontSize: "13.5px" }}>{sym}</strong>{" "}
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                      ({sectorInfo?.sector})
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", textAlign: "right" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{qty} shares</span>{" "}
                    <strong style={{ color: "var(--accent-purple)", marginLeft: "4px" }}>{pct}%</strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(currentActual, maxBuyableLimit)}
                    step="1"
                    value={qty}
                    onChange={(e) => handleQuantityChange(sym, parseInt(e.target.value) || 0)}
                    style={{ flexGrow: 1 }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", width: "60px", textAlign: "right", flexShrink: 0 }}>
                    ₹{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cash Allocation indicator */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Simulated Cash Power:</span>
            <strong style={{ color: "var(--accent-yellow)" }}>
              ₹{currentSimCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          {errorMsg && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "8px 12px", color: "var(--accent-red)", fontSize: "11.5px" }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Action Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
          <Button 
            variant="secondary" 
            onClick={resetToActual} 
            icon={<RefreshCw size={13} />}
          >
            Reset Simulation
          </Button>

          <Button 
            variant="primary" 
            disabled={!!errorMsg}
            onClick={() => alert("Simulation setup modeled! Review suggestions & execute reallocations in Paper Trading.")}
            icon={<ShieldCheck size={14} />}
            style={{ background: "var(--accent-purple)", color: "#fff" }}
          >
            Confirm Targets
          </Button>
        </div>

      </div>
    </Card>
  );
};

export default RebalanceSimulator;
