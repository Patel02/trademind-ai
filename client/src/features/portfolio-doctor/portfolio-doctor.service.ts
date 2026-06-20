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
  diversificationScore: number;
  riskScore: number;
  sectorBalanceScore: number;
  cashAllocationScore: number;
  diversificationLevel: string;
  diversificationBadge: "success" | "info" | "warning" | "danger";
  volatilityDrag: number;
  riskIndex: "Low" | "Medium" | "High";
  sectorAllocations: SectorAllocation[];
  stockAllocations: StockAllocation[];
  suggestions: { id: number; text: string; type: "warning" | "info" | "success" }[];
}

export interface StressTestResult {
  testType: string;
  title: string;
  drawdownPct: number;
  simulatedNav: number;
  simulatedHealthScore: number;
  description: string;
  recommendations: string[];
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

    // 3. Sub-Score: Diversification Score
    const uniqueHoldingsCount = positions.filter((p) => p.quantity > 0).length;
    let diversificationScore = 100;
    let diversificationLevel = "No Holdings";
    let diversificationBadge: "success" | "info" | "warning" | "danger" = "warning";

    if (uniqueHoldingsCount === 0) {
      diversificationScore = 100;
      diversificationLevel = "100% Cash Buffer";
      diversificationBadge = "success";
    } else if (uniqueHoldingsCount === 1) {
      diversificationScore = 40;
      diversificationLevel = "Highly Concentrated";
      diversificationBadge = "danger";
    } else if (uniqueHoldingsCount === 2) {
      diversificationScore = 60;
      diversificationLevel = "Concentrated";
      diversificationBadge = "warning";
    } else if (uniqueHoldingsCount === 3) {
      diversificationScore = 80;
      diversificationLevel = "Moderate";
      diversificationBadge = "info";
    } else if (uniqueHoldingsCount >= 4) {
      diversificationScore = 100;
      diversificationLevel = "Well Diversified";
      diversificationBadge = "success";
    }

    // 4. Sub-Score: Risk Score
    let riskScore = 100;
    if (uniqueHoldingsCount > 0) {
      stockAllocations.forEach((stock) => {
        if (stock.allocationPct > 40) {
          riskScore -= 20; // Critical single-asset weight
        } else if (stock.allocationPct > 20) {
          riskScore -= 10;
        }
      });
      if (unrealizedPnLPct < -5) {
        riskScore -= 15; // Net loss drawdowns
      }
    }
    riskScore = Math.max(20, Math.min(100, riskScore));

    // 5. Sub-Score: Sector Balance Score
    let sectorBalanceScore = 100;
    if (uniqueHoldingsCount > 0) {
      sectorAllocations.forEach((sec) => {
        if (sec.allocationPct > 50) {
          sectorBalanceScore -= 30; // Heavy sector concentration
        } else if (sec.allocationPct > 30) {
          sectorBalanceScore -= 15;
        }
      });

      // Penalize missing primary sectors (Financials & Energy)
      const hasFinancials = sectorAllocations.some((s) => s.sector === "Financials");
      const hasEnergy = sectorAllocations.some((s) => s.sector === "Energy & Infra");
      if (!hasFinancials) sectorBalanceScore -= 15;
      if (!hasEnergy) sectorBalanceScore -= 10;
    }
    sectorBalanceScore = Math.max(20, Math.min(100, sectorBalanceScore));

    // 6. Sub-Score: Cash Allocation Score
    let cashAllocationScore = 100;
    if (cashPct >= 10 && cashPct <= 35) {
      cashAllocationScore = 100; // Optimal
    } else if (cashPct > 35 && cashPct <= 60) {
      cashAllocationScore = 85;  // Slight cash drag
    } else if (cashPct > 60) {
      cashAllocationScore = 65;  // Severe cash capital drag
    } else if (cashPct > 2 && cashPct < 10) {
      cashAllocationScore = 80;  // Low cash buffer
    } else {
      cashAllocationScore = 45;  // High liquidity risk
    }

    // 7. Portfolio Health Score (Weighted average of four sub-scores)
    let healthScore = 100;
    if (uniqueHoldingsCount > 0) {
      healthScore = Math.round(
        diversificationScore * 0.20 +
        riskScore * 0.30 +
        sectorBalanceScore * 0.30 +
        cashAllocationScore * 0.20
      );
    }
    healthScore = Math.max(20, Math.min(100, healthScore));

    // 8. Volatility Drag Estimation
    const volatilityDrag = Number((2.0 + Math.min(10.0, Math.abs(unrealizedPnLPct) * 0.15)).toFixed(2));

    // 9. Risk Index
    let riskIndex: "Low" | "Medium" | "High" = "Low";
    if (riskScore < 50 || sectorBalanceScore < 60) {
      riskIndex = "High";
    } else if (riskScore < 80 || sectorBalanceScore < 85 || uniqueHoldingsCount === 1) {
      riskIndex = "Medium";
    }

    // 10. Dynamic AI Suggestions
    const suggestions: { id: number; text: string; type: "warning" | "info" | "success" }[] = [];
    let sugId = 1;

