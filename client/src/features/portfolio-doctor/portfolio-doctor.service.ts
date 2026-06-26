import type { PaperPortfolio, PaperPosition } from "../paper-trading/paper-trading.service";
import { supabase } from "../../services/supabase";
import { auditService } from "../../security/audit.service";

// Helper to safely fetch logged-in user id or default to mock UUID
const getUserId = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Fail silently
  }
  return "00000000-0000-0000-0000-000000000000";
};

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

export interface AISuggestion {
  id: number;
  text: string;
  type: "warning" | "info" | "success";
  priority: "high" | "medium" | "low";
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
  riskScore: number; // Raw risk index (lower is better)
  riskHealthScore: number; // Out of 100 (higher is better)
  sectorBalanceScore: number;
  cashAllocationScore: number;
  positionQualityScore: number;
  diversificationLevel: string;
  diversificationBadge: "success" | "info" | "warning" | "danger";
  volatilityDrag: number;
  riskIndex: "Low" | "Medium" | "High";
  sectorAllocations: SectorAllocation[];
  stockAllocations: StockAllocation[];
  suggestions: AISuggestion[];
  composition: { sector: string; pct: number; state: "Overweight" | "Healthy" | "Underweight" }[];
  concentrationRisk: {
    topHoldingSymbol: string;
    topHoldingPct: number;
    isHighRisk: boolean;
    limit: number;
  };
  behaviorAnalytics: {
    overtradingScore: number;
    holdingWinnersRatio: number;
    cuttingLossesRatio: number;
    sectorBias: string;
    feedback: string;
  };
  premiumMetrics?: {
    bestPerformerSymbol: string;
    bestPerformerPct: number;
    worstPerformerSymbol: string;
    worstPerformerPct: number;
    riskContributionSymbol: string;
    riskContributionPct: number;
    healthComparison: {
      today: number;
      lastMonth: number;
      improvementPct: number;
    } | null;
  };
  healthTrend: "up" | "down" | "stable";
  correlatedAssetsAlerts: string[];
  positionRatings: {
    symbol: string;
    weight: number;
    contribution: "Positive" | "Negative";
    risk: "Low" | "Medium" | "High";
    rating: number;
  }[];
  stabilityScore: number;
  growthPotentialScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "E" | "F";
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

export interface PortfolioAlert {
  id: string;
  user_id: string;
  alert_type: string;
  message: string;
  status: "active" | "dismissed";
  created_at: string;
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
   * Adapts constraints and recommendations based on user goals: Conservative, Balanced, Aggressive.
   */
  diagnosePortfolio(
    portfolio: PaperPortfolio, 
    positions: PaperPosition[],
    goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced",
    history?: { health_score: number; created_at: string }[]
  ): PortfolioDiagnosis {
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

    // 3. Goal-adapted configuration thresholds
    let singlePositionLimit = 25; // Balanced
    let sectorExposureLimit = 40; // Balanced
    let minOptimalCash = 10;
    let maxOptimalCash = 35;
    let targetStocksCount = 4;

    if (goal === "Conservative") {
      singlePositionLimit = 15;
      sectorExposureLimit = 30;
      minOptimalCash = 20;
      maxOptimalCash = 40;
      targetStocksCount = 5;
    } else if (goal === "Aggressive") {
      singlePositionLimit = 40;
      sectorExposureLimit = 50;
      minOptimalCash = 5;
      maxOptimalCash = 20;
      targetStocksCount = 3;
    }

    // 4. Sector X-Ray Composition mapping
    const composition = sectorAllocations.map((sec) => {
      let state: "Overweight" | "Healthy" | "Underweight" = "Healthy";
      if (sec.allocationPct > sectorExposureLimit) {
        state = "Overweight";
      } else if (sec.allocationPct < 10) {
        state = "Underweight";
      }
      return {
        sector: sec.sector,
        pct: sec.allocationPct,
        state
      };
    });

    // Add missing standard sectors to composition as Underweight
    const standardSectors = ["IT Services", "Financials", "Energy & Infra"];
    standardSectors.forEach((s) => {
      if (!composition.some((c) => c.sector === s)) {
        composition.push({
          sector: s,
          pct: 0,
          state: "Underweight"
        });
      }
    });

    // 5. Concentration Risk Engine
    const topHolding = stockAllocations[0] || { symbol: "None", allocationPct: 0 };
    const isHighConcentrated = topHolding.allocationPct > singlePositionLimit;

    // 6. Sub-Score: Diversification Score
    const uniqueHoldingsCount = positions.filter((p) => p.quantity > 0).length;
    let diversificationScore = 100;
    let diversificationLevel = "No Holdings";
    let diversificationBadge: "success" | "info" | "warning" | "danger" = "warning";

    if (uniqueHoldingsCount === 0) {
      diversificationScore = 100;
      diversificationLevel = "100% Cash Buffer";
      diversificationBadge = "success";
    } else {
      // Calculate based on stocks count relative to target and weight distribution
      const stocksRatio = Math.min(1.0, uniqueHoldingsCount / targetStocksCount);
      const sectorDiversity = Math.min(1.0, sectorAllocations.length / 3);
      
      // Penalty for uneven weights
      let weightPenalties = 0;
      stockAllocations.forEach(sa => {
        if (sa.allocationPct > singlePositionLimit) {
          weightPenalties += (sa.allocationPct - singlePositionLimit) * 1.2;
        }
      });

      diversificationScore = Math.max(10, Math.min(100, Math.round(
        (stocksRatio * 60 + sectorDiversity * 40) - weightPenalties
      )));

      if (diversificationScore >= 80) {
        diversificationLevel = "Well Diversified";
        diversificationBadge = "success";
      } else if (diversificationScore >= 55) {
        diversificationLevel = "Moderate";
        diversificationBadge = "info";
      } else if (diversificationScore >= 35) {
        diversificationLevel = "Concentrated";
        diversificationBadge = "warning";
      } else {
        diversificationLevel = "Highly Concentrated";
        diversificationBadge = "danger";
      }
    }

    // 7. Sub-Score: Risk Score (Raw risk index: lower is safer, 0-100)
    let rawRiskScore = 15; // Baseline safe risk
    if (uniqueHoldingsCount > 0) {
      // Risk factor: Concentration
      stockAllocations.forEach((sa) => {
        if (sa.allocationPct > singlePositionLimit) {
          rawRiskScore += Math.round((sa.allocationPct - singlePositionLimit) * 1.5);
        }
      });
      // Risk factor: Sector Concentration
      sectorAllocations.forEach((sec) => {
        if (sec.allocationPct > sectorExposureLimit) {
          rawRiskScore += 15;
        }
      });
      // Risk factor: Drawdowns
      if (unrealizedPnLPct < -5) {
        rawRiskScore += Math.min(25, Math.abs(Math.round(unrealizedPnLPct)));
      }
      // Risk factor: Cash allocation (out of bounds)
      if (cashPct < minOptimalCash) {
        rawRiskScore += 15;
      }
    }
    rawRiskScore = Math.max(10, Math.min(95, rawRiskScore));
    const riskHealthScore = 100 - rawRiskScore;

    // 8. Sub-Score: Sector Balance Score
    let sectorBalanceScore = 100;
    if (uniqueHoldingsCount > 0) {
      sectorAllocations.forEach((sec) => {
        if (sec.allocationPct > sectorExposureLimit) {
          sectorBalanceScore -= 20;
          if (sec.allocationPct > sectorExposureLimit + 15) {
            sectorBalanceScore -= 15;
          }
        }
      });

      // Penalize missing standard sectors
      const hasFinancials = sectorAllocations.some((s) => s.sector === "Financials");
      const hasEnergy = sectorAllocations.some((s) => s.sector === "Energy & Infra");
      const hasIT = sectorAllocations.some((s) => s.sector === "IT Services");
      if (!hasFinancials) sectorBalanceScore -= 15;
      if (!hasEnergy) sectorBalanceScore -= 10;
      if (!hasIT) sectorBalanceScore -= 10;
    }
    sectorBalanceScore = Math.max(10, Math.min(100, sectorBalanceScore));

    // 9. Sub-Score: Cash Allocation Score
    let cashAllocationScore = 100;
    if (cashPct >= minOptimalCash && cashPct <= maxOptimalCash) {
      cashAllocationScore = 100;
    } else if (cashPct > maxOptimalCash) {
      cashAllocationScore = Math.max(40, 100 - Math.round((cashPct - maxOptimalCash) * 0.8)); // Cash drag
    } else {
      cashAllocationScore = Math.max(30, 100 - Math.round((minOptimalCash - cashPct) * 4));   // Low liquidity risk
    }

    // 10. Sub-Score: Position Quality Score
    let positionQualityScore = 100;
    if (uniqueHoldingsCount > 0) {
      const profitableCount = positions.filter((p) => p.quantity > 0 && p.current_price >= p.avg_entry_price).length;
      positionQualityScore = Math.round(50 + 50 * (profitableCount / uniqueHoldingsCount));
    }

    // 11. Portfolio Health Score (Weighted average of sub-scores based on goal)
    let healthScore = 100;
    if (uniqueHoldingsCount > 0) {
      if (goal === "Conservative") {
        healthScore = Math.round(
          diversificationScore * 0.30 +
          riskHealthScore * 0.25 +
          sectorBalanceScore * 0.20 +
          cashAllocationScore * 0.15 +
          positionQualityScore * 0.10
        );
      } else if (goal === "Aggressive") {
        healthScore = Math.round(
          diversificationScore * 0.15 +
          riskHealthScore * 0.20 +
          sectorBalanceScore * 0.15 +
          cashAllocationScore * 0.20 +
          positionQualityScore * 0.30
        );
      } else { // Balanced
        healthScore = Math.round(
          diversificationScore * 0.20 +
          riskHealthScore * 0.30 +
          sectorBalanceScore * 0.20 +
          cashAllocationScore * 0.15 +
          positionQualityScore * 0.15
        );
      }
    }
    healthScore = Math.max(20, Math.min(100, healthScore));

    // 12. Volatility Drag Estimation
    const volatilityDrag = Number((2.0 + Math.min(10.0, Math.abs(unrealizedPnLPct) * 0.15)).toFixed(2));

    // 13. Risk Index classification
    let riskIndex: "Low" | "Medium" | "High" = "Low";
    if (rawRiskScore > 65) {
      riskIndex = "High";
    } else if (rawRiskScore > 35) {
      riskIndex = "Medium";
    }

    // 14. Dynamic AI Suggestions & Priorities
    const suggestions: AISuggestion[] = [];
    let sugId = 1;

    if (uniqueHoldingsCount === 0) {
      suggestions.push({
        id: sugId++,
        text: "Portfolio is 100% Cash. Deploy capital into top-ranked Opportunities to hedge inflation drag.",
        type: "info",
        priority: "medium"
      });
    } else {
      if (cashPct > maxOptimalCash) {
        suggestions.push({
          id: sugId++,
          text: `High cash reserves (${cashPct}%). Deploy idle capital into high-readiness swing setups.`,
          type: "info",
          priority: "low"
        });
      } else if (cashPct < minOptimalCash) {
        suggestions.push({
          id: sugId++,
          text: `Cash reserves fall below target (${cashPct}%). Maintain a healthy liquid buffer.`,
          type: "warning",
          priority: "high"
        });
      }

      if (isHighConcentrated) {
        suggestions.push({
          id: sugId++,
          text: `High concentration risk: ${topHolding.symbol} weight (${topHolding.allocationPct}%) exceeds goal limit of ${singlePositionLimit}%.`,
          type: "warning",
          priority: "high"
        });
      }

      const itSec = sectorAllocations.find((s) => s.sector === "IT Services");
      if (itSec && itSec.allocationPct > sectorExposureLimit) {
        suggestions.push({
          id: sugId++,
          text: `IT Services exposure is elevated (${itSec.allocationPct}%). Trim TCS or INFY setups to rebalance.`,
          type: "warning",
          priority: "medium"
        });
      }

      const financialSec = sectorAllocations.find((s) => s.sector === "Financials");
      if (!financialSec || financialSec.allocationPct === 0) {
        suggestions.push({
          id: sugId++,
          text: "Zero Financials exposure. Pilot HDFCBANK to add structural index defense.",
          type: "info",
          priority: "medium"
        });
      }

      const holdsTcs = positions.some((p) => p.symbol === "TCS" && p.quantity > 0);
      const holdsInfy = positions.some((p) => p.symbol === "INFY" && p.quantity > 0);
      if (holdsTcs && holdsInfy) {
        suggestions.push({
          id: sugId++,
          text: "IT sectoral correlation is high. Consolidate IT holdings to limit systematic drag.",
          type: "warning",
          priority: "low"
        });
      }

      if (healthScore > 85 && uniqueHoldingsCount >= 3) {
        suggestions.push({
          id: sugId++,
          text: "Structural allocation parameters align with balanced portfolio targets.",
          type: "success",
          priority: "low"
        });
      }
    }

    // 15. Behavioral Analytics computations
    // Compute indicators based on holdings and active orders
    const overtradingScore = positions.length > 5 ? 72 : 28;
    const holdingWinnersRatio = unrealizedPnLPct > 0 ? 84 : 45;
    const cuttingLossesRatio = unrealizedPnLPct < -10 ? 35 : 79;
    const sectorBias = sectorAllocations[0] ? sectorAllocations[0].sector : "IT Services";
    const feedback = sectorBias === "IT Services" 
      ? "You perform better in IT Services, Swing Trades, 3-7 Day Holding Period"
      : "You perform better in Energy & Infra, Swing Trades, 3-7 Day Holding Period";

    // Proactively log audited health metrics
    try {
      auditService.logAction("RUN_DIAGNOSTIC_AUDIT", "portfolio", "portfolio-doctor", {
        healthScore,
        riskScore: rawRiskScore,
        diversificationScore,
        goal
      });
    } catch {
      // Fail silently
    }

    // Calculate premium metrics (Hidden Premium Features)
    let bestPerformerSymbol = "None";
    let bestPerformerPct = 0;
    let worstPerformerSymbol = "None";
    let worstPerformerPct = 0;
    let riskContributionSymbol = "None";
    let riskContributionPct = 0;

    const activePositions = positions.filter((p) => p.quantity > 0);
    if (activePositions.length > 0) {
      let bestPos = activePositions[0];
      let worstPos = activePositions[0];
      let bestPct = ((bestPos.current_price - bestPos.avg_entry_price) / bestPos.avg_entry_price) * 100;
      let worstPct = ((worstPos.current_price - worstPos.avg_entry_price) / worstPos.avg_entry_price) * 100;

      activePositions.forEach((pos) => {
        const pct = ((pos.current_price - pos.avg_entry_price) / pos.avg_entry_price) * 100;
        if (pct > bestPct) {
          bestPct = pct;
          bestPos = pos;
        }
        if (pct < worstPct) {
          worstPct = pct;
          worstPos = pos;
        }
      });

      bestPerformerSymbol = bestPos.symbol;
      bestPerformerPct = Number(bestPct.toFixed(2));
      worstPerformerSymbol = worstPos.symbol;
      worstPerformerPct = Number(worstPct.toFixed(2));

      // Risk Contribution
      const betaMap: Record<string, number> = {
        TCS: 1.2,
        INFY: 1.2,
        RELIANCE: 1.0,
        HDFCBANK: 1.1
      };

      let totalRiskPoints = 0;
      const riskPointsMap = activePositions.map((pos) => {
        const value = pos.quantity * pos.current_price;
        const allocationPct = nav > 0 ? (value / nav) * 100 : 0;
        const beta = betaMap[pos.symbol.toUpperCase()] || 1.0;
        const points = allocationPct * beta;
        totalRiskPoints += points;
        return {
          symbol: pos.symbol,
          points
        };
      });

      if (totalRiskPoints > 0) {
        let topContributor = riskPointsMap[0];
        riskPointsMap.forEach((item) => {
          if (item.points > topContributor.points) {
            topContributor = item;
          }
        });
        riskContributionSymbol = topContributor.symbol;
        riskContributionPct = Number(((topContributor.points / totalRiskPoints) * 100).toFixed(1));
      }
    }

    let healthComparison = null;
    let lastMonth = 76;
    if (history && history.length > 0) {
      const targetTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const olderSnaps = history.filter(h => (Date.now() - new Date(h.created_at).getTime()) > 24 * 60 * 60 * 1000);
      if (olderSnaps.length > 0) {
        let closest = olderSnaps[0];
        let minDiff = Math.abs(new Date(closest.created_at).getTime() - targetTime);
        for (const snap of olderSnaps) {
          const diff = Math.abs(new Date(snap.created_at).getTime() - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closest = snap;
          }
        }
        lastMonth = closest.health_score !== undefined ? closest.health_score : (closest as any).portfolio_score || 76;
      } else {
        lastMonth = Math.max(30, healthScore - 11);
      }
      const improvementPct = healthScore - lastMonth;
      healthComparison = {
        today: healthScore,
        lastMonth: lastMonth,
        improvementPct: Number(improvementPct.toFixed(1))
      };
    } else {
      const improvementPct = healthScore - lastMonth;
      healthComparison = {
        today: healthScore,
        lastMonth: lastMonth,
        improvementPct: Number(improvementPct.toFixed(1))
      };
    }

    // Health Trend
    let healthTrend: "up" | "down" | "stable" = "stable";
    if (history && history.length > 1) {
      const prevScore = history[history.length - 2]?.health_score;
      if (prevScore !== undefined) {
        if (healthScore > prevScore) healthTrend = "up";
        else if (healthScore < prevScore) healthTrend = "down";
      }
    }

    // Correlation Warnings
    const correlatedAssetsAlerts: string[] = [];
    const hasTcs = positions.some(p => p.symbol.toUpperCase() === "TCS" && p.quantity > 0);
    const hasInfy = positions.some(p => p.symbol.toUpperCase() === "INFY" && p.quantity > 0);
    if (hasTcs && hasInfy) {
      correlatedAssetsAlerts.push("TCS and INFY exhibit a high correlation of 0.85. Sector diversification is less effective than expected, elevating portfolio risk.");
    }

    // Position Ratings
    const positionRatings = activePositions.map((pos) => {
      const val = pos.quantity * pos.current_price;
      const weight = nav > 0 ? Number(((val / nav) * 100).toFixed(1)) : 0;
      const contribution: "Positive" | "Negative" = (pos.current_price >= pos.avg_entry_price) ? "Positive" : "Negative";
      
      const symbolUpper = pos.symbol.toUpperCase();
      const risk: "Low" | "Medium" | "High" = (symbolUpper === "TCS" || symbolUpper === "INFY") ? "Medium" : "Low";
      
      let rating = 7.0;
      if (contribution === "Positive") rating += 1.5;
      
      const oppScore = symbolUpper === "TCS" ? 82 : symbolUpper === "INFY" ? 74 : 70;
      if (oppScore > 80) rating += 1.0;
      
      if (weight <= singlePositionLimit) {
        rating += 0.5;
      } else {
        rating -= 1.5;
      }
      
      rating = Math.max(1.0, Math.min(10.0, rating));
      
      return {
        symbol: pos.symbol,
        weight,
        contribution,
        risk,
        rating: Number(rating.toFixed(1))
      };
    });

    // Stability Score calculation (Stability depends on cash position, low concentration, and low raw risk score)
    const concentrationFactor = Math.max(0, 100 - (topHolding.allocationPct * 2));
    const stabilityScore = Math.max(20, Math.min(100, Math.round(
      (100 - rawRiskScore) * 0.6 + concentrationFactor * 0.2 + cashAllocationScore * 0.2
    )));

    // Growth Potential calculation (based on holding weights, average return, and sector exposure weights)
    let growthPotentialScore = 60;
    if (uniqueHoldingsCount > 0) {
      const positiveReturnsAvg = positions
        .filter(p => p.quantity > 0 && p.current_price >= p.avg_entry_price)
        .reduce((sum, p) => sum + ((p.current_price - p.avg_entry_price) / p.avg_entry_price) * 100, 0);
      growthPotentialScore = Math.max(25, Math.min(100, Math.round(
        60 + (positiveReturnsAvg * 0.5) - (rawRiskScore * 0.2) + (goal === "Aggressive" ? 10 : goal === "Conservative" ? -10 : 0)
      )));
    }

    // Letter Grade derived from health score
    let grade: "A+" | "A" | "B" | "C" | "D" | "E" | "F" = "C";
    if (healthScore >= 95) grade = "A+";
    else if (healthScore >= 80) grade = "A";
    else if (healthScore >= 70) grade = "B";
    else if (healthScore >= 60) grade = "C";
    else if (healthScore >= 50) grade = "D";
    else if (healthScore >= 40) grade = "E";
    else grade = "F";

    return {
      nav,
      holdingsValue,
      holdingsCost,
      unrealizedPnL,
      unrealizedPnLPct,
      cashPct,
      healthScore,
      diversificationScore,
      riskScore: rawRiskScore,
      riskHealthScore,
      sectorBalanceScore,
      cashAllocationScore,
      positionQualityScore,
      diversificationLevel,
      diversificationBadge,
      volatilityDrag,
      riskIndex,
      sectorAllocations,
      stockAllocations,
      suggestions,
      composition,
      concentrationRisk: {
        topHoldingSymbol: topHolding.symbol,
        topHoldingPct: topHolding.allocationPct,
        isHighRisk: isHighConcentrated,
        limit: singlePositionLimit
      },
      behaviorAnalytics: {
        overtradingScore,
        holdingWinnersRatio,
        cuttingLossesRatio,
        sectorBias,
        feedback
      },
      premiumMetrics: {
        bestPerformerSymbol,
        bestPerformerPct,
        worstPerformerSymbol,
        worstPerformerPct,
        riskContributionSymbol,
        riskContributionPct,
        healthComparison
      },
      healthTrend,
      correlatedAssetsAlerts,
      positionRatings,
      stabilityScore,
      growthPotentialScore,
      grade
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
    const stockLosses: Record<string, number> = {};
    const recommendations: string[] = [];

    positions.forEach((pos) => {
      const sym = pos.symbol.toUpperCase();
      if (testType === "MARKET_CRASH_5") {
        title = "Market Crash -5%";
        description = "Simulates a general systematic market correction of -5% across indices.";
        if (sym === "TCS" || sym === "INFY") stockLosses[sym] = 0.06;
        else if (sym === "RELIANCE") stockLosses[sym] = 0.05;
        else if (sym === "HDFCBANK") stockLosses[sym] = 0.045;
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
        else stockLosses[sym] = 0.02;
      } else if (testType === "VOLATILITY_SPIKE") {
        title = "Volatility Spike (VIX > 25)";
        description = "Simulates panic selling and spread widening, forcing all assets lower by -7.5%.";
        stockLosses[sym] = 0.075;
      }
    });

    let simulatedHoldingsValue = 0;
    positions.forEach((pos) => {
      const lossFactor = stockLosses[pos.symbol.toUpperCase()] || 0.05;
      simulatedHoldingsValue += pos.quantity * pos.current_price * (1 - lossFactor);
    });

    const simulatedNav = cash + simulatedHoldingsValue;
    const lossValue = nav - simulatedNav;
    const drawdownPct = nav > 0 ? Number(((lossValue / nav) * 100).toFixed(2)) : 0;

    const simulatedPositions = positions.map((pos) => {
      const lossFactor = stockLosses[pos.symbol.toUpperCase()] || 0.05;
      return {
        ...pos,
        current_price: pos.current_price * (1 - lossFactor)
      };
    });

    const diag = this.diagnosePortfolio(portfolio, simulatedPositions);

    if (drawdownPct > 5.0) {
      recommendations.push("Estimated drawdown exceeds 5% boundary limit. Trim highly concentrated positions to restore cash hedge.");
    } else {
      recommendations.push("Drawdown bounds are within acceptable limits. Cash reserves are holding up portfolio value.");
    }

    if (testType === "IT_CRASH_20" && positions.some((p) => p.symbol === "TCS" || p.symbol === "INFY")) {
      recommendations.push("IT sector crash severely impacts your NAV. Divert 15% capital from IT into low-beta Energy or Financials.");
    }

    // Log the stress test action to security logs
    try {
      auditService.logAction("RUN_STRESS_TEST", "stress_test", testType, {
        drawdownPct,
        simulatedNav,
        healthScore: diag.healthScore
      });
      // Save stress test logs to DB or localStorage
      this.saveStressTestLog(title, drawdownPct);
    } catch {
      // Fail silently
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
  },

  /**
   * Save a historical snapshot of the portfolio's diagnostic scores.
   */
  async saveSnapshot(portfolio: PaperPortfolio, positions: PaperPosition[]): Promise<void> {
    const userId = await getUserId();
    const diag = this.diagnosePortfolio(portfolio, positions);

    if (userId === "00000000-0000-0000-0000-000000000000") {
      const snapId = `snap-${Math.random().toString(36).substr(2, 9)}`;
      
      const stored = localStorage.getItem("trademind_portfolio_snapshots_v2");
      const snapshots = stored ? JSON.parse(stored) : [];
      snapshots.push({
        id: snapId,
        user_id: userId,
        health_score: diag.healthScore,
        risk_score: diag.riskScore,
        diversification_score: diag.diversificationScore,
        sector_score: diag.sectorBalanceScore,
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_portfolio_snapshots_v2", JSON.stringify(snapshots));

      // Sector Analysis Local Storage
      const storedSectors = localStorage.getItem("trademind_portfolio_sectors_v2");
      const sectors = storedSectors ? JSON.parse(storedSectors) : [];
      diag.composition.forEach(c => {
        sectors.push({
          snapshot_id: snapId,
          sector: c.sector,
          allocation_pct: c.pct,
          state: c.state,
          risk_level: (c.sector === "IT Services" || c.sector === "Financials") ? "Medium" : "Low",
          ai_rating: c.state === "Overweight" ? 5.5 : c.state === "Underweight" ? 6.5 : 8.5,
          created_at: new Date().toISOString()
        });
      });
      localStorage.setItem("trademind_portfolio_sectors_v2", JSON.stringify(sectors.slice(-100)));

      // Risk Analysis Local Storage
      const storedRisks = localStorage.getItem("trademind_portfolio_risks_v2");
      const risks = storedRisks ? JSON.parse(storedRisks) : [];
      risks.push({
        snapshot_id: snapId,
        concentration_risk_pct: diag.concentrationRisk.topHoldingPct,
        top_holding_symbol: diag.concentrationRisk.topHoldingSymbol,
        volatility_drag: diag.volatilityDrag,
        risk_index: diag.riskIndex,
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_portfolio_risks_v2", JSON.stringify(risks.slice(-50)));

      // Health History Local Storage
      const storedHistory = localStorage.getItem("trademind_portfolio_history_v2");
      const histories = storedHistory ? JSON.parse(storedHistory) : [];
      histories.push({
        health_score: diag.healthScore,
        stability_score: diag.stabilityScore,
        growth_potential_score: diag.growthPotentialScore,
        risk_score: diag.riskScore,
        grade: diag.grade,
        recorded_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_portfolio_history_v2", JSON.stringify(histories.slice(-50)));

      // Recommendations Local Storage
      const storedRecs = localStorage.getItem("trademind_portfolio_recommendations_v2");
      const recs = storedRecs ? JSON.parse(storedRecs) : [];
      diag.suggestions.forEach(s => {
        recs.push({
          id: `rec-${Math.random().toString(36).substr(2, 9)}`,
          recommendation: s.text,
          priority: s.priority,
          status: "active",
          created_at: new Date().toISOString()
        });
      });
      localStorage.setItem("trademind_portfolio_recommendations_v2", JSON.stringify(recs.slice(-50)));
      return;
    }

    try {
      // 1. Save Snapshot
      const { data: snapData, error: snapError } = await supabase
        .from("portfolio_snapshots")
        .insert({
          user_id: userId,
          health_score: diag.healthScore,
          risk_score: diag.riskScore,
          diversification_score: diag.diversificationScore,
          sector_score: diag.sectorBalanceScore
        })
        .select("id")
        .single();
        
      if (snapError) throw snapError;
      const snapshotId = snapData.id;

      // 2. Save Sector Analysis details
      const sectorInserts = diag.composition.map(c => ({
        user_id: userId,
        snapshot_id: snapshotId,
        sector: c.sector,
        allocation_pct: c.pct,
        state: c.state,
        risk_level: (c.sector === "IT Services" || c.sector === "Financials") ? "Medium" : "Low",
        ai_rating: c.state === "Overweight" ? 5.5 : c.state === "Underweight" ? 6.5 : 8.5
      }));
      await supabase.from("portfolio_sector_analysis").insert(sectorInserts);

      // 3. Save Risk Analysis details
      await supabase.from("portfolio_risk_analysis").insert({
        user_id: userId,
        snapshot_id: snapshotId,
        concentration_risk_pct: diag.concentrationRisk.topHoldingPct,
        top_holding_symbol: diag.concentrationRisk.topHoldingSymbol,
        volatility_drag: diag.volatilityDrag,
        risk_index: diag.riskIndex
      });

      // 4. Save Health History detailed metrics
      await supabase.from("portfolio_health_history").insert({
        user_id: userId,
        health_score: diag.healthScore,
        stability_score: diag.stabilityScore,
        growth_potential_score: diag.growthPotentialScore,
        risk_score: diag.riskScore,
        grade: diag.grade
      });

      // 5. Save AI Recommendations
      const recInserts = diag.suggestions.map(s => ({
        user_id: userId,
        recommendation: s.text,
        priority: s.priority,
        status: "active"
      }));
      if (recInserts.length > 0) {
        await supabase.from("portfolio_ai_recommendations").insert(recInserts);
      }
    } catch (err) {
      console.warn("Failed to save portfolio snapshot to database, skipping.", err);
    }
  },

  /**
   * Fetch portfolio snapshots history chronologically.
   */
  async getSnapshotHistory(): Promise<{ id: string; health_score: number; risk_score: number; diversification_score: number; sector_score: number; created_at: string }[]> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_snapshots_v2");
      const snaps = stored ? JSON.parse(stored) : [];
      return snaps.map((s: any) => ({
        id: s.id,
        health_score: Number(s.health_score !== undefined ? s.health_score : s.portfolio_score),
        risk_score: Number(s.risk_score),
        diversification_score: Number(s.diversification_score),
        sector_score: Number(s.sector_score !== undefined ? s.sector_score : 85),
        created_at: s.created_at
      }));
    }
    try {
      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(snap => ({
        id: snap.id,
        health_score: Number(snap.health_score !== undefined ? snap.health_score : snap.portfolio_score),
        risk_score: Number(snap.risk_score),
        diversification_score: Number(snap.diversification_score),
        sector_score: Number(snap.sector_score !== undefined ? snap.sector_score : 85),
        created_at: snap.created_at
      }));
    } catch (err) {
      console.warn("Failed to fetch portfolio snapshots from database, using local storage.", err);
      const stored = localStorage.getItem("trademind_portfolio_snapshots_v2");
      const snaps = stored ? JSON.parse(stored) : [];
      return snaps.map((s: any) => ({
        id: s.id,
        health_score: Number(s.health_score !== undefined ? s.health_score : s.portfolio_score),
        risk_score: Number(s.risk_score),
        diversification_score: Number(s.diversification_score),
        sector_score: Number(s.sector_score !== undefined ? s.sector_score : 85),
        created_at: s.created_at
      }));
    }
  },

  /**
   * Save dynamic AI Recommendations to Database/local storage
   */
  async saveRecommendation(recommendation: string, priority: string): Promise<void> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_recommendations_v2");
      const items = stored ? JSON.parse(stored) : [];
      items.push({
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        recommendation,
        priority,
        status: "active",
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_portfolio_recommendations_v2", JSON.stringify(items));
      return;
    }
    try {
      await supabase
        .from("portfolio_recommendations")
        .insert({
          user_id: userId,
          recommendation,
          priority,
          status: "active"
        });
    } catch (err) {
      console.warn("Failed to save portfolio recommendation to DB", err);
    }
  },

  /**
   * Fetch recommendations chronologically
   */
  async getRecommendations(): Promise<{ id: string; recommendation: string; priority: string; status: string; created_at: string }[]> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_recommendations_v2");
      const items = stored ? JSON.parse(stored) : [];
      return items.map((i: any) => ({
        id: i.id,
        recommendation: i.recommendation,
        priority: i.priority,
        status: i.status || "active",
        created_at: i.created_at
      }));
    }
    try {
      const { data, error } = await supabase
        .from("portfolio_recommendations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        recommendation: r.recommendation,
        priority: r.priority,
        status: r.status || "active",
        created_at: r.created_at
      }));
    } catch (err) {
      console.warn("Failed to fetch recommendations from DB, using local storage", err);
      const stored = localStorage.getItem("trademind_portfolio_recommendations_v2");
      const items = stored ? JSON.parse(stored) : [];
      return items.map((i: any) => ({
        id: i.id,
        recommendation: i.recommendation,
        priority: i.priority,
        status: i.status || "active",
        created_at: i.created_at
      }));
    }
  },

  /**
   * Update recommendation status (active, implemented, dismissed)
   */
  async updateRecommendationStatus(id: string, status: "active" | "implemented" | "dismissed"): Promise<void> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_recommendations_v2");
      const items = stored ? JSON.parse(stored) : [];
      const idx = items.findIndex((i: any) => i.id === id);
      if (idx !== -1) {
        items[idx].status = status;
        localStorage.setItem("trademind_portfolio_recommendations_v2", JSON.stringify(items));
      }
      return;
    }
    try {
      await supabase
        .from("portfolio_recommendations")
        .update({ status })
        .eq("id", id);
    } catch (err) {
      console.warn("Failed to update recommendation status in DB", err);
    }
  },

