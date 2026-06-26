# TradeMind AI v1.0 — API Facade Document

This document defines the client-side REST Facade contract API specs implemented in `client/src/api/portfolio-doctor.ts`.

---

## 1. REST Endpoints Summary

All calls require a valid Supabase JWT Session Token and respect client-side and server-side rate limits.

| Method | Endpoint | Facade Function | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/portfolio/overview` | `getPortfolioOverview(goal)` | Yes | Fetches Core NAV, Cash %, and Unrealized PnL balances. |
| **GET** | `/portfolio/health` | `getPortfolioHealth(goal)` | Yes | Returns overall health score, sub-scores, Stability, and Growth indexes. |
| **GET** | `/portfolio/xray` | `getPortfolioXRay(goal)` | Yes | Returns holdings composition and dynamic AI diagnostic suggestions. |
| **GET** | `/portfolio/sectors` | `getPortfolioSectors(goal)` | Yes | Returns sector allocations list. |
| **GET** | `/portfolio/risk` | `getPortfolioRisk(goal)` | Yes | Returns risk index levels, drawdowns, and single position boundaries. |
| **GET** | `/portfolio/history` | `getPortfolioHistory()` | Yes | Returns timeline health score snapshot data. |
| **POST** | `/portfolio/simulate` | `simulateTrade(payload, goal)` | Yes | Simulates buying/selling and previews the score/cash impact. |

---

## 2. API Contract Schema Details

### 2.1 GET `/portfolio/overview`
*   **Query Parameters:**
    *   `goal`: `"Conservative" | "Balanced" | "Aggressive"` (Optional, default `"Balanced"`)
*   **Response Payload (JSON):**
    ```json
    {
      "nav": 110000.00,
      "holdingsValue": 60000.00,
      "holdingsCost": 60000.00,
      "unrealizedPnL": 0.00,
      "unrealizedPnLPct": 0.00,
      "cashPct": 45.5
    }
    ```

### 2.2 GET `/portfolio/health`
*   **Query Parameters:**
    *   `goal`: `"Conservative" | "Balanced" | "Aggressive"`
*   **Response Payload (JSON):**
    ```json
    {
      "healthScore": 85,
      "diversificationScore": 78,
      "riskHealthScore": 88,
      "sectorBalanceScore": 80,
      "cashAllocationScore": 100,
      "positionQualityScore": 83,
      "grade": "A",
      "stabilityScore": 82,
      "growthPotentialScore": 65,
      "healthTrend": "stable"
    }
    ```

### 2.3 GET `/portfolio/xray`
*   **Response Payload (JSON):**
    ```json
    {
      "composition": [
        { "sector": "IT Services", "pct": 30.0, "state": "Healthy" },
        { "sector": "Financials", "pct": 0, "state": "Underweight" }
      ],
      "suggestions": [
        { "id": 1, "text": "High cash reserves (45.5%). Deploy idle capital.", "type": "info", "priority": "low" }
      ],
      "behaviorAnalytics": {
        "overtradingScore": 28,
        "holdingWinnersRatio": 84,
        "cuttingLossesRatio": 79,
        "sectorBias": "IT Services",
        "feedback": "Diversify out of IT Services to mitigate sector concentration."
      },
      "premiumMetrics": null,
      "correlatedAssetsAlerts": []
    }
    ```

### 2.4 GET `/portfolio/sectors`
*   **Response Payload (JSON):**
    ```json
    {
      "sectorAllocations": [
        { "sector": "IT Services", "value": 32000.00, "allocationPct": 29.1, "color": "var(--accent-yellow)" }
      ],
      "sectorBalanceScore": 80
    }
    ```

### 2.5 GET `/portfolio/risk`
*   **Response Payload (JSON):**
    ```json
    {
      "riskScore": 15,
      "riskHealthScore": 85,
      "riskIndex": "Low",
      "volatilityDrag": 2.00,
      "concentrationRisk": {
        "topHoldingSymbol": "TCS",
        "topHoldingPct": 29.1,
        "isHighRisk": true,
        "limit": 25
      },
      "correlatedAssetsAlerts": []
    }
    ```

### 2.6 POST `/portfolio/simulate`
*   **Request Payload (JSON):**
    ```json
    {
      "symbol": "RELIANCE",
      "action": "BUY",
      "quantity": 10,
      "price": 2500.00
    }
    ```
*   **Response Payload (JSON):**
    ```json
    {
      "current": {
        "healthScore": 85,
        "cashPct": 45.5,
        "concentrationPct": 29.1,
        "itExposurePct": 29.1
      },
      "simulated": {
        "healthScore": 88,
        "cashPct": 22.7,
        "concentrationPct": 29.1,
        "itExposurePct": 29.1
      },
      "warnings": []
    }
    ```