    if (uniqueHoldingsCount === 0) {
      suggestions.push({
        id: sugId++,
        text: "Portfolio is 100% Cash. Deploy capital into top-ranked Opportunities to hedge inflation drag.",
        type: "info"
      });
    } else {
      if (cashPct > 60) {
        suggestions.push({
          id: sugId++,
          text: `High cash reserves (${cashPct}%). Deploy idle capital into high-readiness swing setups.`,
          type: "info"
        });
      } else if (cashPct < 5) {
        suggestions.push({
          id: sugId++,
          text: `Critical cash buffer (${cashPct}%). Liquidate micro holdings to restore portfolio liquidity.`,
          type: "warning"
        });
      }

      const itSec = sectorAllocations.find((s) => s.sector === "IT Services");
      if (itSec && itSec.allocationPct > 40) {
        suggestions.push({
          id: sugId++,
          text: `IT Services exposure is elevated (${itSec.allocationPct}%). Trim TCS or INFY setups to rebalance.`,
          type: "warning"
        });
      }

      const financialSec = sectorAllocations.find((s) => s.sector === "Financials");
      if (!financialSec || financialSec.allocationPct === 0) {
        suggestions.push({
          id: sugId++,
          text: "Zero Financials exposure. Pilot HDFCBANK to add structural index defense.",
          type: "info"
        });
      }

      const holdsTcs = positions.some((p) => p.symbol === "TCS" && p.quantity > 0);
      const holdsInfy = positions.some((p) => p.symbol === "INFY" && p.quantity > 0);
      if (holdsTcs && holdsInfy) {
        suggestions.push({
          id: sugId++,
          text: "IT sectoral correlation is high. Consolidate IT holdings to limit systematic drag.",
          type: "warning"
        });
      }

      if (healthScore > 85 && uniqueHoldingsCount >= 3) {
        suggestions.push({
          id: sugId++,
          text: "Structural allocation parameters align with balanced portfolio targets.",
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
      diversificationScore,
      riskScore,
      sectorBalanceScore,
      cashAllocationScore,
      diversificationLevel,
      diversificationBadge,
      volatilityDrag,
      riskIndex,
      sectorAllocations,
      stockAllocations,
      suggestions
    };
  },

  /**
   * Run portfolio stress testing simulation models.
   */
  simulateStressTest(portfolio: PaperPortfolio, positions: PaperPosition[], testType: string): StressTestResult {
    const cash = portfolio.balance;
    const holdingsValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.current_price, 0);
    const nav = cash + holdingsValue;

    let title = "";
    let description = "";
    const stockLosses: Record<string, number> = {}; // Drop per stock symbol
    const recommendations: string[] = [];

    // Calculate beta-weighted drops per asset class
    positions.forEach((pos) => {
      const sym = pos.symbol.toUpperCase();
      if (testType === "MARKET_CRASH_5") {
        title = "Market Crash -5%";
        description = "Simulates a general systematic market correction of -5% across indices.";
        // Sector specific beta drops
        if (sym === "TCS" || sym === "INFY") stockLosses[sym] = 0.06; // Beta 1.2
        else if (sym === "RELIANCE") stockLosses[sym] = 0.05; // Beta 1.0
        else if (sym === "HDFCBANK") stockLosses[sym] = 0.045; // Beta 0.9
        else stockLosses[sym] = 0.05;
      } else if (testType === "MARKET_CRASH_10") {
        title = "Market Crash -10%";
        description = "Simulates a severe systematic correction of -10%, triggering volatility expansion.";
        if (sym === "TCS" || sym === "INFY") stockLosses[sym] = 0.12;
        else if (sym === "RELIANCE") stockLosses[sym] = 0.10;
        else if (sym === "HDFCBANK") stockLosses[sym] = 0.09;
        else stockLosses[sym] = 0.10;
      } else if (testType === "IT_CRASH_20") {
        title = "IT Sector Drop -20%";
        description = "Simulates a targeted sector crash of -20% in IT Services with 2% contagion elsewhere.";
        if (sym === "TCS" || sym === "INFY") stockLosses[sym] = 0.20;
        else stockLosses[sym] = 0.02; // Contagion
      } else if (testType === "VOLATILITY_SPIKE") {
        title = "Volatility Spike (VIX > 25)";
        description = "Simulates panic selling and spread widening, forcing all assets lower by -7.5%.";
        stockLosses[sym] = 0.075;
      }
    });

    // Compute simulated holdings loss
    let simulatedHoldingsValue = 0;
    positions.forEach((pos) => {
      const lossFactor = stockLosses[pos.symbol.toUpperCase()] || 0.05;
      simulatedHoldingsValue += pos.quantity * pos.current_price * (1 - lossFactor);
    });

    const simulatedNav = cash + simulatedHoldingsValue;
    const lossValue = nav - simulatedNav;
    const drawdownPct = nav > 0 ? Number(((lossValue / nav) * 100).toFixed(2)) : 0;

    // Create simulated positions to run through diagnostics
    const simulatedPositions = positions.map((pos) => {
      const lossFactor = stockLosses[pos.symbol.toUpperCase()] || 0.05;
      return {
        ...pos,
        current_price: pos.current_price * (1 - lossFactor)
      };
    });

    const diag = this.diagnosePortfolio(portfolio, simulatedPositions);

    // Compile stress test recommendations
    if (drawdownPct > 5.0) {
      recommendations.push("Estimated drawdown exceeds 5% boundary limit. Trim highly concentrated positions to restore cash hedge.");
    } else {
      recommendations.push("Drawdown bounds are within acceptable limits. Cash reserves are holding up portfolio value.");
    }

    if (testType === "IT_CRASH_20" && positions.some((p) => p.symbol === "TCS" || p.symbol === "INFY")) {
      recommendations.push("IT sector crash severely impacts your NAV. Divert 15% capital from IT into low-beta Energy or Financials.");
    }

    return {
      testType,
      title,
      drawdownPct,
      simulatedNav: Number(simulatedNav.toFixed(2)),
      simulatedHealthScore: diag.healthScore,
      description,
      recommendations
    };
  }
};

export default portfolioDoctorService;