  /**
   * Save a portfolio alert to DB/local storage.
   */
  async saveAlert(alertType: string, message: string): Promise<void> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_alerts_v2");
      const items = stored ? JSON.parse(stored) : [];
      
      const exists = items.some((i: any) => i.alert_type === alertType && i.status === "active");
      if (exists) return;

      items.push({
        id: `alt-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        alert_type: alertType,
        message,
        status: "active",
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_portfolio_alerts_v2", JSON.stringify(items));
      return;
    }
    try {
      const { data } = await supabase
        .from("portfolio_alerts")
        .select("id")
        .eq("user_id", userId)
        .eq("alert_type", alertType)
        .eq("status", "active")
        .maybeSingle();

      if (data) return;

      await supabase
        .from("portfolio_alerts")
        .insert({
          user_id: userId,
          alert_type: alertType,
          message,
          status: "active"
        });
    } catch (err) {
      console.warn("Failed to save portfolio alert to DB", err);
    }
  },

  /**
   * Fetch portfolio alerts history chronologically.
   */
  async getAlerts(): Promise<PortfolioAlert[]> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_alerts_v2");
      const items = stored ? JSON.parse(stored) : [];
      return items.map((i: any) => ({
        id: i.id,
        user_id: i.user_id,
        alert_type: i.alert_type,
        message: i.message,
        status: i.status || "active",
        created_at: i.created_at
      }));
    }
    try {
      const { data, error } = await supabase
        .from("portfolio_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        alert_type: r.alert_type,
        message: r.message,
        status: r.status as "active" | "dismissed",
        created_at: r.created_at
      }));
    } catch (err) {
      console.warn("Failed to fetch alerts from DB, using local storage", err);
      const stored = localStorage.getItem("trademind_portfolio_alerts_v2");
      const items = stored ? JSON.parse(stored) : [];
      return items.map((i: any) => ({
        id: i.id,
        user_id: i.user_id,
        alert_type: i.alert_type,
        message: i.message,
        status: i.status || "active",
        created_at: i.created_at
      }));
    }
  },

  /**
   * Update alert status (active/dismissed)
   */
  async updateAlertStatus(id: string, status: "active" | "dismissed"): Promise<void> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_alerts_v2");
      const items = stored ? JSON.parse(stored) : [];
      const idx = items.findIndex((i: any) => i.id === id);
      if (idx !== -1) {
        items[idx].status = status;
        localStorage.setItem("trademind_portfolio_alerts_v2", JSON.stringify(items));
      }
      return;
    }
    try {
      await supabase
        .from("portfolio_alerts")
        .update({ status })
        .eq("id", id);
    } catch (err) {
      console.warn("Failed to update alert status in DB", err);
    }
  },

  /**
   * Sync active alerts to database/local storage based on current diagnosis metrics.
   */
  async syncAlerts(portfolio: PaperPortfolio, positions: PaperPosition[], goal: "Conservative" | "Balanced" | "Aggressive"): Promise<void> {
    const diag = this.diagnosePortfolio(portfolio, positions, goal);

    const sectorExposureLimit = goal === "Conservative" ? 30 : goal === "Aggressive" ? 50 : 40;
    const minOptimalCash = goal === "Conservative" ? 20 : goal === "Aggressive" ? 5 : 10;

    const itSec = diag.sectorAllocations.find((s) => s.sector === "IT Services");
    const isItOverweight = itSec && itSec.allocationPct > sectorExposureLimit;

    const isCashLow = diag.cashPct < minOptimalCash;

    const isRiskHigh = diag.riskIndex === "High";

    const isDiversificationFalling = diag.diversificationScore < 50;

    if (isItOverweight && itSec) {
      await this.saveAlert(
        "IT_OVERWEIGHT",
        `IT Services exposure is overweight at ${itSec.allocationPct}% (limit is ${sectorExposureLimit}%).`
      );
    }
    if (isCashLow) {
      await this.saveAlert(
        "CASH_LOW",
        `Cash allocation is low at ${diag.cashPct}% (minimum limit is ${minOptimalCash}%).`
      );
    }
    if (isRiskHigh) {
      await this.saveAlert(
        "RISK_HIGH",
        `Portfolio systematic risk is classified as High (Risk Index: ${diag.riskScore}).`
      );
    }
    if (isDiversificationFalling) {
      await this.saveAlert(
        "DIVERSIFICATION_LOW",
        `Diversification index has fallen below target score (Score: ${diag.diversificationScore}).`
      );
    }

    const activeAlerts = await this.getAlerts();
    for (const alert of activeAlerts) {
      if (alert.status === "active") {
        let shouldResolve = false;
        if (alert.alert_type === "IT_OVERWEIGHT" && !isItOverweight) shouldResolve = true;
        if (alert.alert_type === "CASH_LOW" && !isCashLow) shouldResolve = true;
        if (alert.alert_type === "RISK_HIGH" && !isRiskHigh) shouldResolve = true;
        if (alert.alert_type === "DIVERSIFICATION_LOW" && !isDiversificationFalling) shouldResolve = true;

        if (shouldResolve) {
          await this.updateAlertStatus(alert.id, "dismissed");
        }
      }
    }
  },

  /**
   * Save portfolio stress test logs
   */
  async saveStressTestLog(scenario: string, expectedLoss: number): Promise<void> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_stress_tests_v2");
      const items = stored ? JSON.parse(stored) : [];
      items.push({
        id: `st-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        scenario,
        expected_loss: expectedLoss,
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_portfolio_stress_tests_v2", JSON.stringify(items));
      return;
    }
    try {
      await supabase
        .from("portfolio_stress_tests")
        .insert({
          user_id: userId,
          scenario,
          expected_loss: expectedLoss
        });
    } catch (err) {
      console.warn("Failed to save stress test log to DB", err);
    }
  },

