# TradeMind AI v1.0 — Testing Document

This document describes the testing engine configurations and suites protecting the core calculations in the TradeMind AI workspace.

---

## 1. Test Runner Configuration

The workspace utilizes **Vitest** for running unit and integration tests. The configuration is defined in `client/vite.config.ts` and `client/package.json`.

To run the complete test suite:
```bash
# Execute unit tests
npm run test
```

To run tests in watch mode:
```bash
# Run tests continuously
npx vitest
```

---

## 2. Test Coverage & Suites

The primary diagnostic calculation suite is located at:
*   [portfolio-doctor.service.test.ts](file:///c:/Users/BaBa/Desktop/Projects/Trade/trademind-ai/client/src/features/portfolio-doctor/__tests__/portfolio-doctor.service.test.ts)

### 2.1 Core Diagnostics Tests
Verifies that:
1.  Overview balances and Net Asset Value (NAV) are calculated correctly.
2.  Configuration boundaries and single stock thresholds adapt dynamically according to the user's selected goal (Conservative vs. Aggressive vs. Balanced).
3.  Correlation alarms are flagged when holdings exceed sector limits (e.g. multiple IT positions representing >35% allocation).
4.  Trade impact simulation calculates correct cash percentage predictions.

### 2.2 Sub-Score Test Cases
Dedicated unit tests check the mathematical components:
*   `calculateHealth()`: Validates weighted average scores.
*   `calculateDiversification()`: Assesses stocks ratios, sector diversity, and position weight penalties.
*   `calculateRisk()`: Assesses baseline risk, drawdown penalties, and concentration risk index tags.
*   `calculateSectorExposure()`: Evaluates exposure boundaries and penalizes missing core sectors.
*   `calculateCashAllocation()`: Verifies cash drag vs liquidity warning penalization.
*   `calculatePositionQuality()`: Assesses profitability ratio calculations.
