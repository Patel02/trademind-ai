import { supabase } from "../services/supabase";
import { portfolioDoctorService } from "../features/portfolio-doctor/portfolio-doctor.service";
import { auditService } from "../security/audit.service";
import { rateLimiter } from "../security/rateLimit";
import { portfolioSimulationSchema, userMemorySchema } from "../security/validations";
import { paperTradingService } from "../features/paper-trading/paper-trading.service";

/**
 * Enterprise Portfolio Doctor API Layer Facade
 * Imitates standard REST endpoints for JWT authentication, role checks,
 * rate limiting, schema validation, audit logging, and performance monitoring.
 */
export const portfolioDoctorApi = {
  /**
   * Helper to retrieve authenticated user ID
   */
  async getAuthUserId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    } catch {
      // Fail silently
    }
    return "00000000-0000-0000-0000-000000000000";
  },

  /**
   * GET /portfolio/overview
   * Fetches core portfolio balances and NAV metrics.
   */
  async getPortfolioOverview(goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();

    // Rate Limiting: 30 requests per minute
    rateLimiter.checkLimit(`overview-${userId}`, 30, 60000);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const dbQueryTime = performance.now() - dbQueryStart;

    const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);
    const totalTime = performance.now() - startTime;

    await auditService.logAction("GET_PORTFOLIO_OVERVIEW", "portfolio", userId, {
      goal,
      nav: diag.nav
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      false,
      null
    );

    return {
      nav: diag.nav,
      holdingsValue: diag.holdingsValue,
      holdingsCost: diag.holdingsCost,
      unrealizedPnL: diag.unrealizedPnL,
      unrealizedPnLPct: diag.unrealizedPnLPct,
      cashPct: diag.cashPct
    };
  },

  /**
   * GET /portfolio/health
   * Fetches overall portfolio health scores and individual component grades.
   */
  async getPortfolioHealth(goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();

    // Rate Limiting: 30 requests per minute
    rateLimiter.checkLimit(`health-${userId}`, 30, 60000);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const history = await portfolioDoctorService.getSnapshotHistory();
    const dbQueryTime = performance.now() - dbQueryStart;

    const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal, history);
    const totalTime = performance.now() - startTime;

    await auditService.logAction("GET_PORTFOLIO_HEALTH", "portfolio", userId, {
      goal,
      healthScore: diag.healthScore
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      false,
      null
    );

    return {
      healthScore: diag.healthScore,
      diversificationScore: diag.diversificationScore,
      riskHealthScore: diag.riskHealthScore,
      sectorBalanceScore: diag.sectorBalanceScore,
      cashAllocationScore: diag.cashAllocationScore,
      positionQualityScore: diag.positionQualityScore,
      grade: diag.grade,
      stabilityScore: diag.stabilityScore,
      growthPotentialScore: diag.growthPotentialScore,
      healthTrend: diag.healthTrend
    };
  },

  /**
   * GET /portfolio/xray
   * Fetches sector composition weights and dynamic AI diagnostic suggestions.
   */
  async getPortfolioXRay(goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();

    // Rate Limiting: 30 requests per minute
    rateLimiter.checkLimit(`xray-${userId}`, 30, 60000);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const dbQueryTime = performance.now() - dbQueryStart;

    const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);
    const totalTime = performance.now() - startTime;

    await auditService.logAction("GET_PORTFOLIO_XRAY", "portfolio", userId, {
      goal,
      suggestionsCount: diag.suggestions.length
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      false,
      null
    );

    return {
      composition: diag.composition,
      suggestions: diag.suggestions,
      behaviorAnalytics: diag.behaviorAnalytics,
      premiumMetrics: diag.premiumMetrics,
      correlatedAssetsAlerts: diag.correlatedAssetsAlerts
    };
  },

  /**
   * GET /portfolio/sectors
   * Fetches sector allocations and balance metrics.
   */
  async getPortfolioSectors(goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();

    // Rate Limiting: 30 requests per minute
    rateLimiter.checkLimit(`sectors-${userId}`, 30, 60000);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const dbQueryTime = performance.now() - dbQueryStart;

    const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);
    const totalTime = performance.now() - startTime;

    await auditService.logAction("GET_PORTFOLIO_SECTORS", "portfolio", userId, {
      goal
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      false,
      null
    );

    return {
      sectorAllocations: diag.sectorAllocations,
      sectorBalanceScore: diag.sectorBalanceScore
    };
  },

  /**
   * GET /portfolio/risk
   * Fetches risk ratings, volatility drag and position ratings metrics.
   */
  async getPortfolioRisk(goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();

    // Rate Limiting: 30 requests per minute
    rateLimiter.checkLimit(`risk-${userId}`, 30, 60000);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const dbQueryTime = performance.now() - dbQueryStart;

    const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);
    const totalTime = performance.now() - startTime;

    await auditService.logAction("GET_PORTFOLIO_RISK", "portfolio", userId, {
      goal,
      riskIndex: diag.riskIndex
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      false,
      null
    );

    return {
      riskScore: diag.riskScore,
      riskHealthScore: diag.riskHealthScore,
      riskIndex: diag.riskIndex,
      volatilityDrag: diag.volatilityDrag,
      concentrationRisk: diag.concentrationRisk,
      correlatedAssetsAlerts: diag.correlatedAssetsAlerts
    };
  },

  /**
   * GET /portfolio/history
   * Fetches historical snapshot timeline records.
   */
  async getPortfolioHistory() {
    const userId = await this.getAuthUserId();

    // Rate Limiting: 30 requests per minute
    rateLimiter.checkLimit(`history-${userId}`, 30, 60000);

    const history = await portfolioDoctorService.getSnapshotHistory();

    await auditService.logAction("GET_PORTFOLIO_HISTORY", "portfolio_snapshots", userId, {
      snapshotsCount: history.length
    });

    return history;
  },

  /**
   * POST /portfolio/simulate
   * Simulates trade impact parameters.
   */
  async simulateTrade(payload: { symbol: string; action: "BUY" | "SELL"; quantity: number; price: number }, goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();

    // Rate Limiting: 10 simulation runs per 10 seconds
    rateLimiter.checkLimit(`simulate-${userId}`, 10, 10000);

    // Schema Validation
    const validated = portfolioSimulationSchema.parse(payload);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const dbQueryTime = performance.now() - dbQueryStart;

    const result = portfolioDoctorService.previewTradeImpact(
      portfolio,
      positions,
      validated.symbol,
      validated.action,
      validated.quantity,
      validated.price,
      goal
    );

    // Persistence in Supabase
    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        await supabase.from("portfolio_simulations").insert({
          user_id: userId,
          symbol: validated.symbol,
          action: validated.action,
          quantity: validated.quantity,
          price: validated.price,
          initial_health: result.current.healthScore,
          predicted_health: result.simulated.healthScore,
          initial_cash_pct: result.current.cashPct,
          predicted_cash_pct: result.simulated.cashPct
        });
      } catch (err) {
        console.warn("Failed to persist simulation record to Supabase, skipping.", err);
      }
    }

    const totalTime = performance.now() - startTime;

    await auditService.logAction("SIMULATE_TRADE_IMPACT", "simulation", userId, {
      symbol: validated.symbol,
      action: validated.action,
      qty: validated.quantity,
      price: validated.price,
      healthChange: `${result.current.healthScore} -> ${result.simulated.healthScore}`
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      true,
      null
    );

    return result;
  },

  /**
   * Backward Compatibility Facade GET /portfolio
   */
  async getPortfolioDiagnosis(goal: "Conservative" | "Balanced" | "Aggressive" = "Balanced") {
    const startTime = performance.now();
    const userId = await this.getAuthUserId();
    rateLimiter.checkLimit(`get-portfolio-${userId}`, 20, 60000);

    const dbQueryStart = performance.now();
    const portfolio = await paperTradingService.getPortfolio();
    const positions = await paperTradingService.getPositions();
    const history = await portfolioDoctorService.getSnapshotHistory();
    const dbQueryTime = performance.now() - dbQueryStart;

    const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal, history);
    const totalTime = performance.now() - startTime;

    await auditService.logAction("GET_PORTFOLIO_DIAGNOSIS", "portfolio", userId, {
      goal,
      healthScore: diag.healthScore,
      positionsCount: positions.length
    });

    await portfolioDoctorService.logMonitoringMetric(
      Math.round(totalTime),
      Math.round(dbQueryTime),
      false,
      null
    );

    return diag;
  },

  /**
   * Backward Compatibility Facade GET /portfolio/health (history snapshots)
   */
  async getHealthHistory() {
    return this.getPortfolioHistory();
  },

  /**
   * GET /portfolio/memory
   */
  async getAIMemory() {
    const userId = await this.getAuthUserId();
    return await portfolioDoctorService.getUserMemory(userId);
  },

  /**
   * POST /portfolio/memory
   */
  async updateAIMemory(payload: { trading_style: string; preferred_sectors: string[]; avg_holding_period: string; risk_appetite: string; best_performing_setup?: string; most_common_mistakes: string[] }) {
    const userId = await this.getAuthUserId();
    const validated = userMemorySchema.parse(payload);
    
    await portfolioDoctorService.saveUserMemory(userId, validated);
    
    await auditService.logAction("UPDATE_AI_MEMORY", "user_memory", userId, {
      tradingStyle: validated.trading_style,
      riskAppetite: validated.risk_appetite
    });

    return { success: true };
  }
};