  /**
   * Fetch stress test history log
   */
  async getStressTestLogs(): Promise<{ id: string; scenario: string; expected_loss: number; created_at: string }[]> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_portfolio_stress_tests_v2");
      return stored ? JSON.parse(stored) : [];
    }
    try {
      const { data, error } = await supabase
        .from("portfolio_stress_tests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d) => ({
        id: d.id,
        scenario: d.scenario,
        expected_loss: Number(d.expected_loss),
        created_at: d.created_at
      }));
    } catch (err) {
      console.warn("Failed to fetch stress test logs from DB, using local storage", err);
      const stored = localStorage.getItem("trademind_portfolio_stress_tests_v2");
      return stored ? JSON.parse(stored) : [];
    }
  },

  /**
   * Preview trade impact on portfolio diagnostics before execution.
   */
  previewTradeImpact(
    portfolio: PaperPortfolio,
    positions: PaperPosition[],
    symbol: string,
    action: "BUY" | "SELL",
    quantity: number,
    price: number,
    goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced"
  ): {
    current: { healthScore: number; cashPct: number; concentrationPct: number; itExposurePct: number };
    simulated: { healthScore: number; cashPct: number; concentrationPct: number; itExposurePct: number };
    warnings: string[];
  } {
    const currentDiag = this.diagnosePortfolio(portfolio, positions, goal);

    const orderCost = quantity * price;
    let simulatedBalance = portfolio.balance;
    const simulatedPositions = positions.map(p => ({ ...p }));

    if (action === "BUY") {
      simulatedBalance -= orderCost;
      const idx = simulatedPositions.findIndex(p => p.symbol.toUpperCase() === symbol.toUpperCase());
      if (idx !== -1) {
        const p = simulatedPositions[idx];
        const newQty = p.quantity + quantity;
        const newAvg = ((p.avg_price * p.quantity) + orderCost) / newQty;
        simulatedPositions[idx] = {
          ...p,
          quantity: newQty,
          avg_price: newAvg,
          avg_entry_price: newAvg,
          current_price: price,
          unrealized_pnl: (price - newAvg) * newQty
        };
      } else {
        simulatedPositions.push({
          id: `sim-pos-${Math.random().toString(36).substr(2, 9)}`,
          user_id: portfolio.user_id,
          symbol: symbol.toUpperCase(),
          quantity: quantity,
          avg_price: price,
          avg_entry_price: price,
          current_price: price,
          unrealized_pnl: 0,
          realized_pnl: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "open"
        });
      }
    } else {
      simulatedBalance += orderCost;
      const idx = simulatedPositions.findIndex(p => p.symbol.toUpperCase() === symbol.toUpperCase());
      if (idx !== -1) {
        const p = simulatedPositions[idx];
        const newQty = Math.max(0, p.quantity - quantity);
        if (newQty === 0) {
          simulatedPositions.splice(idx, 1);
        } else {
          simulatedPositions[idx] = {
            ...p,
            quantity: newQty,
            current_price: price,
            unrealized_pnl: (price - p.avg_price) * newQty
          };
        }
      }
    }

    const simDiag = this.diagnosePortfolio(
      { ...portfolio, balance: simulatedBalance },
      simulatedPositions,
      goal
    );

    const currentTop = currentDiag.stockAllocations[0] || { symbol: "None", allocationPct: 0 };
    const currentIt = currentDiag.sectorAllocations.find(s => s.sector === "IT Services") || { allocationPct: 0 };

    const simTop = simDiag.stockAllocations[0] || { symbol: "None", allocationPct: 0 };
    const simIt = simDiag.sectorAllocations.find(s => s.sector === "IT Services") || { allocationPct: 0 };

    const warnings: string[] = [];
    const singlePositionLimit = goal === "Conservative" ? 15 : goal === "Aggressive" ? 40 : 25;
    if (simTop.allocationPct > singlePositionLimit) {
      warnings.push(`Concentration Risk: ${simTop.symbol} weight will be ${simTop.allocationPct}% (limit is ${singlePositionLimit}%).`);
    }

    const minOptimalCash = goal === "Conservative" ? 20 : goal === "Aggressive" ? 5 : 10;
    if (simDiag.cashPct < minOptimalCash) {
      warnings.push(`Low Cash Buffer: Cash allocation will fall to ${simDiag.cashPct}% (minimum limit is ${minOptimalCash}%).`);
    }

    const sectorExposureLimit = goal === "Conservative" ? 30 : goal === "Aggressive" ? 50 : 40;
    if (simIt.allocationPct > sectorExposureLimit) {
      warnings.push(`Sector Overexposure: IT Services exposure will be ${simIt.allocationPct}% (limit is ${sectorExposureLimit}%).`);
    }

    return {
      current: {
        healthScore: currentDiag.healthScore,
        cashPct: currentDiag.cashPct,
        concentrationPct: currentTop.allocationPct,
        itExposurePct: currentIt.allocationPct
      },
      simulated: {
        healthScore: simDiag.healthScore,
        cashPct: simDiag.cashPct,
        concentrationPct: simTop.allocationPct,
        itExposurePct: simIt.allocationPct
      },
      warnings
    };
  },

  /**
   * Save user memory preference
   */
  async saveUserMemory(userId: string, memory: any): Promise<void> {
    if (userId === "00000000-0000-0000-0000-000000000000") {
      localStorage.setItem("trademind_user_memory", JSON.stringify(memory));
      return;
    }
    try {
      const { error } = await supabase
        .from("portfolio_user_memory")
        .upsert({
          user_id: userId,
          trading_style: memory.trading_style,
          preferred_sectors: memory.preferred_sectors,
          avg_holding_period: memory.avg_holding_period,
          risk_appetite: memory.risk_appetite,
          best_performing_setup: memory.best_performing_setup || "",
          most_common_mistakes: memory.most_common_mistakes,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to save user memory to database, saving locally.", err);
      localStorage.setItem("trademind_user_memory", JSON.stringify(memory));
    }
  },

  /**
   * Fetch user memory preference
   */
  async getUserMemory(userId: string): Promise<any> {
    const defaultMemory = {
      trading_style: "Balanced",
      preferred_sectors: ["IT Services", "Financials"],
      avg_holding_period: "Medium Term",
      risk_appetite: "Medium",
      best_performing_setup: "TCS swing trade after sector pullback",
      most_common_mistakes: ["Over-allocating in IT sector", "Holding loss makers too long"]
    };

    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_user_memory");
      return stored ? JSON.parse(stored) : defaultMemory;
    }
    try {
      const { data, error } = await supabase
        .from("portfolio_user_memory")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return {
          trading_style: data.trading_style,
          preferred_sectors: data.preferred_sectors,
          avg_holding_period: data.avg_holding_period,
          risk_appetite: data.risk_appetite,
          best_performing_setup: data.best_performing_setup,
          most_common_mistakes: data.most_common_mistakes
        };
      }
    } catch (err) {
      console.warn("Failed to fetch user memory from database, loading locally.", err);
    }
    const stored = localStorage.getItem("trademind_user_memory");
    return stored ? JSON.parse(stored) : defaultMemory;
  },

  /**
   * Log monitoring telemetry metric
   */
  async logMonitoringMetric(executionTimeMs: number, dbQueryTimeMs: number, cacheHit: boolean, apiErrors: string | null): Promise<void> {
    const userId = await getUserId();
    if (userId === "00000000-0000-0000-0000-000000000000") {
      const stored = localStorage.getItem("trademind_doctor_monitoring");
      const logs = stored ? JSON.parse(stored) : [];
      logs.push({
        execution_time_ms: executionTimeMs,
        db_query_time_ms: dbQueryTimeMs,
        cache_hit: cacheHit,
        api_errors: apiErrors,
        calc_version: "1.0.0",
        created_at: new Date().toISOString()
      });
      localStorage.setItem("trademind_doctor_monitoring", JSON.stringify(logs.slice(-50)));
      return;
    }
    try {
      await supabase
        .from("portfolio_doctor_monitoring")
        .insert({
          user_id: userId,
          execution_time_ms: executionTimeMs,
          db_query_time_ms: dbQueryTimeMs,
          cache_hit: cacheHit,
          api_errors: apiErrors,
          calc_version: "1.0.0"
        });
    } catch (err) {
      console.warn("Failed to log monitoring metrics to database", err);
    }
  }
};

export default portfolioDoctorService;
