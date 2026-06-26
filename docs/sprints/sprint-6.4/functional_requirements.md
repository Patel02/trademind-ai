# Functional Requirements Document (FRD) — Sprint 6.4: Portfolio Doctor Pro

This document specifies the functional requirements for **Portfolio Doctor Pro**, defining the diagnostic engine, simulators, institutional alerts, and monthly reporting modules.

---

## 1. Feature Specifications

### 1.1 Portfolio Health Score Hero Card
- **Description:** A primary circular gauge visualization showing the overall portfolio health score from 0 to 100.
- **Score Computation Weights:**
  - Diversification: **25%** (assessing uniqueness of holdings)
  - Sector Allocation: **20%** (assessing standard sector balance)
  - Volatility Risk: **20%** (regime systematic beta & volatility drag)
  - Position Size: **15%** (concentration boundaries check)
  - Cash Allocation: **10%** (optimal liquidity reserves)
  - Position Quality: **10%** (unrealized PnL and trade setups win efficiency)
- **Visual Trends:** Next to the score, display a trend badge indicating directional change relative to the previous day/week:
  - `↑ Improving` (green)
  - `↓ Declining` (red)
  - `→ Stable` (gray)

### 1.2 Portfolio X-Ray
- **Description:** A text-based summary outlining exactly what is good (Strengths), bad/concerning (Weaknesses), or missing in the allocations.
- **Categorization Rules:**
  - **Strengths:** High diversification (>80), healthy cash levels (10-15%), well-distributed sector exposure.
  - **Weaknesses:** Concentration in single stocks (>25%), low cash (<10%), overweight sectors (>40%).
  - **Missing Hedges:** Crucial sectors like Financials or Energy & Infra holding 0% weight.

### 1.3 Sector Exposure Panel
- **Description:** A list of active sectors rendered as horizontal progress bars with allocation percentages and status markers:
  - **Overweight** (>40% allocation)
  - **Healthy** (10% to 40% allocation)
  - **Underweight** (<10% allocation)

### 1.4 Position Analysis (Quality Scores)
- **Description:** Every active stock holding receives a granular audit:
  - **Weight:** Stock value as a percentage of NAV.
  - **Contribution:** "Positive" or "Negative" based on unrealized PnL.
  - **Risk:** "Low", "Medium", or "High" (determined by ticker beta weights: TCS/INFY = Moderate, RELIANCE = Low, others = Low).
  - **Quality Rating:** A score out of 10.0 based on timing score, win rate, and price relative to entry support.

### 1.5 Rebalancing Simulator
- **Description:** Interactive slider adjustments allowing users to model hypothetical portfolio weight reallocations (e.g., IT -10%, Banking +10%) and preview simulated health scores in real time without executing any actual trades.

### 1.6 AI "What-If" Simulator
- **Description:** Interactive simulation allowing the user to select a ticker symbol and enter a transaction size (quantity of shares) to immediately calculate how that trade affects:
  - Portfolio Health Score (e.g., 87 → 91)
  - Volatility Risk Level (e.g., Medium → Low)
  - Estimated Cash Allocation % (e.g., 15% → 11%)

### 1.7 Decision Impact Simulator (CTO Feature)
- **Description:** A previewer modal triggered from the order execution panel on the **Trade Workspace** page. Before submitting a paper trade order, clicking "Preview Impact" displays:
  - Predicted Health Score change
  - Predicted Sector weight changes
  - Warning checks for Concentration Risk and Cash Buffer declines.

### 1.8 Institutional Correlation Engine
- **Description:** Scrapes holdings to detect overlapping risk profiles (e.g., simultaneously holding TCS, INFY, WIPRO). Warns the user that their diversification is structurally correlated and portfolio risk is elevated.

### 1.9 Monthly AI Report Card
- **Description:** Displays a monthly performance digest consisting of:
  - Net Valuation changes.
  - Best performing trade and worst performing trade.
  - Biggest Trading Mistake (e.g., holding losers too long).
  - Improvement recommendations.
  - Print-ready trigger action button for PDF export capability.

### 1.10 Smart Alerts Ledger
- **Description:** Real-time database-backed ledger flagging crucial boundary conditions:
  - IT sector overexposure (>40%)
  - Systematic Risk increase
  - Liquidity below safety limits (<10%)
  - Declining diversification trends
