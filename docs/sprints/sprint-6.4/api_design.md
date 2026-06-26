# API Design Document — Sprint 6.4: Portfolio Doctor Pro

This document specifies the internal function interfaces and API contracts utilized by the Portfolio Doctor Pro diagnostic engine and Trade page impact calculators.

---

## 1. Local & Remote Diagnostics API

### 1.1 Diagnose Portfolio
- **Method Signature:**
  ```typescript
  diagnosePortfolio(
    portfolio: PaperPortfolio, 
    positions: PaperPosition[],
    goal: "Conservative" | "Balanced" | "Aggressive",
    history?: { health_score: number; created_at: string }[]
  ): PortfolioDiagnosis
  ```
- **Response Structure (JSON/Object):**
  ```json
  {
    "nav": 1056700.50,
    "holdingsValue": 656700.50,
    "holdingsCost": 600000.00,
    "unrealizedPnL": 56700.50,
    "unrealizedPnLPct": 9.45,
    "cashPct": 37.8,
    "healthScore": 87,
    "diversificationScore": 91,
    "riskScore": 18,
    "riskHealthScore": 82,
    "sectorBalanceScore": 85,
    "cashAllocationScore": 89,
    "positionQualityScore": 88,
    "volatilityDrag": 3.42,
    "riskIndex": "Low",
    "sectorAllocations": [
      { "sector": "IT Services", "value": 450000.00, "allocationPct": 42.6, "color": "var(--accent-yellow)" }
    ],
    "premiumMetrics": {
      "bestPerformerSymbol": "TCS",
      "bestPerformerPct": 18.25,
      "worstPerformerSymbol": "XYZ",
      "worstPerformerPct": -6.12,
      "riskContributionSymbol": "TCS",
      "riskContributionPct": 28.0,
      "healthComparison": {
        "today": 87,
        "lastMonth": 76,
        "improvementPct": 11.0
      }
    }
  }
  ```

---

## 2. Simulation APIs

### 2.1 Preview Trade Decision Impact
Calculates the immediate impact of a proposed trade before submission.
- **Method Signature:**
  ```typescript
  previewTradeImpact(
    portfolio: PaperPortfolio,
    positions: PaperPosition[],
    symbol: string,
    action: "BUY" | "SELL",
    quantity: number,
    price: number,
    goal: "Conservative" | "Balanced" | "Aggressive"
  ): {
    current: { healthScore: number; cashPct: number; concentrationPct: number; itExposurePct: number };
    simulated: { healthScore: number; cashPct: number; concentrationPct: number; itExposurePct: number };
    warnings: string[];
  }
  ```
- **Response Model:**
  ```json
  {
    "current": {
      "healthScore": 87,
      "cashPct": 15.2,
      "concentrationPct": 32.0,
      "itExposurePct": 42.0
    },
    "simulated": {
      "healthScore": 84,
      "cashPct": 11.1,
      "concentrationPct": 46.0,
      "itExposurePct": 46.0
    },
    "warnings": [
      "Concentration Risk: TCS size will increase to 46% (limit is 25%)",
      "Cash Buffer: Cash allocation falls near warning boundary at 11%"
    ]
  }
  ```
