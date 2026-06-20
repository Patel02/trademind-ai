import type { PaperPortfolio, PaperPosition } from "../paper-trading/paper-trading.service";

export interface SectorAllocation {
  sector: string;
  value: number;
  allocationPct: number;
  color: string;
}

export interface StockAllocation {
  symbol: string;
  value: number;
  allocationPct: number;
}

export interface PortfolioDiagnosis {
  nav: number;
  holdingsValue: number;
  holdingsCost: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  cashPct: number;
  healthScore: number;
  diversificationLevel: string;
  diversificationBadge: "success" | "info" | "warning" | "danger";
  volatilityDrag: number;
  riskIndex: "Low" | "Medium" | "High";
  sectorAllocations: SectorAllocation[];
  stockAllocations: StockAllocation[];
  suggestions: { id: number; text: string; type: "warning" | "info" | "success" }[];
}

export const stockSectors: Record<string, { sector: string; color: string }> = {
  TCS: { sector: "IT Services", color: "var(--accent-yellow)" },
  INFY: { sector: "IT Services", color: "var(--accent-yellow)" },
  RELIANCE: { sector: "Energy & Infra", color: "var(--accent-blue)" },
  HDFCBANK: { sector: "Financials", color: "var(--accent-green)" }
};

export const portfolioDoctorService = {
  /**
   * Run detailed diagnostic audit on the portfolio cash balance and positions.
   */
  diagnosePortfolio(portfolio: PaperPortfolio, positions: PaperPosition[]): PortfolioDiagnosis {
    const cash = portfolio.balance;
    const holdingsValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.current_price, 0);
    const holdingsCost = positions.reduce((sum, pos) => sum + pos.quantity * pos.avg_entry_price, 0);
    
    const nav = Number((cash + holdingsValue).toFixed(2));
    const unrealizedPnL = Number((holdingsValue - holdingsCost).toFixed(2));
    const unrealizedPnLPct = holdingsCost > 0 ? Number(((unrealizedPnL / holdingsCost) * 100).toFixed(2)) : 0.00;
    const cashPct = nav > 0 ? Number(((cash / nav) * 100).toFixed(1)) : 100.00;

    // 1. Sector allocations calculation
    const sectorMap: Record<string, { value: number; color: string }> = {};
    positions.forEach((pos) => {
      const info = stockSectors[pos.symbol.toUpperCase()] || { sector: "Other", color: "var(--text-secondary)" };
      if (!sectorMap[info.sector]) {
        sectorMap[info.sector] = { value: 0, color: info.color };
      }
      sectorMap[info.sector].value += pos.quantity * pos.current_price;
    });

    const sectorAllocations: SectorAllocation[] = Object.keys(sectorMap).map((sector) => ({
      sector,
      value: Number(sectorMap[sector].value.toFixed(2)),
      allocationPct: nav > 0 ? Number(((sectorMap[sector].value / nav) * 100).toFixed(1)) : 0.00,
      color: sectorMap[sector].color
    }));

    // 2. Individual Stock allocations calculation
    const stockAllocations: StockAllocation[] = positions.map((pos) => {
      const val = pos.quantity * pos.current_price;
      return {
        symbol: pos.symbol,
        value: Number(val.toFixed(2)),
        allocationPct: nav > 0 ? Number(((val / nav) * 100).toFixed(1)) : 0.00
      };
    });

    // Sort allocations descending
    sectorAllocations.sort((a, b) => b.allocationPct - a.allocationPct);
    stockAllocations.sort((a, b) => b.allocationPct - a.allocationPct);

    // 3. Diversification Level
    const uniqueHoldingsCount = positions.filter((p) => p.quantity > 0).length;
    let diversificationLevel = "No Holdings";
    let diversificationBadge: "success" | "info" | "warning" | "danger" = "warning";

    if (uniqueHoldingsCount === 1) {
      diversificationLevel = "Highly Concentrated";
      diversificationBadge = "danger";
    } else if (uniqueHoldingsCount === 2) {
      diversificationLevel = "Concentrated";
      diversificationBadge = "warning";
    } else if (uniqueHoldingsCount === 3) {
      diversificationLevel = "Moderate";
      diversificationBadge = "info";
    } else if (uniqueHoldingsCount >= 4) {
      diversificationLevel = "Well Diversified";
      diversificationBadge = "success";
    }

    // 4. Volatility Drag Estimation
    // Base drag of 2%, increases with PnL volatility
    const volatilityDrag = Number((2.0 + Math.min(10.0, Math.abs(unrealizedPnLPct) * 0.15)).toFixed(2));

    // 5. Portfolio Health Score calculation (0-100 base)
    let healthScore = 100;

    if (uniqueHoldingsCount > 0) {
      // Penalty for concentration risk on single stock (> 30%)
      stockAllocations.forEach((stock) => {
        if (stock.allocationPct > 30) {
          const excess = stock.allocationPct - 30;
          healthScore -= Math.min(25, excess * 0.8);
        }
      });

      // Penalty for sector exposure (> 40% excluding cash)
      sectorAllocations.forEach((sec) => {
        if (sec.allocationPct > 40) {
          const excess = sec.allocationPct - 40;
          healthScore -= Math.min(20, excess * 0.6);
        }
      });

      // Penalty for cash levels (too high or too low)
      if (cashPct > 85) {
        healthScore -= 15; // Capital drag
      } else if (cashPct < 5) {
        healthScore -= 10; // Liquidity crunch
      }

      // Performance adjustment
      if (unrealizedPnLPct < 0) {
        healthScore -= Math.min(15, Math.abs(unrealizedPnLPct) * 0.4);
      } else {
        healthScore += Math.min(10, unrealizedPnLPct * 0.3);
      }
    } else {
      // Empty portfolio
      healthScore = 100;
    }

    healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

    // 6. Risk Index
    let riskIndex: "Low" | "Medium" | "High" = "Low";
    const maxStockPct = stockAllocations.length > 0 ? stockAllocations[0].allocationPct : 0;
    const maxSectorPct = sectorAllocations.length > 0 ? sectorAllocations[0].allocationPct : 0;

    if (maxStockPct > 45 || maxSectorPct > 60) {
      riskIndex = "High";
    } else if (maxStockPct > 30 || maxSectorPct > 40 || uniqueHoldingsCount === 1) {
      riskIndex = "Medium";
    }

    // 7. Dynamic AI Suggestions
    const suggestions: { id: number; text: string; type: "warning" | "info" | "success" }[] = [];
    let sugId = 1;

    if (uniqueHoldingsCount === 0) {
      suggestions.push({
        id: sugId++,
        text: "Portfolio is 100% Cash. Initiate pilot setups in high-scoring opportunities to deploy capital and hedge currency depreciation.",
        type: "info"
      });
    } else {
      // Cash drag
      if (cashPct > 80) {
        suggestions.push({
          id: sugId++,
          text: `High cash liquidity detected (${cashPct}%). Deploy idle capital into 2-3 low-risk setups to combat index inflation.`,
          type: "info"
        });
      } else if (cashPct < 5) {
        suggestions.push({
          id: sugId++,
          text: `Liquidity is critically low (${cashPct}%). Consider liquidating minor stock positions to free up cash buying power for sudden corrections.`,
          type: "warning"
        });
      }

      // IT Services concentration
      const itSec = sectorAllocations.find((s) => s.sector === "IT Services");
      if (itSec && itSec.allocationPct > 40) {
        suggestions.push({
          id: sugId++,
          text: `IT Services exposure is elevated (${itSec.allocationPct}%). Consider trimming TCS or INFY positions during the next technical rally.`,
          type: "warning"
        });
      }

      // Financials missing
      const financialSec = sectorAllocations.find((s) => s.sector === "Financials");
      if (!financialSec || financialSec.allocationPct === 0) {
        suggestions.push({
          id: sugId++,
          text: "Zero financials allocation detected. Initiate a pilot position in HDFCBANK near key support zones to stabilize structural volatility.",
          type: "info"
        });
      }

      // Correlation risk (TCS and INFY both held)
      const holdsTcs = positions.some((p) => p.symbol === "TCS" && p.quantity > 0);
      const holdsInfy = positions.some((p) => p.symbol === "INFY" && p.quantity > 0);
      if (holdsTcs && holdsInfy) {
        suggestions.push({
          id: sugId++,
          text: "Holding both TCS & INFY results in high IT sectoral correlation. Consider consolidating into a single leading IT stock to limit sector drag.",
          type: "warning"
        });
      }

      // Volatility warnings
      if (Math.abs(unrealizedPnLPct) > 8) {
        suggestions.push({
          id: sugId++,
          text: `Holdings volatility drag is elevated (${volatilityDrag}%). Establish strict trailing stop-losses to protect downside risk.`,
          type: "warning"
        });
      }

      // Optimal suggestions
      if (healthScore > 85 && uniqueHoldingsCount >= 3) {
        suggestions.push({
          id: sugId++,
          text: "Portfolio metrics conform to standard balanced allocation standards. No immediate rebalancing is required.",
          type: "success"
        });
      }
    }

    return {
      nav,
      holdingsValue,
      holdingsCost,
      unrealizedPnL,
      unrealizedPnLPct,
      cashPct,
      healthScore,
      diversificationLevel,
      diversificationBadge,
      volatilityDrag,
      riskIndex,
      sectorAllocations,
      stockAllocations,
      suggestions
    };
  }
};

export default portfolioDoctorService;
