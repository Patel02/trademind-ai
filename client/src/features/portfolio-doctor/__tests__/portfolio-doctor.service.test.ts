import { describe, it, expect } from "vitest";
import { portfolioDoctorService } from "../portfolio-doctor.service";
import type { PaperPortfolio, PaperPosition } from "../../paper-trading/paper-trading.service";

describe("portfolioDoctorService score calculations", () => {
  const mockPortfolio: PaperPortfolio = {
    id: "portfolio-1",
    user_id: "user-1",
    balance: 50000,
    total_value: 110000,
    start_balance: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockPositions: PaperPosition[] = [
    {
      id: "pos-1",
      user_id: "user-1",
      symbol: "TCS",
      quantity: 10,
      avg_price: 3000,
      avg_entry_price: 3000,
      current_price: 3200,
      unrealized_pnl: 2000,
      realized_pnl: 0,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "pos-2",
      user_id: "user-1",
      symbol: "HDFCBANK",
      quantity: 20,
      avg_price: 1500,
      avg_entry_price: 1500,
      current_price: 1400,
      unrealized_pnl: -2000,
      realized_pnl: 0,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  it("should calculate correct overview balances and nav", () => {
    const diag = portfolioDoctorService.diagnosePortfolio(mockPortfolio, mockPositions, "Balanced");
    expect(diag.nav).toBe(110000); // 50000 balance + 10*3200 + 20*1400 = 110000
    expect(diag.holdingsValue).toBe(60000);
    expect(diag.holdingsCost).toBe(60000);
    expect(diag.unrealizedPnL).toBe(0);
    expect(diag.unrealizedPnLPct).toBe(0);
  });

  it("should adapt limits based on user goals", () => {
    const diagConservative = portfolioDoctorService.diagnosePortfolio(mockPortfolio, mockPositions, "Conservative");
    const diagAggressive = portfolioDoctorService.diagnosePortfolio(mockPortfolio, mockPositions, "Aggressive");

    // Conservative has tighter limits
    expect(diagConservative.concentrationRisk.limit).toBe(15);
    // Aggressive has wider limits
    expect(diagAggressive.concentrationRisk.limit).toBe(40);
  });

  it("should detect correlation alerts for correlated IT stocks", () => {
    const itCorrelatedPositions: PaperPosition[] = [
      {
        id: "pos-1",
        user_id: "user-1",
        symbol: "TCS",
        quantity: 10,
        avg_price: 3000,
        avg_entry_price: 3000,
        current_price: 3200,
        unrealized_pnl: 2000,
        realized_pnl: 0,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "pos-2",
        user_id: "user-1",
        symbol: "INFY",
        quantity: 15,
        avg_price: 1500,
        avg_entry_price: 1500,
        current_price: 1600,
        unrealized_pnl: 1500,
        realized_pnl: 0,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const diag = portfolioDoctorService.diagnosePortfolio(mockPortfolio, itCorrelatedPositions, "Balanced");
    expect(diag.correlatedAssetsAlerts.length).toBeGreaterThan(0);
    expect(diag.correlatedAssetsAlerts[0]).toContain("TCS and INFY exhibit a high correlation of 0.85");
  });

  it("should correctly preview trade impact parameters", () => {
    const preview = portfolioDoctorService.previewTradeImpact(
      mockPortfolio,
      mockPositions,
      "RELIANCE",
      "BUY",
      10,
      2500,
      "Balanced"
    );

    // Initial cash: 50000, after buy of 10 * 2500 (25000): 25000
    // Predicted cash percentage is around 25000 / 110000 = ~22.7%
    expect(preview.simulated.cashPct).toBeCloseTo(22.7, 1);
    expect(preview.current.healthScore).toBeGreaterThan(0);
    expect(preview.simulated.healthScore).toBeGreaterThan(0);
  });

  describe("individual modular sub-score calculations", () => {
    it("should calculate correct health score based on weights", () => {
      // Balanced: 0.20 * 80 + 0.30 * 90 + 0.20 * 75 + 0.15 * 85 + 0.15 * 95 = 85.0
      const health = portfolioDoctorService.calculateHealth(80, 90, 75, 85, 95, "Balanced");
      expect(health).toBe(85);
    });

    it("should calculate correct diversification score", () => {
      const stockAllocations = [
        { symbol: "TCS", value: 30000, allocationPct: 30 }
      ];
      // positionsCount = 1, targetStocksCount = 4, singlePositionLimit = 25
      // stocksRatio = 1/4 = 0.25. sectorDiversity = 1/3 = 0.333
      // penalty = (30 - 25) * 1.2 = 6
      // expected score = Math.max(10, Math.min(100, Math.round((0.25*60 + 0.3333*40) - 6))) = 22
      const result = portfolioDoctorService.calculateDiversification(1, 1, stockAllocations, 25, 4);
      expect(result.score).toBe(22);
      expect(result.level).toBe("Highly Concentrated");
      expect(result.badge).toBe("danger");
    });

    it("should calculate correct risk scores", () => {
      const stockAllocations = [{ symbol: "TCS", value: 30000, allocationPct: 30 }];
      const sectorAllocations = [{ sector: "IT Services", value: 30000, allocationPct: 30, color: "blue" }];
      // singlePositionLimit = 25, sectorExposureLimit = 40, minOptimalCash = 10
      // rawRiskScore baseline = 15.
      // Concentration penalty: (30 - 25) * 1.5 = 7.5 -> round to 8
      // Sector concentration: 30 < 40 (0 penalty)
      // Drawdown: unrealizedPnLPct = -10 < -5 -> penalty = Math.min(25, 10) = 10
      // Cash penalty: cashPct = 5 < 10 -> penalty = 15
      // expected raw = 15 + 8 + 10 + 15 = 48
      const risk = portfolioDoctorService.calculateRisk(1, stockAllocations, sectorAllocations, -10, 5, 25, 40, 10);
      expect(risk.rawRiskScore).toBe(48);
      expect(risk.riskHealthScore).toBe(52);
      expect(risk.riskIndex).toBe("Medium");
    });

    it("should calculate sector exposure score", () => {
      const sectorAllocations = [{ sector: "IT Services", value: 60000, allocationPct: 60, color: "blue" }];
      // limit = 40. IT is 60 > 40 -> penalty 20 + 15 = 35.
      // missing Financials (-15), missing Energy (-10)
      // sector balance score = 100 - 35 - 15 - 10 = 40
      const score = portfolioDoctorService.calculateSectorExposure(1, sectorAllocations, 40);
      expect(score).toBe(40);
    });

    it("should calculate cash allocation score", () => {
      const normalScore = portfolioDoctorService.calculateCashAllocation(15, 10, 30);
      expect(normalScore).toBe(100);

      // cash drag: 40 > 30 -> 100 - (40 - 30)*0.8 = 92
      const dragScore = portfolioDoctorService.calculateCashAllocation(40, 10, 30);
      expect(dragScore).toBe(92);

      // low liquidity: 5 < 10 -> 100 - (10 - 5)*4 = 80
      const lowScore = portfolioDoctorService.calculateCashAllocation(5, 10, 30);
      expect(lowScore).toBe(80);
    });

    it("should calculate position quality score", () => {
      // 2 profitable out of 3 total -> 50 + 50 * (2/3) = 83.333 -> 83
      const score = portfolioDoctorService.calculatePositionQuality(3, 2);
      expect(score).toBe(83);
    });
  });
});
