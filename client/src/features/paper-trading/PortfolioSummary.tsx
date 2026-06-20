import React from "react";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, BarChart2 } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import type { PaperPortfolio, PaperPosition } from "./paper-trading.service";

interface PortfolioSummaryProps {
  portfolio: PaperPortfolio;
  positions: PaperPosition[];
  onReset: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  portfolio,
  positions,
  onReset,
  onRefresh,
  refreshing
}) => {
  // 1. Calculate NAV and Unrealized PnL
  const cash = portfolio.balance;
  const holdingsValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.current_price, 0);
  const holdingsCost = positions.reduce((sum, pos) => sum + pos.quantity * pos.avg_entry_price, 0);
  
  const nav = Number((cash + holdingsValue).toFixed(2));
  const unrealizedPnL = Number((holdingsValue - holdingsCost).toFixed(2));
  const totalPnL = Number((nav - portfolio.start_balance).toFixed(2));
  const totalPnLPct = Number(((totalPnL / portfolio.start_balance) * 100).toFixed(2));
  const unrealizedPnLPct = holdingsCost > 0 ? Number(((unrealizedPnL / holdingsCost) * 100).toFixed(2)) : 0.00;

  const isTotalProfit = totalPnL >= 0;
  const isUnrealizedProfit = unrealizedPnL >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="portfolio-summary-wrapper">
      
      {/* Action Header bar inside Summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge variant="success" style={{ fontWeight: "800", fontSize: "11px", letterSpacing: "0.5px", padding: "4px 8px" }}>
            VIRTUAL DESK ACTIVE
          </Badge>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Initial capital: ₹{(portfolio.start_balance).toLocaleString()}
          </span>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={onRefresh}
            disabled={refreshing}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              background: "rgba(255,255,255,0.03)", 
              border: "1px solid var(--border)", 
              padding: "6px 12px", 
              borderRadius: "8px", 
              color: "#fff", 
              fontSize: "12.5px", 
              cursor: "pointer", 
              transition: "var(--transition-speed)",
              outline: "none"
            }}
            className="hover-bright"
          >
            <RefreshCw size={12} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Updating prices..." : "Sync prices"}</span>
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to reset your virtual portfolio? All active holdings and history will be cleared.")) {
                onReset();
              }
            }}
            style={{ 
              background: "rgba(239, 68, 68, 0.08)", 
              border: "1px solid rgba(239, 68, 68, 0.3)", 
              padding: "6px 12px", 
              borderRadius: "8px", 
              color: "var(--accent-red)", 
              fontSize: "12.5px", 
              cursor: "pointer", 
              transition: "var(--transition-speed)",
              outline: "none"
            }}
            className="hover-bright"
          >
            Reset Portfolio
          </button>
        </div>
      </div>

      {/* 4-Card Summary Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }} className="summary-cards-grid">
        
        {/* Card 1: Net Asset Value (NAV) */}
        <Card 
          title="Net Asset Value (NAV)" 
          extra={<BarChart2 size={18} color="var(--accent-blue)" />}
        >
          <div>
            <h3 style={{ fontSize: "28px", fontWeight: "850", margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>
              ₹{nav.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
              Cash + holdings valuation
            </span>
          </div>
        </Card>

        {/* Card 2: Cash Balance */}
        <Card 
          title="Virtual Buying Power" 
          extra={<Wallet size={18} color="var(--accent-yellow)" />}
        >
          <div>
            <h3 style={{ fontSize: "28px", fontWeight: "850", margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>
              ₹{cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
              Available virtual capital
            </span>
          </div>
        </Card>

        {/* Card 3: Unrealized Profit/Loss */}
        <Card 
          title="Unrealized Return" 
          extra={isUnrealizedProfit ? <TrendingUp size={18} color="var(--accent-green)" /> : <TrendingDown size={18} color="var(--accent-red)" />}
        >
          <div>
            <h3 style={{ 
              fontSize: "28px", 
              fontWeight: "850", 
              margin: 0, 
              color: isUnrealizedProfit ? "var(--accent-green)" : "var(--accent-red)",
              letterSpacing: "-0.5px" 
            }}>
              {isUnrealizedProfit ? "+" : ""}₹{unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ 
              fontSize: "12px", 
              color: isUnrealizedProfit ? "var(--accent-green)" : "var(--accent-red)", 
              display: "block", 
              marginTop: "4px",
              fontWeight: "600"
            }}>
              {isUnrealizedProfit ? "▲" : "▼"} {unrealizedPnLPct}% on holdings
            </span>
          </div>
        </Card>

        {/* Card 4: Total Realized/Real PnL Return */}
        <Card 
          title="Total Account Yield" 
          extra={isTotalProfit ? <TrendingUp size={18} color="var(--accent-green)" /> : <TrendingDown size={18} color="var(--accent-red)" />}
        >
          <div>
            <h3 style={{ 
              fontSize: "28px", 
              fontWeight: "850", 
              margin: 0, 
              color: isTotalProfit ? "var(--accent-green)" : "var(--accent-red)",
              letterSpacing: "-0.5px" 
            }}>
              {isTotalProfit ? "+" : ""}₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ 
              fontSize: "12px", 
              color: isTotalProfit ? "var(--accent-green)" : "var(--accent-red)", 
              display: "block", 
              marginTop: "4px",
              fontWeight: "600"
            }}>
              {isTotalProfit ? "▲" : "▼"} {totalPnLPct}% total return
            </span>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default PortfolioSummary;
