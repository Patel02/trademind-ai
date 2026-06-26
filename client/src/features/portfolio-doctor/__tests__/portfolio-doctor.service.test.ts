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
});
